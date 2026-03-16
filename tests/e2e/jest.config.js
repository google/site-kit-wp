const path = require( 'path' );

module.exports = {
	preset: 'jest-puppeteer',
	setupFilesAfterEnv: [
		'<rootDir>/config/screenshots.js',
		'<rootDir>/config/bootstrap.js',
		'<rootDir>/config/wordpress-debug-log',
		'@wordpress/jest-console',
		'expect-puppeteer',
	],
	testMatch: [
		'<rootDir>/**/*.test.js',
		'<rootDir>/specs/**/__tests__/**/*.js',
		'<rootDir>/specs/**/?(*.)(spec|test).js',
		'<rootDir>/specs/**/test/*.js',
	],
	transform: {
		'^.+\\.[jt]sx?$': path.join( __dirname, 'babel-transform' ),
	},
	// Exclude uuid package from transformation ignore patterns because it uses ESM syntax
	// that needs to be transformed by Babel for Jest to process correctly.
	transformIgnorePatterns: [ '/node_modules/(?!(uuid)/)' ],
	testPathIgnorePatterns: [ '.git', 'node_modules', '\\.playwright\\.' ],
	verbose: true,
};
