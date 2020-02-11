/**
 * External dependencies
 */
import gulp from 'gulp';
import zip from 'gulp-zip';
import del from 'del';
import fs from 'fs';
import path from 'path';
import getRepoInfo from 'git-repo-info';
import sanitizeFilename from 'sanitize-filename';

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
	const { branch, date, shortSha } = getGit();

	return sanitizeFilename(
		`google-site-kit.v${ version }.${ branch }@${ shortSha }.${ date }.zip`
	);
}

gulp.task( 'zip', () => {
	const filename = generateFilename();

	// Remove any existing file by the same name.
	del.sync( path.resolve( __dirname, `../${ filename }` ) );

	// eslint-disable-next-line no-console
	console.log( `Creating ${ filename }` );

	return gulp.src( 'release/google-site-kit/**', { base: 'release/' } )
		.pipe( zip( filename ) )
		.pipe( gulp.dest( '.' ) );
} );
