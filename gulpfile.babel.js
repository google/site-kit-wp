/**
 * Gulp config.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import gulp from 'gulp';
import qunit from 'node-qunit-phantomjs';
import requireDir from 'require-dir';
import runSequence from 'run-sequence';
import livereload from 'gulp-livereload';
var phpunit = require( 'gulp-phpunit' );

requireDir( './gulp-tasks' );

/**
 * Gulp task to run all SVG processes in a sequential order.
 */
gulp.task( 'build', () => {
	runSequence(
		'webpack',
		'svg',
		'imagemin',
		'copy-vendor'
	);
} );

/**
 * Gulp task to watch for file changes and run the associated processes.
 */
gulp.task( 'watch', () => {
	livereload.listen( { basePath: 'dist' } );
	gulp.watch( './assets/sass/**/*.scss', [ 'build' ] );
	gulp.watch( './assets/svg/**/*.svg', [ 'build' ] );
	gulp.watch( './assets/js/*.js', [ 'build' ] );
	gulp.watch( './assets/js/modules/**/*.js', [ 'build' ] );
} );

/**
 * Gulp task to livereload file changes in browser.
 */
gulp.task( 'local', () => {
	runSequence(
		'build',
		'browser-sync'
	);
} );

/**
 * Gulp task to minify and combine svg's.
 */
gulp.task( 'svg', () => {
	runSequence( 'svgstore' );
	runSequence( 'svgmin' );
} );

/**
 * Gulp task to run the default release processes in a sequential order.
 */
gulp.task( 'release', () => {
	runSequence(
		'svg',
		'imagemin',
		'copy-vendor'
	);
} );

/**
 * Gulp task to run the default build processes in a sequential order.
 */
gulp.task( 'default', () => {
	runSequence(
		'webpack',
		'phpcs',
		'copy-vendor'
	);
} );

gulp.task( 'qunit', function() {
	return qunit( './tests/qunit/index.html' );
} );

gulp.task( 'phpunit', function() {
	gulp.src( '' )
		.pipe( phpunit( './vendor/bin/phpunit' ) );
} );

/**
 * Gulp task to run the default tests.
 */
gulp.task( 'test', () => {
	runSequence(
		'qunit',
		'phpunit'
	);
} );

