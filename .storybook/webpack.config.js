const path = require( 'path' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

module.exports = async ( { config } ) => {
	config.resolve = {
		...config.resolve,
		alias: {
			...config.resolve.alias,
			// '@wordpress/api-fetch$': path.resolve( __dirname, 'wp-api-fetch-mock.js' ),
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
