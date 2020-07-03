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
