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
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const CreateFileWebpack = require( 'create-file-webpack' );
const {
	WebpackManifestPlugin: ManifestPlugin,
} = require( 'webpack-manifest-plugin' );
const features = require( './feature-flags.json' );
const formattedFeaturesToPHPArray = features
	.map( ( feature ) => `'${ feature }'` )
	.join( ',' );

const projectPath = ( relativePath ) => {
	return path.resolve( fs.realpathSync( process.cwd() ), relativePath );
};

const manifestSeed = {};
const manifestArgs = ( mode ) => ( {
	fileName: path.resolve( __dirname, 'dist/manifest.php' ),
	seed: manifestSeed,
	generate( seedObj, files ) {
		const entry = ( filename, hash ) => {
			if ( mode === 'production' ) {
				return [ filename, null ];
			}
			return [ filename, hash ];
		};
		files.forEach( ( file ) => {
			if ( file.name.match( /\.css$/ ) ) {
				// CSS file paths contain the destination directory which needs to be stripped
				// because the MiniCssExtractPlugin does not have separate
				// options for `file` and `path` like normal entries.
				seedObj[ file.chunk.name ] = entry(
					path.basename( file.path ),
					file.chunk.contentHash[ 'css/mini-extract' ]
				);
			} else if ( file.chunk.name === 'runtime' ) {
				seedObj[ 'googlesitekit-runtime' ] = entry(
					file.path,
					file.chunk.contentHash.javascript
				);
			} else if (
				file.chunk.name?.startsWith( 'googlesitekit-components-' )
			) {
				// Exception for 'googlesitekit-components' because it's a dynamic asset
				// with multiple possible file names.
				seedObj[ 'googlesitekit-components' ] =
					seedObj[ 'googlesitekit-components' ] || [];

				seedObj[ 'googlesitekit-components' ].push(
					entry( file.path, file.chunk.contentHash.javascript )
				);
			} else if ( file.isInitial ) {
				// Normal entries.
				seedObj[ file.chunk.name ] = entry(
					file.path,
					file.chunk.contentHash.javascript
				);
			}
		} );
		return seedObj;
	},
	serialize( manifest ) {
		const handles = Object.keys( manifest ).map( ( key ) =>
			key.replace( /\.(css|js)$/, '' )
		);
		const maxLen = Math.max( ...handles.map( ( key ) => key.length ) );

		function arrayToPHP( values ) {
			return `array( ${ values
				.map( ( value ) =>
					Array.isArray( value )
						? arrayToPHP( value )
						: JSON.stringify( value )
				)
				.join( ', ' ) } )`;
		}

		function manifestEntryToPHP( [ handle, entry ] ) {
			const alignment = ''.padEnd( maxLen - handle.length );
			return `'${ handle }' ${ alignment }=> ${ arrayToPHP( entry ) },`;
		}

		const content = manifestTemplate.replace(
			'{{assets}}',
			Object.entries( manifest ).map( manifestEntryToPHP ).join( '\n\t' )
		);

		return content;
	},
} );

const manifestTemplate = `<?php
/**
 * @package   Google\\Site_Kit
 * @copyright ${ new Date().getFullYear() } Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

return array(
	{{assets}}
);
`;

const configTemplate = `<?php
/**
 * @package   Google\\Site_Kit
 * @copyright ${ new Date().getFullYear() } Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

return array(
	'buildMode' => {{buildMode}},
	'features' => {{features}},
);
`;

const siteKitExternals = {
	'googlesitekit-api': [ 'googlesitekit', 'api' ],
	'googlesitekit-data': [ 'googlesitekit', 'data' ],
	'googlesitekit-modules': [ 'googlesitekit', 'modules' ],
	'googlesitekit-widgets': [ 'googlesitekit', 'widgets' ],
	'googlesitekit-components': [ 'googlesitekit', 'components' ],
	'@wordpress/i18n': [ 'googlesitekit', 'i18n' ],
};

const externals = { ...siteKitExternals };

const svgRule = {
	test: /\.svg$/,
	use: [
		{
			loader: '@svgr/webpack',
			options: {
				// strip width & height to allow manual override using props
				dimensions: false,
			},
		},
	],
};

const createRules = ( mode ) => [
	svgRule,
	{
		test: /\.js$/,
		exclude: /node_modules/,
		use: [
			{
				loader: 'babel-loader',
				options: {
					sourceMap: mode !== 'production',
					babelrc: false,
					configFile: false,
					cacheDirectory: true,
					presets: [ '@wordpress/default', '@babel/preset-react' ],
				},
			},
		],
	},
	{
		test: RegExp( 'node_modules/@material/web/.*.js' ),
		use: [
			{
				loader: 'babel-loader',
				options: {
					sourceMap: mode !== 'production',
					babelrc: false,
					configFile: false,
					cacheDirectory: true,
					presets: [ '@wordpress/default', '@babel/preset-react' ],
				},
			},
		],
	},
];

