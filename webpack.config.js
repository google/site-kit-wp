/**
 * Webpack config.
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
 * Node dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * External dependencies
 */
const glob = require( 'glob' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const WebpackBar = require( 'webpackbar' );
const { ProvidePlugin } = require( 'webpack' );

// This External Libraries will not part of wp object. Most of this is for Polyfill.
const externalLibrary = {
	'wp-polyfill': './node_modules/@babel/polyfill/dist/polyfill.js',
	'wp-polyfill-fetch': './node_modules/whatwg-fetch/dist/fetch.umd.js',
	'wp-polyfill-element-closest': './node_modules/element-closest/element-closest.js',
	'wp-polyfill-node-contains': './node_modules/polyfill-library/polyfills/Node/prototype/contains/polyfill.js',
	'wp-polyfill-formdata': './node_modules/formdata-polyfill/FormData.js',
	'wp-polyfill-url': './node_modules/url-polyfill/url-polyfill.js',
	svgxuse: './node_modules/svgxuse/svgxuse.js',
};

const projectPath = ( relativePath ) => {
	return path.resolve( fs.realpathSync( process.cwd() ), relativePath );
};

const resolve = {
	alias: {
		'@wordpress/api-fetch__non-shim': require.resolve( '@wordpress/api-fetch' ),
		'@wordpress/api-fetch$': path.resolve( 'assets/js/api-fetch-shim.js' ),
		'@wordpress/hooks__non-shim': require.resolve( '@wordpress/hooks' ),
		'@wordpress/hooks$': path.resolve( 'assets/js/hooks-shim.js' ),
		SiteKitCore: path.resolve( 'assets/js/' ),
		GoogleComponents: path.resolve( 'assets/js/components/' ),
		GoogleUtil: path.resolve( 'assets/js/util/' ),
		GoogleModules: path.resolve( './assets/js/modules/' ),
	},
	modules: [ projectPath( '.' ), 'node_modules' ],
};

module.exports = ( env, argv ) => {
	return [
		// Build the settings js..
		{
			entry: {
				// New Modules (Post-JSR).
				'googlesitekit-api': './assets/js/googlesitekit-api.js',
				// Old Modules
				'googlesitekit-activation': './assets/js/googlesitekit-activation.js',
				'googlesitekit-settings': './assets/js/googlesitekit-settings.js',
				'googlesitekit-dashboard': './assets/js/googlesitekit-dashboard.js',
				'googlesitekit-dashboard-details': './assets/js/googlesitekit-dashboard-details.js',
				'googlesitekit-dashboard-splash': './assets/js/googlesitekit-dashboard-splash.js',
				'googlesitekit-wp-dashboard': './assets/js/googlesitekit-wp-dashboard.js',
				'googlesitekit-adminbar-loader': './assets/js/googlesitekit-adminbar-loader.js',
				'googlesitekit-admin': './assets/js/googlesitekit-admin.js',
				'googlesitekit-module': './assets/js/googlesitekit-module.js',
				ads: './assets/js/ads.js',
				allmodules: glob.sync( './assets/js/modules/**/*.js' ),
			},
			output: {
				filename: '[name].js',
				path: __dirname + '/dist/assets/js',
				chunkFilename: '[name]-[chunkhash].js',
				publicPath: '',
			},
			performance: {
				maxEntrypointSize: 175000,
			},
			module: {
				rules: [
					{
						test: /\.js$/,

						use: [
							{
								loader: 'babel-loader',
								query: {
									presets: [ [ '@babel/env', {
										useBuiltIns: 'entry',
										corejs: 2,
									} ], '@babel/preset-react' ],
								},
							},
							{
								loader: 'eslint-loader',
								options: {
									formatter: require( 'eslint' ).CLIEngine.getFormatter( 'stylish' ),
								},
							},
						],
						parser: { amd: false },
					},
				],
			},
			plugins: ( env && env.analyze ) ? [] : [
				new ProvidePlugin( {
					React: 'react',
				} ),
				new WebpackBar( {
					name: 'Module Entry Points',
					color: '#fbbc05',
				} ),
			],
			optimization: {
				minimizer: [
					new TerserPlugin( {
						parallel: true,
						sourceMap: false,
						cache: true,
						terserOptions: {
							keep_fnames: /__|_x|_n|_nx|sprintf/,
							output: {
								comments: /translators:/i,
							},
						},
						extractComments: false,
					} ),
				],
			},
			// externals,
			resolve,
		},

		// Build the test files.
		{
			entry: {
				'googlesitekit-tests': './assets/js/googlesitekit-tests.js',
				'e2e-utilities': './tests/e2e/e2e-utilities.js',
			},
			output: {
				filename: '[name].js',
				path: __dirname + '/dist/assets/js',
				chunkFilename: '[name].js',
				publicPath: '',
			},
			module: {
				rules: [
					{
						test: /\.js$/,

						use: [
							{
								loader: 'babel-loader',
								query: {
									presets: [ [ '@babel/env', {
										useBuiltIns: 'entry',
										corejs: 2,
									} ], '@babel/preset-react' ],
								},
							},
							{
								loader: 'eslint-loader',
								options: {
									formatter: require( 'eslint' ).CLIEngine.getFormatter( 'stylish' ),
								},
							},
						],
					},
				],
			},
			plugins: ( env && env.analyze ) ? [] : [
				new WebpackBar( {
					name: 'Test files',
					color: '#34a853',
				} ),
			],
			resolve,
		},

		// Build the external wp libraries
		// {
		// 	entry: externalEntry,
		// 	output: {
		// 		filename: '[name].js',
		// 		path: __dirname + '/dist/assets/js/externals',
		// 		library: [ 'wp', '[name]' ],
		// 		libraryTarget: 'this',
		// 	},
		// 	plugins: ( env && env.analyze ) ? [
		// 		new LibraryExportDefaultPlugin( [
		// 			'api-fetch',
		// 			'dom-ready',
		// 		].map( camelCaseDash ) ),
		// 	] : [
		// 		new LibraryExportDefaultPlugin( [
		// 			'api-fetch',
		// 			'dom-ready',
		// 		].map( camelCaseDash ) ),
		// 		new WebpackBar( {
		// 			name: 'External WP Libraries',
		// 			color: '#d53e36',
		// 		} ),
		// 	],
		// 	externals,
		// },

		// Build the external libraries
		{
			entry: externalLibrary,
			output: {
				filename: '[name].js',
				path: __dirname + '/dist/assets/js/externals',
			},
			plugins: ( env && env.analyze ) ? [] : [
				new WebpackBar( {
					name: 'External Libraries',
					color: '#4185f4',
				} ) ],
			// externals,
		},

		// Build the main plugin admin css.
		{
			entry: {
				admin: './assets/sass/admin.scss',
				adminbar: './assets/sass/adminbar.scss',
				wpdashboard: './assets/sass/wpdashboard.scss',
			},
			module: {
				rules: [
					{
						test: /\.scss$/,
						use: [
							MiniCssExtractPlugin.loader,
							{
								loader: 'css-loader',
								options: {
									minimize: ( 'undefined' === typeof argv || 'production' === argv.mode ),
								},
							},
							'postcss-loader',
							{
								loader: 'sass-loader',
								options: {
									includePaths: [ 'node_modules' ],
								},
							},
						],
					},
					{
						test: /\.(png|woff|woff2|eot|ttf|svg|gif)$/,
						use: { loader: 'url-loader?limit=100000' },
					},
				],
			},
			plugins: ( env && env.analyze ) ? [
				new MiniCssExtractPlugin( {
					filename: '/assets/css/[name].css',
				} ),
			] : [
				new MiniCssExtractPlugin( {
					filename: '/assets/css/[name].css',
				} ),
				new WebpackBar( {
					name: 'Plugin CSS',
					color: '#4285f4',
				} ),
			],
		},
	];
};
