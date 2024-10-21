/**
 * Admin CSS config webpack partial.
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
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const ManifestPlugin = require( 'webpack-manifest-plugin' );
const WebpackBar = require( 'webpackbar' );

/**
 * Internal dependencies
 */
const { manifestArgs } = require( './common' );

module.exports = ( mode ) => ( {
	entry: {
		'googlesitekit-admin-css': './assets/sass/admin.scss',
		'googlesitekit-adminbar-css': './assets/sass/adminbar.scss',
		'googlesitekit-wp-dashboard-css': './assets/sass/wpdashboard.scss',
		'googlesitekit-wp-login-css': './assets/sass/wplogin.scss',
		'googlesitekit-authorize-application-css':
			'./assets/sass/authorize-application.scss',
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
} );
