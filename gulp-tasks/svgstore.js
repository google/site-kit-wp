import gulp from 'gulp';
import svgstore from 'gulp-svgstore';
import svgmin from 'gulp-svgmin';
import pump from 'pump';

const config = {
	input: './assets/svg/**/*.svg',
	output: './dist/assets/svg'
};

gulp.task( 'svgstore', cb => {
	pump(
		[
			gulp.src( config.input ),
			svgmin( {
				plugins: [{
					removeViewBox: false
				}]
			} ),
			svgstore( { inlineSvg: true } ),
			gulp.dest( config.output )
		],
		cb
	);
} );
