const { preset } = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	preset,
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
		'^SiteKitCore/(.*)$': '<rootDir>assets/js/$1',
		'^GoogleComponents/(.*)$': '<rootDir>assets/js/components/$1',
		'^GoogleUtil/(.*)$': '<rootDir>assets/js/util/$1',
		'^GoogleModules/(.*)$': '<rootDir>assets/js/modules/$1',
	},
	coveragePathIgnorePatterns: [ '/node_modules/', '<rootDir>/build/' ],
	coverageReporters: [ 'lcov' ],
	coverageDirectory: '<rootDir>/build/logs',
};
