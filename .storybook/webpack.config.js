/**
 * External dependencies
 */
const path = require( 'path' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const { mapValues } = require( 'lodash' );
const { ProvidePlugin } = require( 'webpack' );

/**
 * Internal dependencies
 */
const { siteKitExternals, svgRule } = require( '../webpack/common' );

// eslint-disable-next-line require-await
module.exports = async ( { config } ) => {
	// Site Kit loads its API packages as externals,
	// so we need to convert those to aliases for Storybook to be able to resolve them.
	const siteKitPackageAliases = mapValues(
		siteKitExternals,
		( [ global, api ] ) => {
			if ( global === 'googlesitekit' ) {
				// Revert "@wordpress/i18n: [ googlesitekit, i18n ]" external back to the original @wordpress/i18n.
				if ( api === 'i18n' ) {
					return require.resolve( '@wordpress/i18n' );
				}

				// Set "googlesitekit-components" to the entry point which can load GM2 or GM3 components.
				if ( api === 'components' ) {
					return path.resolve(
						'.storybook/assets/js/googlesitekit-components.js'
					);
				}
			}

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
			React: '@wordpress/element',
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
						postcssOptions: {
							path: './',
						},
					},
				},
				{
					loader: 'sass-loader',
					options: {
						implementation: require( 'sass' ),
						additionalData: `$wp-version: "${ process.env.npm_package_config_storybook_wordpress_version }";`,
						sassOptions: {
							includePaths: [
								path.resolve( __dirname, '../node_modules/' ),
							],
						},
					},
				},
			],
			include: path.resolve( __dirname, '../' ),
		},
		{
			test: RegExp( 'node_modules/@material/web/.*.js' ),
			use: [
				{
					loader: 'babel-loader',
					options: {
						sourceMap: true,
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
		}
	);

	// exclude existing svg rule created by storybook before pushing custom rule
	const fileLoaderRule = config.module.rules.find(
		( rule ) => rule.test && rule.test.test( '.svg' )
	);
	fileLoaderRule.exclude = /\.svg$/;

	config.module.rules.push( svgRule );

	return config;
};
