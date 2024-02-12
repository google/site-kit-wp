/**
 * Test Bundle config webpack partial.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
const WebpackBar = require( 'webpackbar' );

/**
 * Internal dependencies
 */
const { rootDir, externals, resolve, createRules } = require( './common' );

module.exports = ( mode ) => ( {
	entry: {
		'e2e-api-fetch': './tests/e2e/assets/e2e-api-fetch.js',
		'e2e-redux-logger': './tests/e2e/assets/e2e-redux-logger.js',
	},
	output: {
		filename: '[name].js',
		path: rootDir + '/dist/assets/js',
		chunkFilename: '[name].js',
		publicPath: '',
	},
	module: {
		rules: createRules( mode ),
	},
	plugins: [
		new WebpackBar( {
			name: 'Test files',
			color: '#34a853',
		} ),
	],
	externals,
	resolve,
} );
