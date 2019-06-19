import gulp from 'gulp';
import zip from 'gulp-zip';
import del from 'del';

gulp.task( 'pre-zip', () => {

	del.sync( [ './release/google-site-kit/**' ] );

	return gulp.src( 'release/**' )
		.pipe( gulp.dest( 'release/google-site-kit/' ) );
} );

gulp.task( 'zip', () => {

	gulp.src(
		[ 'release/google-site-kit/**' ],
		{ base: 'release/' }
	)
		.pipe( zip( 'google-site-kit.zip' ) )
		.pipe( gulp.dest( './' ) );

} );

gulp.task( 'pre-zip-wp50', () => {

	del.sync( [ './release/google-site-kit-wp50/**' ] );

	return gulp.src( [
		'release/**',
		'!release/dist/assets/vendor',
		'!release/dist/assets/vendor/**',
		'!release/dist/assets/js/externals/!(svgxuse.js)',
	] )
		.pipe( gulp.dest( 'release/google-site-kit-wp50/' ) );
} );

gulp.task( 'zip-wp50', () => {

	gulp.src(
		[ 'release/google-site-kit-wp50/**' ],
		{ base: 'release/' }
	)
		.pipe( zip( 'google-site-kit-wp50.zip' ) )
		.pipe( gulp.dest( './' ) );

} );

