/**
 * External dependencies
 */
import gulp from 'gulp';
import del from 'del';

gulp.task( 'copy-vendor', () => {
	del.sync( [ 'dist/assets/vendor/*' ] );
	gulp.src( [
		// Update React with the version installed in
		// `node_modules/`/`package.json`.
		'node_modules/react/umd/react.development.js',
		'node_modules/react/umd/react.production.min.js',
		'node_modules/react-dom/umd/react-dom.development.js',
		'node_modules/react-dom/umd/react-dom.production.min.js',
	] )
		.pipe( gulp.dest( 'assets/vendor/' ) );
	gulp.src( 'assets/vendor/*' )
		.pipe( gulp.dest( 'dist/assets/vendor/' ) );
} );
