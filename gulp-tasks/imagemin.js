/**
 * External dependencies
 */
import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import pump from 'pump';

const config = {
	input: './assets/images/*',
	output: './dist/assets/images',
};

gulp.task( 'imagemin', ( cb ) => {
	pump(
		[
			gulp.src( config.input ),
			imagemin(),
			gulp.dest( config.output ),
		],
		cb
	);
} );
