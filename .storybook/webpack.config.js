const path = require( 'path' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const mainConfig = require( '../webpack.config' );
const mapValues = require( 'lodash/mapValues' );

module.exports = async ( { config } ) => {
	// Site Kit loads its API packages as externals,
	// so we need to convert those to aliases for Storybook to be able to resolve them.
	const siteKitPackageAliases = mapValues(
		mainConfig.siteKitExternals,
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
	];

	config.module.rules.push(
		{
			test: /\.scss$/,
			use: [
				MiniCssExtractPlugin.loader,
				'css-loader',
				'postcss-loader',
				{
					loader: 'sass-loader',
					options: {
						includePaths: [ path.resolve( __dirname, '../node_modules/' ) ],
					},
				},
			],
		},
	);

	config.module.rules.push(
		{
			test: /\.(png|woff|woff2|eot|ttf|svg|gif)$/,
			use: { loader: 'url-loader?limit=100000' },
		}
	);

	return config;
};
