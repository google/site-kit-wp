/**
 * External dependencies
 */
import gulp from 'gulp';
import del from 'del';

gulp.task( 'copy', () => {
	del.sync( [ './release/**/*' ] );

	gulp.src(
		[
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
		],
		{ base: '.' }
	)
		.pipe( gulp.dest( 'release' ) );
} );
