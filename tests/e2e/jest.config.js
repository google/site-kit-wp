const path = require( 'path' );

module.exports = {
	preset: 'jest-puppeteer',
	setupFilesAfterEnv: [
		'<rootDir>/config/bootstrap.js',
		'expect-puppeteer',
	],
	testMatch: [
		'<rootDir>/specs/**/__tests__/**/*.js',
		'<rootDir>/specs/**/?(*.)(spec|test).js',
		'<rootDir>/specs/**/test/*.js',
	],
	transform: {
		'^.+\\.[jt]sx?$': path.join( __dirname, 'babel-transform' ),
	},
	transformIgnorePatterns: [
		'node_modules',
	],
	testPathIgnorePatterns: [
		'.git',
		'node_modules',
	],
};
