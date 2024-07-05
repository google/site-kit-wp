/**
 * Frontend modules config webpack partial.
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
const WebpackBar = require( 'webpackbar' );
const ManifestPlugin = require( 'webpack-manifest-plugin' );

/**
 * Internal dependencies
 */
const {
	rootDir,
	manifestArgs,
	externals,
	resolve,
	noAMDParserRule,
} = require( './common' );

module.exports = ( mode ) => ( {
	entry: {
		// Consent Mode
		'consent-mode': './assets/js/consent-mode/consent-mode.js',
		// Event Providers
		'googlesitekit-events-provider-contact-form-7':
			'./assets/js/event-providers/contact-form-7.js',
		'googlesitekit-events-provider-easy-digital-downloads':
			'./assets/js/event-providers/easy-digital-downloads.js',
		'googlesitekit-events-provider-mailchimp':
			'./assets/js/event-providers/mailchimp.js',
		'googlesitekit-events-provider-ninja-forms':
			'./assets/js/event-providers/ninja-forms.js',
		'googlesitekit-events-provider-optin-monster':
			'./assets/js/event-providers/optin-monster.js',
		'googlesitekit-events-provider-popup-maker':
			'./assets/js/event-providers/popup-maker.js',
		'googlesitekit-events-provider-woocommerce':
			'./assets/js/event-providers/woocommerce.js',
		'googlesitekit-events-provider-wpforms':
			'./assets/js/event-providers/wpforms.js',
	},
	externals,
	output: {
		filename:
			mode === 'production' ? '[name]-[contenthash].js' : '[name].js',
		path: rootDir + '/dist/assets/js',
		publicPath: '',
	},
	module: {
		rules: [
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
							presets: [
								[
									'@babel/preset-env',
									{
										targets: {
											browsers: [ '> 0.25%', 'not dead' ],
										},
									},
								],
							],
						},
					},
				],
			},
			noAMDParserRule,
		],
	},
	plugins: [
		new WebpackBar( {
			name: 'Frontend Modules',
			color: '#34dbeb',
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
} );
