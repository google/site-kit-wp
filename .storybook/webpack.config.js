const path = require( 'path' );

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

	config.module.rules.push(
		{
			test: /\.(png|woff|woff2|eot|ttf|svg|gif)$/,
			use: { loader: 'url-loader?limit=100000' },
		}
	);

	return config;
};
