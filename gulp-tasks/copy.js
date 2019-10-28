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
			'includes/vendor/composer/autoload_classmap.php',
			'!includes/vendor/autoload.php',
			'!includes/vendor/composer/{LICENSE,ClassLoader.php}',
			'!includes/vendor/composer/autoload_{real,namespaces,psr4,static}.php',
			'third-party/**/*',
			'!third-party/**/**/{tests,Tests,doc?(s),examples}/**/*',
			'!third-party/**/**/{*.md,*.yml,phpunit.*}',
			'third-party/vendor/composer/autoload_classmap.php',
			'!third-party/vendor/autoload.php',
			'!third-party/vendor/composer/{LICENSE,ClassLoader.php}',
			'!third-party/vendor/composer/autoload_{real,namespaces,psr4,static}.php',
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
