const gulp = require( 'gulp' );
const phpcs = require( 'gulp-phpcs' );

gulp.task( 'phpcs', function() {
	return gulp.src( [ '*.php', '**/*.php', '!vendor/**/*.*', '!node_modules/**' ] )

	// Validate files using PHP Code Sniffer
		.pipe( phpcs( {
			bin: 'vendor/bin/phpcs',
		} ) )
		.pipe( phpcs.reporter( 'log' ) )
		.pipe( phpcs.reporter( 'fail', { failOnFirst: false } ) );
} );
