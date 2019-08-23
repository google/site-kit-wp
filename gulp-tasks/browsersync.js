/**
 * External dependencies
 */
import gulp from 'gulp';
import browserSync from 'browser-sync';

browserSync.create();

gulp.task( 'browser-sync', function() {
	browserSync.init( {
		proxy: 'googlekitlocal.10uplabs.com',
	} );

	gulp.watch( './assets/sass/**/*.scss', [ 'build' ] );
	gulp.watch( './assets/js/**/*.js', [ 'build' ] );
	gulp.watch( './assets/js/modules/**/*.js', [ 'build' ] );

	gulp.watch( './dist/assets/css/*.css' ).on( 'change', () => {
		browserSync.reload( '*.css' );
	} );
} );
