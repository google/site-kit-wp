/**
 * Main modules config webpack partial.
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
 * Node dependencies
 */
const path = require( 'path' );

/**
 * External dependencies
 */
const CircularDependencyPlugin = require( 'circular-dependency-plugin' );
const ESLintPlugin = require( 'eslint-webpack-plugin' );
const WebpackBar = require( 'webpackbar' );
const { DefinePlugin, ProvidePlugin } = require( 'webpack' );
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const CreateFileWebpack = require( 'create-file-webpack' );
const ManifestPlugin = require( 'webpack-manifest-plugin' );

/**
 * Internal dependencies
 */
const {
	formattedFeaturesToPHPArray,
	rootDir,
	configTemplate,
	manifestArgs,
	externals,
	createMinimizerRules,
	GOOGLESITEKIT_VERSION,
	resolve,
} = require( './common' );

module.exports = ( mode, rules, ANALYZE ) => {
	const isProduction = mode === 'production';

	return {
		context: rootDir,
		entry: {
			// New Modules (Post-JSR).
			'googlesitekit-api': './assets/js/googlesitekit-api.js',
			'googlesitekit-data': './assets/js/googlesitekit-data.js',
			'googlesitekit-datastore-site':
				'./assets/js/googlesitekit-datastore-site.js',
			'googlesitekit-datastore-user':
				'./assets/js/googlesitekit-datastore-user.js',
			'googlesitekit-datastore-forms':
				'./assets/js/googlesitekit-datastore-forms.js',
			'googlesitekit-datastore-location':
				'./assets/js/googlesitekit-datastore-location.js',
			'googlesitekit-datastore-ui':
				'./assets/js/googlesitekit-datastore-ui.js',
			'googlesitekit-modules': './assets/js/googlesitekit-modules.js',
			'googlesitekit-notifications':
				'./assets/js/googlesitekit-notifications.js',
			'googlesitekit-widgets': './assets/js/googlesitekit-widgets.js',
			'googlesitekit-modules-ads':
				'./assets/js/googlesitekit-modules-ads.js',
			'googlesitekit-modules-adsense':
				'./assets/js/googlesitekit-modules-adsense.js',
			'googlesitekit-modules-analytics-4':
				'./assets/js/googlesitekit-modules-analytics-4.js',
			'googlesitekit-modules-pagespeed-insights':
				'assets/js/googlesitekit-modules-pagespeed-insights.js',
			'googlesitekit-modules-reader-revenue-manager':
				'./assets/js/googlesitekit-modules-reader-revenue-manager.js',
			'googlesitekit-modules-search-console':
				'./assets/js/googlesitekit-modules-search-console.js',
			'googlesitekit-modules-sign-in-with-google':
				'./assets/js/googlesitekit-modules-sign-in-with-google.js',
			'googlesitekit-modules-tagmanager':
				'./assets/js/googlesitekit-modules-tagmanager.js',
			'googlesitekit-user-input':
				'./assets/js/googlesitekit-user-input.js',
			'googlesitekit-ad-blocking-recovery':
				'./assets/js/googlesitekit-ad-blocking-recovery.js',
			'googlesitekit-polyfills': './assets/js/googlesitekit-polyfills.js',
			'googlesitekit-components-gm2':
				'./assets/js/googlesitekit-components-gm2.js',
			'googlesitekit-components-gm3':
				'./assets/js/googlesitekit-components-gm3.js',
			'googlesitekit-metric-selection':
				'./assets/js/googlesitekit-metric-selection.js',
			// Old Modules
			'googlesitekit-activation':
				'./assets/js/googlesitekit-activation.js',
			'googlesitekit-adminbar': './assets/js/googlesitekit-adminbar.js',
			'googlesitekit-settings': './assets/js/googlesitekit-settings.js',
			'googlesitekit-main-dashboard':
				'./assets/js/googlesitekit-main-dashboard.js',
			'googlesitekit-entity-dashboard':
				'./assets/js/googlesitekit-entity-dashboard.js',
			'googlesitekit-splash': './assets/js/googlesitekit-splash.js',
			'googlesitekit-wp-dashboard':
				'./assets/js/googlesitekit-wp-dashboard.js',
		},
		externals,
		output: {
			filename: isProduction ? '[name]-[contenthash].js' : '[name].js',
			path: path.join( rootDir, 'dist/assets/js' ),
			chunkFilename: isProduction ? '[name]-[chunkhash].js' : '[name].js',
			publicPath: '',
			// If multiple webpack runtimes (from different compilations) are used on the
			// same webpage, there is a risk of conflicts of on-demand chunks in the global
			// namespace.
			// See: https://v4.webpack.js.org/configuration/output/#outputjsonpfunction.
			jsonpFunction: '__googlesitekit_webpackJsonp',
		},
		performance: {
			maxEntrypointSize: 175000,
		},
		module: {
			rules: [ ...rules ],
		},
		plugins: [
			new ProvidePlugin( {
				React: '@wordpress/element',
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
				path: rootDir + '/dist',
				fileName: 'config.php',
				content: configTemplate.replace(
					'{{features}}',
					`array( ${ formattedFeaturesToPHPArray } )`
				),
			} ),
			new ManifestPlugin( {
				...manifestArgs( mode ),
				filter( file ) {
					return ( file.name || '' ).match( /\.js$/ );
				},
			} ),
			new DefinePlugin( {
				'global.GOOGLESITEKIT_VERSION': JSON.stringify(
					GOOGLESITEKIT_VERSION
				),
			} ),
			new ESLintPlugin( {
				emitError: true,
				emitWarning: true,
				failOnError: true,
			} ),
			...( ANALYZE ? [ new BundleAnalyzerPlugin() ] : [] ),
		],
		optimization: {
			minimizer: createMinimizerRules( mode ),
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
						filename: isProduction
							? 'googlesitekit-vendor-[contenthash].js'
							: 'googlesitekit-vendor.js',
						enforce: true,
						test: ( module ) => {
							return (
								/[\\/]node_modules[\\/]/.test(
									module.resource
								) &&
								// This test to exclude @material/web from the vendor bundle can be removed once googlesitekit-components is moved out of the Module Entry Points configuration. See https://github.com/google/site-kit-wp/issues/6112.
								! /[\\/]@material[\\/]web[\\/]/.test(
									module.resource
								)
							);
						},
					},
				},
			},
		},
		resolve,
	};
};
