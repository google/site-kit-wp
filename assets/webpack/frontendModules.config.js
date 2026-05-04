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
const { WebpackManifestPlugin } = require( 'webpack-manifest-plugin' );

/**
 * Internal dependencies
 */
const {
	rootDir,
	manifestArgs,
	externals,
	resolve,
} = require( '../../webpack/common' );

module.exports = ( mode ) => ( {
	name: 'Frontend Modules',
	entry: {
		// Consent mode
		'googlesitekit-consent-mode': './js/consent-mode/consent-mode.ts',
		// Event Providers
		'googlesitekit-events-provider-contact-form-7':
			'./js/event-providers/contact-form-7.ts',
		'googlesitekit-events-provider-easy-digital-downloads':
			'./js/event-providers/easy-digital-downloads.ts',
		'googlesitekit-events-provider-mailchimp':
			'./js/event-providers/mailchimp.ts',
		'googlesitekit-events-provider-ninja-forms':
			'./js/event-providers/ninja-forms.ts',
		'googlesitekit-events-provider-optin-monster':
			'./js/event-providers/optin-monster.ts',
		'googlesitekit-events-provider-popup-maker':
			'./js/event-providers/popup-maker.ts',
		'googlesitekit-events-provider-woocommerce':
			'./js/event-providers/woocommerce.ts',
		'googlesitekit-events-provider-wpforms':
			'./js/event-providers/wpforms.ts',
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
		],
	},
	plugins: [
		new WebpackManifestPlugin( {
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
	amd: false,
} );
