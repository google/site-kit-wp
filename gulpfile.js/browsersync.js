/**
 * External dependencies
 */
const { watch } = require( 'gulp' );
const browserSync = require( 'browser-sync' );

browserSync.create();

module.exports = function() {
	browserSync.init( {
		proxy: 'googlekitlocal.10uplabs.com',
	} );

	watch( './assets/sass/**/*.scss', [ 'build' ] );
	watch( './assets/js/**/*.js', [ 'build' ] );
	watch( './assets/js/modules/**/*.js', [ 'build' ] );

	watch( './dist/assets/css/*.css' ).on( 'change', () => {
		browserSync.reload( '*.css' );
	} );
};
