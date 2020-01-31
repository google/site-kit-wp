/**
 * External dependencies
 */
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
