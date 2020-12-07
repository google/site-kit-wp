/**
 * Storybook Webpack config.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
const mapValues = require( 'lodash/mapValues' );
const omitBy = require( 'lodash/omitBy' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const { ProvidePlugin } = require( 'webpack' );

/**
 * Internal dependencies
 */
const mainConfig = require( '../webpack.config' );

module.exports = async ( { config } ) => {
	const siteKitExternals = omitBy( mainConfig.siteKitExternals, ( value, key ) => key.startsWith( '@wordpress' ) );
	// Site Kit loads its API packages as externals,
	// so we need to convert those to aliases for Storybook to be able to resolve them.
	const siteKitPackageAliases = mapValues(
		siteKitExternals,
		( [ global, api ] ) => {
			return path.resolve( `assets/js/${ global }-${ api }.js` );
		}
	);

	config.resolve = {
		...config.resolve,
		alias: {
			...config.resolve.alias,
			...siteKitPackageAliases,
		},
		modules: [ path.resolve( __dirname, '..' ), 'node_modules' ],
	};

	config.plugins = [
		...config.plugins,
		new MiniCssExtractPlugin(),
		new ProvidePlugin( {
			React: 'react',
		} ),
	];

	config.module.rules.push(
		{
			test: /\.scss$/,
			use: [
				MiniCssExtractPlugin.loader,
				'css-loader',
				{
					loader: 'postcss-loader',
					options: {
						config: {
							path: './',
						},
					},
				},
				{
					loader: 'sass-loader',
					options: {
						additionalData: `$wp-version: "${ process.env.npm_package_config_storybook_wordpress_version }";`,
						sassOptions: {
							includePaths: [ path.resolve( __dirname, '../node_modules/' ) ],
						},
					},
				},
			],
			include: path.resolve( __dirname, '../' ),
		},
	);

	// exclude existing svg rule created by storybook before pushing custom rule
	const fileLoaderRule = config.module.rules.find( ( rule ) => rule.test && rule.test.test( '.svg' ) );
	fileLoaderRule.query.name = '[path][name].[ext]';
	fileLoaderRule.exclude = /\.svg$/;

	config.module.rules.push( mainConfig.svgRule );

	config.module.rules.push(
		{
			test: /\.(png|woff|woff2|eot|ttf|gif)$/,
			use: { loader: 'url-loader?limit=100000' },
		}
	);

	return config;
};