const createMinimizerRules = ( mode ) => [
	new TerserPlugin( {
		parallel: true,
		sourceMap: mode !== 'production',
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
];

const resolve = {
	alias: {
		'@wordpress/api-fetch__non-shim': require.resolve(
			'@wordpress/api-fetch'
		),
		'@wordpress/api-fetch$': path.resolve( 'assets/js/api-fetch-shim.js' ),
		'@wordpress/i18n__non-shim': require.resolve( '@wordpress/i18n' ),
	},
	modules: [ projectPath( '.' ), 'node_modules' ],
};

// Get the app version from the google-site-kit.php file - optional chaining operator not supported here
const googleSiteKitFile = fs.readFileSync(
	path.resolve( __dirname, 'google-site-kit.php' ),
	'utf8'
);
const googleSiteKitVersion = googleSiteKitFile.match(
	/(?<='GOOGLESITEKIT_VERSION',\s+')\d+.\d+.\d+(?=')/gi
);
const GOOGLESITEKIT_VERSION = googleSiteKitVersion
	? googleSiteKitVersion[ 0 ]
	: '';

const corePackages = [
	'api-fetch',
	'compose',
	'data',
	'dom-ready',
	'element',
	'icons',
	'keycodes',
	'url',
];

const gutenbergExternals = {
	'@wordpress/i18n': [ 'googlesitekit', 'i18n' ],
};

corePackages.forEach( ( name ) => {
	gutenbergExternals[ `@wordpress-core/${ name }` ] = [
		'wp',
		name.replace( /-([a-z])/g, ( match, letter ) => letter.toUpperCase() ),
	];
} );

function* webpackConfig( env, argv ) {
	const { mode, flagMode = mode } = argv;
	const { ANALYZE } = env || {};

	const rules = createRules( mode );

	const isProduction = mode === 'production';

	// Build the settings js..
	yield {
		devtool: 'source-map',
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
			'googlesitekit-widgets': './assets/js/googlesitekit-widgets.js',
			'googlesitekit-modules-adsense':
				'./assets/js/googlesitekit-modules-adsense.js',
			'googlesitekit-modules-analytics':
				'./assets/js/googlesitekit-modules-analytics.js',
			'googlesitekit-modules-analytics-4':
				'./assets/js/googlesitekit-modules-analytics-4.js',
			'googlesitekit-modules-pagespeed-insights':
				'assets/js/googlesitekit-modules-pagespeed-insights.js',
			'googlesitekit-modules-search-console':
				'./assets/js/googlesitekit-modules-search-console.js',
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
			path: path.join( __dirname, 'dist/assets/js' ),
			chunkFilename: isProduction ? '[name]-[chunkhash].js' : '[name].js',
			publicPath: '',
			// If multiple webpack runtimes (from different compilations) are used on the
			// same webpage, there is a risk of conflicts of on-demand chunks in the global
			// namespace.
			// See: https://webpack.js.org/configuration/output/#outputjsonpfunction.
			chunkLoadingGlobal: '__googlesitekit_webpackChunkLoader',
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
				path: './dist',
				fileName: 'config.php',
				content: configTemplate
					.replace( '{{buildMode}}', `'${ flagMode }'` )
					.replace(
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
				global: 'window',
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

	if ( ANALYZE ) {
		return;
	}

	// Build basic modules that don't require advanced optimizations, splitting chunks, and so on...
	yield {
		devtool: 'source-map',
		entry: {
			'googlesitekit-i18n': './assets/js/googlesitekit-i18n.js',
			// Analytics advanced tracking script to be injected in the frontend.
			'analytics-advanced-tracking':
				'./assets/js/analytics-advanced-tracking.js',
		},
		externals,
		output: {
			filename:
				mode === 'production' ? '[name]-[contenthash].js' : '[name].js',
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
			new ManifestPlugin( {
				...manifestArgs( mode ),
				filter( file ) {
					return ( file.name || '' ).match( /\.js$/ );
				},
			} ),
		],
		optimization: {
			concatenateModules: true,
		},
		resolve,
	};

	// Build the main plugin admin css.
	yield {
		devtool: 'source-map',
		entry: {
			'googlesitekit-admin-css': './assets/sass/admin.scss',
			'googlesitekit-adminbar-css': './assets/sass/adminbar.scss',
			'googlesitekit-wp-dashboard-css': './assets/sass/wpdashboard.scss',
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
				filename:
					'production' === mode
						? '/assets/css/[name]-[contenthash].min.css'
						: '/assets/css/[name].css',
			} ),
			new WebpackBar( {
				name: 'Plugin CSS',
				color: '#4285f4',
			} ),
			new ManifestPlugin( {
				...manifestArgs( mode ),
				filter( file ) {
					return ( file.name || '' ).match( /\.css$/ );
				},
			} ),
		],
	};
}

function testBundle( mode ) {
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
	};
}

module.exports = {
	externals,
	projectPath,
	resolve,
	siteKitExternals,
	svgRule,
};

module.exports.default = ( env, argv ) => {
	const configs = [];

	const configGenerator = webpackConfig( env, argv );
	for ( const config of configGenerator ) {
		configs.push( {
			...config,
			stats: 'errors-warnings',
		} );
	}

	const { includeTests, mode } = argv;

	if ( mode !== 'production' || includeTests ) {
		// Build the test files if we aren't doing a production build.
		configs.push( {
			...testBundle(),
			stats: 'errors-warnings',
		} );
	}

	return configs;
};
