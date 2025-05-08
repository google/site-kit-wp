/**
 * Common webpack config partial.
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
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * External dependencies
 */
const TerserPlugin = require( 'terser-webpack-plugin' );
const features = require( '../feature-flags.json' );

const rootDir = path.resolve( __dirname, '..' );

exports.rootDir = rootDir;

exports.formattedFeaturesToPHPArray = features
	.map( ( feature ) => `'${ feature }'` )
	.join( ',' );

const projectPath = ( relativePath ) => {
	return path.resolve( fs.realpathSync( process.cwd() ), relativePath );
};

exports.projectPath = projectPath;

exports.resolve = {
	alias: {
		'@wordpress/api-fetch__non-shim': require.resolve(
			'@wordpress/api-fetch'
		),
		'@wordpress/api-fetch$': path.resolve(
			rootDir,
			'assets/js/api-fetch-shim.js'
		),
		'@wordpress/i18n__non-shim': require.resolve( '@wordpress/i18n' ),
	},
	modules: [ projectPath( '.' ), 'node_modules' ],
};

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

exports.manifestTemplate = manifestTemplate;

exports.configTemplate = `<?php
/**
 * @package   Google\\Site_Kit
 * @copyright ${ new Date().getFullYear() } Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

return array(
	'features' => {{features}},
);
`;

const manifestSeed = {};
exports.manifestArgs = ( mode ) => ( {
	fileName: path.resolve( rootDir, 'dist/manifest.php' ),
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

const siteKitExternals = {
	'googlesitekit-api': [ 'googlesitekit', 'api' ],
	'googlesitekit-data': [ 'googlesitekit', 'data' ],
	'googlesitekit-modules': [ 'googlesitekit', 'modules' ],
	'googlesitekit-widgets': [ 'googlesitekit', 'widgets' ],
	'googlesitekit-notifications': [ 'googlesitekit', 'notifications' ],
	'googlesitekit-components': [ 'googlesitekit', 'components' ],
	'@wordpress/i18n': [ 'googlesitekit', 'i18n' ],
};

exports.siteKitExternals = siteKitExternals;

exports.externals = { ...siteKitExternals };

const noAMDParserRule = { parser: { amd: false } };

exports.noAMDParserRule = noAMDParserRule;

const svgRules = [
	{
		oneOf: [
			{
				test: /\.svg$/,
				resourceQuery: /url/,
				use: 'url-loader',
			},
			{
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
			},
		],
	},
];
exports.svgRules = svgRules;

exports.createRules = ( mode ) => [
	noAMDParserRule,
	...svgRules,
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
		...noAMDParserRule,
	},
	{
		test: /\.mjs$/,
		include: /node_modules/,
		type: 'javascript/auto',
	},
];

exports.createMinimizerRules = ( mode ) => [
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

// Get the app version from the google-site-kit.php file - optional chaining operator not supported here
const googleSiteKitFile = fs.readFileSync(
	path.resolve( rootDir, 'google-site-kit.php' ),
	'utf8'
);
const googleSiteKitVersion = googleSiteKitFile.match(
	/(?<='GOOGLESITEKIT_VERSION',\s+')\d+.\d+.\d+(?=')/gi
);
exports.GOOGLESITEKIT_VERSION = googleSiteKitVersion
	? googleSiteKitVersion[ 0 ]
	: '';

const corePackages = [
	'api-fetch',
	'block-editor',
	'blocks',
	'components',
	'compose',
	'data',
	'dom-ready',
	'editor',
	'edit-post',
	'element',
	'icons',
	'keycodes',
	'plugins',
	'url',
];

exports.corePackages = corePackages;

const gutenbergExternals = {
	'@wordpress/i18n': [ 'googlesitekit', 'i18n' ],
	'googlesitekit-api': [ 'googlesitekit', 'api' ],
	'googlesitekit-data': [ 'googlesitekit', 'data' ],
	'googlesitekit-modules': [ 'googlesitekit', 'modules' ],
};

exports.gutenbergExternals = gutenbergExternals;

corePackages.forEach( ( name ) => {
	gutenbergExternals[ `@wordpress-core/${ name }` ] = [
		'wp',
		name.replace( /-([a-z])/g, ( match, letter ) => letter.toUpperCase() ),
	];
} );
