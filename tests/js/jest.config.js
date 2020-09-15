const { preset } = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	preset,
	collectCoverage: false, // Enable with `--coverage=true` flag.
	collectCoverageFrom: [
		'assets/**/**.js',
	],
	coverageDirectory: 'coverage',
	coveragePathIgnorePatterns: [
		'<rootDir>/build/',
		'<rootDir>/node_modules/',
		'<rootDir>/assets/js/googlesitekit-(.*)\.js',
	],
	coverageReporters: [
		'html',
		'text-summary',
	],
	rootDir: '../../',
	transform: {
		'^.+\\.[jt]sx?$': '<rootDir>/node_modules/@wordpress/scripts/config/babel-transform',
	},
	setupFiles: [
		'<rootDir>/tests/js/setup-globals',
		'<rootDir>/tests/js/setup-mocks',
		'jest-localstorage-mock',
	],
	setupFilesAfterEnv: [
		'<rootDir>/tests/js/jest-matchers',
		'<rootDir>/tests/js/setup-before-after',
	],
	testMatch: [
		'<rootDir>/assets/**/__tests__/**/*.js',
		'<rootDir>/assets/**/test/*.js',
		'<rootDir>/assets/**/?(*.)test.js',
	],
	testPathIgnorePatterns: [
		'<rootDir>/.git',
		'<rootDir>/node_modules',
		'<rootDir>/build',
	],
	// Matches aliases in webpack.config.js.
	moduleNameMapper: {
		'@wordpress/api-fetch__non-shim': '@wordpress/api-fetch',
		'@wordpress/element__non-shim': '@wordpress/element',
		'@wordpress/hooks__non-shim': '@wordpress/hooks',
		'react__non-shim': 'react',

		// New (JSR) modules.
		'^googlesitekit-(.+)$': '<rootDir>assets/js/googlesitekit-$1',
	},
};
