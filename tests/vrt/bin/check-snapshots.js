#!/usr/bin/env node

/**
 * Checks the visual regression reference images against the scenarios.
 *
 * Reports reference images without a scenario (orphans, e.g. from a renamed
 * story) and scenarios without a reference image. With `--prune`, deletes the
 * orphans. With `--build`, also checks that every scenario's story is in the
 * Storybook build.
 *
 * Usage: node tests/vrt/bin/check-snapshots.js [--prune] [--build]
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable no-console */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { ROOT_DIR, SCREENSHOTS_DIR } = require( '../constants' );
const { getScenarios, validateAgainstBuild } = require( '../scenarios' );

const prune = process.argv.includes( '--prune' );
const checkBuild = process.argv.includes( '--build' );

/**
 * Lists the PNG files in a directory and its subdirectories.
 *
 * @since n.e.x.t
 *
 * @param {string} directory The directory.
 * @return {string[]} File paths, relative to `SCREENSHOTS_DIR`.
 */
function listPNGs( directory ) {
	if ( ! fs.existsSync( directory ) ) {
		return [];
	}

	return fs
		.readdirSync( directory, { withFileTypes: true } )
		.flatMap( ( entry ) => {
			const entryPath = path.join( directory, entry.name );

			if ( entry.isDirectory() ) {
				return listPNGs( entryPath );
			}

			return entry.name.endsWith( '.png' )
				? [ path.relative( SCREENSHOTS_DIR, entryPath ) ]
				: [];
		} );
}

/**
 * Removes empty directories below `SCREENSHOTS_DIR`.
 *
 * @since n.e.x.t
 *
 * @param {string} directory The directory to start from.
 */
function removeEmptyDirectories( directory ) {
	for ( const entry of fs.readdirSync( directory, { withFileTypes: true } ) ) {
		if ( entry.isDirectory() ) {
			removeEmptyDirectories( path.join( directory, entry.name ) );
		}
	}

	if (
		directory !== SCREENSHOTS_DIR &&
		! fs.readdirSync( directory ).length
	) {
		fs.rmdirSync( directory );
	}
}

const expected = new Set(
	getScenarios().flatMap( ( scenario ) =>
		scenario.viewports.map( ( viewport ) =>
			path.join( ...scenario.slug, `${ viewport }.png` )
		)
	)
);
const actual = new Set( listPNGs( SCREENSHOTS_DIR ) );

const orphans = [ ...actual ].filter( ( file ) => ! expected.has( file ) );
const missing = [ ...expected ].filter( ( file ) => ! actual.has( file ) );
const relativeDir = path.relative( ROOT_DIR, SCREENSHOTS_DIR );

if ( orphans.length ) {
	console.log(
		`${ orphans.length } reference image(s) without a scenario${
			prune ? ', deleted' : ''
		}:`
	);
	orphans.sort().forEach( ( file ) => console.log( `  ${ file }` ) );

	if ( prune ) {
		orphans.forEach( ( file ) =>
			fs.unlinkSync( path.join( SCREENSHOTS_DIR, file ) )
		);
		removeEmptyDirectories( SCREENSHOTS_DIR );
	}
}

if ( missing.length ) {
	console.log( `${ missing.length } scenario(s) without a reference image:` );
	missing.sort().forEach( ( file ) => console.log( `  ${ file }` ) );
	console.log(
		'Create them with `npm run test:visualapprove -- --grep "<story label>"`.'
	);
}

if ( ! orphans.length && ! missing.length ) {
	console.log(
		`All ${ expected.size } reference images in ${ relativeDir } match the scenarios.`
	);
}

const buildProblems = checkBuild ? validateAgainstBuild( getScenarios() ) : [];

buildProblems.forEach( ( problem ) => console.log( problem ) );

// When pruning, missing reference images are about to be created, so they don't
// fail the check.
process.exitCode =
	buildProblems.length || ( ! prune && ( missing.length || orphans.length ) )
		? 1
		: 0;
