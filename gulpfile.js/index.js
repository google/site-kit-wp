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

/**
 * External dependencies
 */
const gulp = require( 'gulp' );
const livereload = require( 'gulp-livereload' );
const del = require( 'del' );

/**
 * Gulp tasks
 */
const browserSync = require( './browsersync' );
const copy = require( './copy' );
const imagemin = require( './imagemin' );
const svgmin = require( './svgmin' );
const svgstore = require( './svgstore' );
const webpack = require( './webpack' );
const zip = require( './zip' );

/**
 * Export loaded gulp tasks
 */
exports['browser-sync'] = browserSync;
exports.copy = copy;
exports.imagemin = imagemin;
exports.svgmin = svgmin;
exports.svgstore = svgstore;
exports.webpack = webpack;
exports.zip = zip;

/**
 * Shared tasks
 */
const svg = gulp.series(
	svgstore,
	svgmin,
);

const build = gulp.series(
	webpack,
	svg,
	imagemin,
);

function cleanRelease( cb ) {
	del.sync( './release/**' );
	cb();
}

/**
 * Gulp task to run all SVG processes in a sequential order.
 */
exports.build = build;

/**
 * Gulp task to watch for file changes and run the associated processes.
 */
exports.watch = function() {
	livereload.listen( { basePath: 'dist' } );
	gulp.watch( './assets/sass/**/*.scss', [ 'build' ] );
	gulp.watch( './assets/svg/**/*.svg', [ 'build' ] );
	gulp.watch( './assets/js/*.js', [ 'build' ] );
	gulp.watch( './assets/js/modules/**/*.js', [ 'build' ] );
};

/**
 * Gulp task to livereload file changes in browser.
 */
exports.local = gulp.series(
	build,
	browserSync,
);

/**
 * Gulp task to minify and combine svg's.
 */
exports.svg = svg;

/**
 * Gulp task to delete the temporary release directory.
 */
exports['clean-release'] = cleanRelease;

/**
 * Gulp task to run the default release processes in a sequential order.
 */
exports.release = gulp.series(
	cleanRelease,
	copy,
	zip,
	cleanRelease,
);
