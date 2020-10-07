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
const imagemin = require( 'gulp-imagemin' );
const pump = require( 'pump' );
const del = require( 'del' );

/**
 * Gulp tasks.
 */
const copy = require( './copy' );
const svgmin = require( './svgmin' );
const svgstore = require( './svgstore' );
const zip = require( './zip' );

/**
 * Removes the release folder.
 *
 * @since 1.0.0
 *
 * @param {Function} cb The callback indicating the end of the task execution.
 */
function cleanRelease( cb ) {
	del.sync( './release/**' );
	cb();
}

/**
 * Gulp task to minify images.
 *
 * @since 1.0.0
 *
 * @param {Function} cb The callback indicating the end of the task execution.
 */
exports.imagemin = function( cb ) {
	pump(
		[
			gulp.src( './assets/images/*' ),
			imagemin(),
			gulp.dest( './dist/assets/images' ),
		],
		cb
	);
};

/**
 * Gulp task to minify and combine svg's.
 */
exports.svg = gulp.series(
	svgstore,
	svgmin,
);

/**
 * Gulp task to run the default release processes in a sequential order.
 */
exports.release = gulp.series(
	cleanRelease,
	copy,
	zip,
	cleanRelease,
);
