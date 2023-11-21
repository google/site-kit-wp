/**
 * Common Module tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

function directories( relativePath ) {
	const dir = path.join( __dirname, relativePath );
	if ( ! fs.existsSync( dir ) ) {
		return [];
	}

	return fs
		.readdirSync( dir, { withFileTypes: true } )
		.filter( ( file ) => file.isDirectory() )
		.map( ( file ) => file.name );
}

function getComponentNames( componentPath ) {
	return fs
		.readdirSync( componentPath )
		.filter(
			( name ) =>
				! /^index|utils|__snapshots__|\.(stories|test)\.js$/.test(
					name
				)
		)
		.map( ( name ) => name.replace( /\..*/, '' ) );
}

describe( 'all modules', () => {
	describe.each( directories( '.' ) )( '%s', ( moduleSlug ) => {
		const components = directories( `${ moduleSlug }/components` );

		// Filter out the custom-dimensions-report-options directory
		const filteredComponents = components.filter(
			( component ) => component !== 'custom-dimensions-report-options'
		);

		if ( ! filteredComponents.length ) {
			return;
		}

		it.each( filteredComponents )(
			'components/%s has an index module with all components exported',
			( componentDir ) => {
				const componentDirPath = path.join(
					__dirname,
					moduleSlug,
					'components',
					componentDir
				);

				const {
					// eslint-disable-next-line no-unused-vars
					default: _,
					...indexExports
				} = require( `${ componentDirPath }/index.js` );
				const indexExportNames = Object.keys( indexExports ).sort();
				const componentNames =
					getComponentNames( componentDirPath ).sort();

				const filteredComponentNames = componentNames.filter(
					( component ) =>
						component !== 'custom-dimensions-report-options'
				);

				expect( indexExportNames ).toEqual( filteredComponentNames );
			}
		);
	} );
} );
