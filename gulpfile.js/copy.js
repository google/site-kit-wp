/**
 * Gulp copy task.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

module.exports = function() {
	const globs = [
		'readme.txt',
		'google-site-kit.php',
		'dist/*.js',
		'dist/assets/**/*',
		'includes/**/*',
		'third-party/**/*',
		'!third-party/**/**/{tests,Tests,doc?(s),examples}/**/*',
		'!third-party/**/**/{*.md,*.yml,phpunit.*}',
		'!**/*.map',
		'!dist/admin.js',
		'!dist/adminbar.js',
		'!dist/wpdashboard.js',
	];

	return gulp.src( globs, { base: '.' } ).pipe( gulp.dest( 'release/google-site-kit' ) );
};
