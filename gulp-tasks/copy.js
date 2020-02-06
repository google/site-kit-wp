/**
 * External dependencies
 */
import gulp from 'gulp';

gulp.task( 'copy', () => {
	gulp.src(
		[
			'readme.txt',
			'google-site-kit.php',
			'uninstall.php',
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
		],
		{ base: '.' }
	)
		.pipe( gulp.dest( 'release' ) );
} );
