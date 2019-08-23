/**
 * External dependencies
 */
import gulp from 'gulp';
import svgmin from 'gulp-svgmin';
import pump from 'pump';

const config = {
	input: './assets/svg/**/*.svg',
	output: './dist/assets/svg',
};

gulp.task( 'svgmin', ( cb ) => {
	pump(
		[
			gulp.src( config.input ),
			svgmin( {
				plugins: [ {
					removeViewBox: false,
				} ],
			} ),
			gulp.dest( config.output ),
		],
		cb
	);
} );
