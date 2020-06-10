/**
 * External dependencies
 */
const webpack = require( 'webpack' );
const gutil = require( 'gulp-util' );

/**
 * Internal dependencies
 */
const config = require( '../webpack.config.js' );

module.exports = function( callback ) {
	// run webpack
	webpack(
		config(),
		function( err, stats ) {
			if ( err ) {
				throw new gutil.PluginError( 'webpack', err );
			}
			gutil.log( '[webpack]', stats.toString( {

				// output options
			} ) );
			callback();
		}
	);
};
