/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
const TerserPlugin = require( 'terser-webpack-plugin' );

exports.createMinimizerRules = () => [
	new TerserPlugin( {
		extractComments: false,
		parallel: true,
		terserOptions: {
			// We preserve function names that start with capital letters as
			// they're _likely_ component names, and these are useful to have
			// in tracebacks and error messages.
			keep_fnames: /__|_x|_n|_nx|sprintf|^[A-Z].+$/,
			output: {
				comments: /translators:/i,
			},
		},
	} ),
];
