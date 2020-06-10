/**
 * External dependencies
 */
const gulp = require( 'gulp' );

module.exports = function() {
	const globs = [
		'readme.txt',
		'google-site-kit.php',
		'dist/*.js',
		'dist/assets/**/*',
		'bin/**/*',
		'includes/**/*',
		'third-party/**/*',
		'!third-party/**/**/{tests,Tests,doc?(s),examples}/**/*',
		'!third-party/**/**/{*.md,*.yml,phpunit.*}',
		'!**/*.map',
		'!bin/local-env/**/*',
		'!bin/local-env/',
		'!dist/admin.js',
		'!dist/adminbar.js',
		'!dist/wpdashboard.js',
	];

	return gulp.src( globs, { base: '.' } ).pipe( gulp.dest( 'release/google-site-kit' ) );
};
