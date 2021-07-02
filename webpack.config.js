/**
 * Webpack config.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
const CircularDependencyPlugin = require( 'circular-dependency-plugin' );
const ESLintPlugin = require( 'eslint-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const WebpackBar = require( 'webpackbar' );
const { DefinePlugin, ProvidePlugin } = require( 'webpack' );
const CreateFileWebpack = require( 'create-file-webpack' );
const ManifestPlugin = require( 'webpack-manifest-plugin' );
const features = require( './feature-flags.json' );

const projectPath = ( relativePath ) => {
	return path.resolve( fs.realpathSync( process.cwd() ), relativePath );
};

const manifestTemplate = `<?php
/**
 * Class Google\\Site_Kit\\Core\\Assets\\Manifest
 *
 * @package   Google\Site_Kit
 * @copyright ${ ( new Date() ).getFullYear() } Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\\Site_Kit\\Core\\Assets;

/**
 * Assets manifest.
 *
 * @since 1.15.0
 * @access private
 * @ignore
 */
class Manifest {

	public static $assets = array(
		{{assets}}
	);

}
`;

const noAMDParserRule = { parser: { amd: false } };

const siteKitExternals = {
	'googlesitekit-api': [ 'googlesitekit', 'api' ],
	'googlesitekit-data': [ 'googlesitekit', 'data' ],
	'googlesitekit-modules': [ 'googlesitekit', 'modules' ],
	'googlesitekit-widgets': [ 'googlesitekit', 'widgets' ],
	'@wordpress/i18n': [ 'googlesitekit', 'i18n' ],
};

const externals = { ...siteKitExternals };

const svgRule = {
	test: /\.svg$/,
	use: [ {
		loader: '@svgr/webpack',
		options: {
			// strip width & height to allow manual override using props
			dimensions: false,
		},
	} ],
};

const rules = [
	noAMDParserRule,
	svgRule,
	{
		test: /\.js$/,
		exclude: /node_modules/,
		use: [
			{
				loader: 'babel-loader',
				options: {
					babelrc: false,
					configFile: false,
					cacheDirectory: true,
					presets: [
						'@wordpress/default',
						'@babel/preset-react',
					],
				},
			},
		],
		...noAMDParserRule,
	},
];

const resolve = {
	alias: {
		'@wordpress/api-fetch__non-shim': require.resolve( '@wordpress/api-fetch' ),
		'@wordpress/api-fetch$': path.resolve( 'assets/js/api-fetch-shim.js' ),
		'@wordpress/i18n__non-shim': require.resolve( '@wordpress/i18n' ),
	},
	modules: [ projectPath( '.' ), 'node_modules' ],
};

// Get the app version from the google-site-kit.php file - optional chaining operator not supported here
const googleSiteKitFile = fs.readFileSync( path.resolve( __dirname, 'google-site-kit.php' ), 'utf8' );
const googleSiteKitVersion = googleSiteKitFile.match( /(?<='GOOGLESITEKIT_VERSION',\s+')\d+.\d+.\d+(?=')/ig );
const GOOGLESITEKIT_VERSION = googleSiteKitVersion ? googleSiteKitVersion[ 0 ] : '';

const webpackConfig = ( env, argv ) => {
	const {
		mode,
		flagMode = mode,
	} = argv;

	return [
		// Build the settings js..
		{
			entry: {
				// New Modules (Post-JSR).
				'googlesitekit-api': './assets/js/googlesitekit-api.js',
				'googlesitekit-data': './assets/js/googlesitekit-data.js',
				'googlesitekit-datastore-site': './assets/js/googlesitekit-datastore-site.js',
				'googlesitekit-datastore-user': './assets/js/googlesitekit-datastore-user.js',
				'googlesitekit-datastore-forms': './assets/js/googlesitekit-datastore-forms.js',
				'googlesitekit-datastore-location': './assets/js/googlesitekit-datastore-location.js',
				'googlesitekit-datastore-ui': './assets/js/googlesitekit-datastore-ui.js',
				'googlesitekit-modules': './assets/js/googlesitekit-modules.js',
				'googlesitekit-widgets': './assets/js/googlesitekit-widgets.js',
				'googlesitekit-modules-adsense': './assets/js/googlesitekit-modules-adsense.js',
				'googlesitekit-modules-analytics': './assets/js/googlesitekit-modules-analytics.js',
				'googlesitekit-modules-analytics-4': './assets/js/googlesitekit-modules-analytics-4.js',
				'googlesitekit-modules-idea-hub': './assets/js/googlesitekit-modules-idea-hub.js',
				'googlesitekit-modules-optimize': './assets/js/googlesitekit-modules-optimize.js',
				'googlesitekit-modules-pagespeed-insights': 'assets/js/googlesitekit-modules-pagespeed-insights.js',
				'googlesitekit-modules-search-console': './assets/js/googlesitekit-modules-search-console.js',
				'googlesitekit-modules-tagmanager': './assets/js/googlesitekit-modules-tagmanager.js',
				'googlesitekit-user-input': './assets/js/googlesitekit-user-input.js',
				// Old Modules
				'googlesitekit-activation': './assets/js/googlesitekit-activation.js',
				'googlesitekit-adminbar': './assets/js/googlesitekit-adminbar.js',
				'googlesitekit-settings': './assets/js/googlesitekit-settings.js',
				'googlesitekit-dashboard': './assets/js/googlesitekit-dashboard.js',
				'googlesitekit-dashboard-details': './assets/js/googlesitekit-dashboard-details.js',
				'googlesitekit-dashboard-splash': './assets/js/googlesitekit-dashboard-splash.js',
				'googlesitekit-wp-dashboard': './assets/js/googlesitekit-wp-dashboard.js',
				'googlesitekit-base': './assets/js/googlesitekit-base.js',
				'googlesitekit-module': './assets/js/googlesitekit-module.js',
			},
			externals,
			output: {
				filename: ( mode === 'production' ? '[name].[contenthash].js' : '[name].js' ),
				path: path.join( __dirname, 'dist/assets/js' ),
				chunkFilename: ( mode === 'production' ? '[name].[chunkhash].js' : '[name].js' ),
				publicPath: '',
				/*
					If multiple webpack runtimes (from different compilations) are used on the
					same webpage, there is a risk of conflicts of on-demand chunks in the global
					namespace.
					See: https://webpack.js.org/configuration/output/#outputjsonpfunction.
				*/
				jsonpFunction: '__googlesitekit_webpackJsonp',
			},
			performance: {
				maxEntrypointSize: 175000,
			},
			module: {
				rules: [
					...rules,
				],
			},
			plugins: [
				new ProvidePlugin( {
					React: 'react',
				} ),
				new WebpackBar( {
					name: 'Module Entry Points',
					color: '#fbbc05',
				} ),
				new CircularDependencyPlugin( {
					exclude: /node_modules/,
					failOnError: true,
					allowAsyncCycles: false,
					cwd: process.cwd(),
				} ),
				new CreateFileWebpack( {
					path: './dist',
					fileName: 'config.json',
					content: JSON.stringify( {
						buildMode: flagMode,
						features,
					} ),
				} ),
				new ManifestPlugin( {
					fileName: path.resolve( __dirname, 'includes/Core/Assets/Manifest.php' ),
					filter( file ) {
						return ( file.name || '' ).match( /\.js$/ );
					},
					serialize( manifest ) {
						const maxLen = Math.max( ...Object.keys( manifest ).map( ( key ) => key.length ) );
						const content = manifestTemplate.replace(
							'{{assets}}',
							Object.keys( manifest )
								.map( ( key ) => `"${ key.replace( '.js', '' ) }"${ ''.padEnd( maxLen - key.length, ' ' ) } => "${ manifest[ key ] }",` )
								.join( '\n\t\t' )
						);

						return content;
					},
				} ),
				new DefinePlugin( {
					'global.GOOGLESITEKIT_VERSION': JSON.stringify( GOOGLESITEKIT_VERSION ),
				} ),
				new ESLintPlugin( {
					emitError: true,
					emitWarning: true,
					failOnError: true,
				} ),
			],
			optimization: {
				minimizer: [
					new TerserPlugin( {
						parallel: true,
						sourceMap: false,
						cache: true,
						terserOptions: {
							// We preserve function names that start with capital letters as
							// they're _likely_ component names, and these are useful to have
							// in tracebacks and error messages.
							keep_fnames: /__|_x|_n|_nx|sprintf|^[A-Z].+$/,
							output: {
								comments: /translators:/i,
							},
						},
						extractComments: false,
					} ),
				],
				/*
					The runtimeChunk value 'single' creates a runtime file to be shared for all generated chunks.
					Without this, imported modules are initialized for each runtime chunk separately which
					results in duplicate module initialization when a shared module is imported by separate entries
					on the same page.
					See: https://v4.webpack.js.org/configuration/optimization/#optimizationruntimechunk
				*/
				runtimeChunk: 'single',
				splitChunks: {
					cacheGroups: {
						vendor: {
							chunks: 'initial',
							name: 'googlesitekit-vendor',
							filename: ( mode === 'production' ? 'googlesitekit-vendor.[contenthash].js' : 'googlesitekit-vendor.js' ),
							enforce: true,
							test: /[\\/]node_modules[\\/]/,
						},
					},
				},
			},
			resolve,
		},

		// Build basic modules that don't require advanced optimizations, splitting chunks, and so on...
		{
			entry: {
				'googlesitekit-i18n': './assets/js/googlesitekit-i18n.js',
				// Analytics advanced tracking script to be injected in the frontend.
				'analytics-advanced-tracking': './assets/js/analytics-advanced-tracking.js',
				// Idea Hub Block Editor notice.
				'googlesitekit-idea-hub-notice': './assets/js/googlesitekit-idea-hub-notice.js',
			},
			externals,
			output: {
				filename: '[name].js',
				path: __dirname + '/dist/assets/js',
				publicPath: '',
			},
			module: {
				rules,
			},
			plugins: [
				new WebpackBar( {
					name: 'Basic Modules',
					color: '#fb1105',
				} ),
			],
			optimization: {
				concatenateModules: true,
			},
			resolve,
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
					{
						test: /\.(png|woff|woff2|eot|ttf|gif)$/,
						use: { loader: 'url-loader?limit=100000' },
					},
				],
			},
			plugins: [
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

const testBundle = () => {
	return {
		entry: {
			'e2e-api-fetch': './tests/e2e/assets/e2e-api-fetch.js',
			'e2e-redux-logger': './tests/e2e/assets/e2e-redux-logger.js',
		},
		output: {
			filename: '[name].js',
			path: __dirname + '/dist/assets/js',
			chunkFilename: '[name].js',
			publicPath: '',
		},
		module: {
			rules,
		},
		plugins: [
			new WebpackBar( {
				name: 'Test files',
				color: '#34a853',
			} ),
		],
		externals,
		resolve,
	};
};

module.exports = {
	externals,
	noAMDParserRule,
	projectPath,
	resolve,
	rules,
	siteKitExternals,
	svgRule,
};

module.exports.default = ( env, argv ) => {
	const config = webpackConfig( env, argv );
	const { includeTests, mode } = argv;

	if ( mode !== 'production' || includeTests ) {
		// Build the test files if we aren't doing a production build.
		config.push( testBundle() );
	}

	config.stats = 'errors-warnings';

	return config;
};
