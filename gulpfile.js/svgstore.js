/**
 * Gulp svgstore task.
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
const { src, dest } = require( 'gulp' );
const svgstore = require( 'gulp-svgstore' );
const svgmin = require( 'gulp-svgmin' );
const pump = require( 'pump' );

const config = {
	input: './assets/svg/**/*.svg',
	output: './dist/assets/svg',
};

module.exports = function( cb ) {
	pump(
		[
			src( config.input ),
			svgmin( {
				plugins: [ {
					removeViewBox: false,
				} ],
			} ),
			svgstore( { inlineSvg: true } ),
			dest( config.output ),
		],
		cb
	);
};
