const path = require( 'path' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

module.exports = async ( { config } ) => {
	config.resolve = {
		...config.resolve,
		alias: {
			...config.resolve.alias,
			SiteKitCore: path.resolve( __dirname, '../assets/js/' ),
			GoogleComponents: path.resolve( __dirname, '../assets/js/components/' ),
			GoogleUtil: path.resolve( __dirname, '../assets/js/util/' ),
			GoogleModules: path.resolve( __dirname, '../assets/js/modules/' ),
		},
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

	config.externals = {
		'@wordpress/api-fetch': [ 'wp', 'apiFetch' ],
	};

	return config;
};
