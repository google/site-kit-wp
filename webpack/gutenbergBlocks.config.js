/**
 * Gutenberg Blocks config webpack partial.
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
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const ESLintPlugin = require( 'eslint-webpack-plugin' );
const ManifestPlugin = require( 'webpack-manifest-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
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
		// Reader Revenue Manager
		'googlesitekit-reader-revenue-manager-block-editor':
			'./assets/js/googlesitekit-reader-revenue-manager-block-editor.js',
		// Sign in with Google block.
		'sign-in-with-google/index': './blocks/sign-in-with-google/index.js',
		'sign-in-with-google/editor-styles':
			'./blocks/sign-in-with-google/editor-styles.scss',
	},
	externals: gutenbergExternals,
	output: {
		filename:
			mode === 'production' ? '[name]-[contenthash].js' : '[name].js',
		path: rootDir + '/dist/assets/js/blocks',
		publicPath: '',
	},
	module: {
		rules: [
			...createRules( mode ),
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					'postcss-loader',
					{
						loader: 'sass-loader',
						options: {
							implementation: require( 'sass' ),
							sassOptions: {
								includePaths: [ 'node_modules' ],
							},
						},
					},
				],
			},
		],
	},
	plugins: [
		new WebpackBar( {
			name: 'Gutenberg Blocks Entry Points',
			color: '#deff13',
		} ),
		new CircularDependencyPlugin( {
			exclude: /node_modules/,
			failOnError: true,
			allowAsyncCycles: false,
			cwd: process.cwd(),
		} ),
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: 'blocks/**/block.json',
					to: ( { context, absoluteFilename } ) => {
						return absoluteFilename.replace(
							`${ context }/blocks`,
							`${ rootDir }/dist/assets/js/blocks`
						);
					},
				},
			],
		} ),
		new ManifestPlugin( {
			...manifestArgs( mode ),
			filter( file ) {
				return ( file.name || '' ).match( /\.js$/ );
			},
		} ),
		new MiniCssExtractPlugin( {
			filename:
				'production' === mode
					? '[name]-[contenthash].min.css'
					: '[name].css',
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
