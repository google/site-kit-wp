/**
 * Block editor config webpack partial.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
const CircularDependencyPlugin = require( 'circular-dependency-plugin' );
const ESLintPlugin = require( 'eslint-webpack-plugin' );
const ManifestPlugin = require( 'webpack-manifest-plugin' );
const WebpackBar = require( 'webpackbar' );

/**
 * Internal dependencies
 */
const {
	rootDir,
	manifestArgs,
	resolve,
	gutenbergExternals,
	createRules,
	createMinimizerRules,
} = require( './common' );

module.exports = ( mode ) => ( {
	entry: {
		'googlesitekit-reader-revenue-manager-block-editor':
			'./assets/js/googlesitekit-reader-revenue-manager-block-editor.js',
	},
	externals: gutenbergExternals,
	output: {
		filename:
			mode === 'production' ? '[name]-[contenthash].js' : '[name].js',
		path: rootDir + '/dist/assets/js',
		publicPath: '',
		// If multiple webpack runtimes (from different compilations) are used on the
		// same webpage, there is a risk of conflicts of on-demand chunks in the global
		// namespace.
		// See: https://webpack.js.org/configuration/output/#outputjsonpfunction.
		jsonpFunction: '__googlesitekit_block_editor_webpackJsonp',
	},
	performance: {
		maxEntrypointSize: 175000,
	},
	module: {
		rules: createRules( mode ),
	},
	plugins: [
		new WebpackBar( {
			name: 'Block Editor Entry Points',
			color: '#ffc0cb',
		} ),
		new CircularDependencyPlugin( {
			exclude: /node_modules/,
			failOnError: true,
			allowAsyncCycles: false,
			cwd: process.cwd(),
		} ),
		new ManifestPlugin( {
			...manifestArgs( mode ),
			filter( file ) {
				return ( file.name || '' ).match( /\.js$/ );
			},
		} ),
		new ESLintPlugin( {
			emitError: true,
			emitWarning: true,
			failOnError: true,
		} ),
	],
	optimization: {
		minimizer: createMinimizerRules( mode ),
	},
	resolve,
} );
