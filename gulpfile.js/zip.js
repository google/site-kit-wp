/**
 * Gulp zip task.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
const gulp = require( 'gulp' );
const zip = require( 'gulp-zip' );
const del = require( 'del' );
const fs = require( 'fs' );
const path = require( 'path' );
const getRepoInfo = require( 'git-repo-info' );
const sanitizeFilename = require( 'sanitize-filename' );

/**
 * Retrieves the plugin version from the plugin's file header.
 *
 * @since 1.0.0
 *
 * @return {string} Plugin version.
 */
function getPluginVersion() {
	return fs.readFileSync( path.resolve( __dirname, '../google-site-kit.php' ), 'utf8' )
		.match( /Version:\s+([0-9\.\w-]+)/ )
		[ 1 ];
}

/**
 * Retrieves and prepares information from the current git state
 * for use as components of the generated file name.
 *
 * @since 1.0.0
 *
 * @return {Object} Data related to the latest commit.
 */
function getGit() {
	const { abbreviatedSha, branch } = getRepoInfo();

	return {
		branch: sanitizeFilename( branch, { replacement: '-' } ),
		shortSha: abbreviatedSha,
	};
}

/**
 * Generates the filename to use for the resulting release zip file.
 *
 * @since 1.0.0
 *
 * @return {string} Sanitized release zip file name.
 */
function generateFilename() {
	const version = getPluginVersion();

	let gitSuffix = '';
	try {
		const { branch, shortSha } = getGit();
		gitSuffix = `.${ branch }@${ shortSha }`;
	} catch {}

	return sanitizeFilename(
		`google-site-kit.v${ version }${ gitSuffix }.zip`
	);
}

module.exports = function() {
	const filename = generateFilename();

	// Remove any existing file by the same name.
	del.sync( path.resolve( __dirname, `../${ filename }` ) );

	// eslint-disable-next-line no-console
	console.log( `Creating ${ filename }` );

	return gulp.src( 'release/google-site-kit/**', { base: 'release/' } )
		.pipe( zip( filename ) )
		.pipe( gulp.dest( '.' ) );
};
