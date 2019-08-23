/**
 * External dependencies
 */
import gulp from 'gulp';
import webpack from 'webpack';
import gutil from 'gulp-util';

/**
 * Internal dependencies
 */
import config from '../webpack.config.js';

gulp.task( 'webpack', function( callback ) {
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
} );
