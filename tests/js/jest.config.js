module.exports = {
	preset: '@wordpress/jest-preset-default',
	collectCoverage: false, // Enable with `--coverage=true` flag.
	collectCoverageFrom: [ 'assets/**/**.js' ],
	coverageDirectory: 'coverage',
	coveragePathIgnorePatterns: [
		'<rootDir>/build/',
		'<rootDir>/node_modules/',
		'<rootDir>/assets/node_modules/',
		'<rootDir>/assets/js/googlesitekit-(.*).js',
	],
	coverageReporters: [ 'html', 'text-summary' ],
	rootDir: '../../',
	transform: {
		'^.+\\.[jt]sx?$': '<rootDir>/tests/e2e/babel-transform.js',
	},
	setupFiles: [
		'<rootDir>/tests/js/setup-globals',
		'jest-localstorage-mock',
		// Note that `element-internals-polyfill` was introduced to polyfill `HTMLElement.attachInternals()`,
		// due to JSDom not supporting it. It can probably be removed when JSDom does implement support.
		// See https://github.com/jsdom/jsdom/issues/3444.
		'element-internals-polyfill',
	],
	setupFilesAfterEnv: [
		'<rootDir>/tests/js/jest-matchers',
		'<rootDir>/tests/js/setup-before-after',
	],
	testMatch: [
		'<rootDir>/assets/**/__tests__/**/*.js',
		'<rootDir>/assets/**/test/*.js',
		'<rootDir>/assets/**/?(*.)test.js',
		'<rootDir>/packages/**/__tests__/**/*.js',
		'<rootDir>/packages/**/test/*.js',
		'<rootDir>/packages/**/?(*.)test.js',
		'<rootDir>/tests/js/**/?(*.)test.js',
	],
	testPathIgnorePatterns: [
		'<rootDir>/.git',
		'<rootDir>/node_modules',
		'<rootDir>/assets/node_modules',
		'<rootDir>/build',
	],
	modulePathIgnorePatterns: [ '<rootDir>/.vscode' ],
	transformIgnorePatterns: [ '<rootDir>/assets/node_modules/' ],
	// Matches aliases in webpack.config.js.
	moduleNameMapper: {
		// New (JSR) modules.
		'^googlesitekit-(.+)$': '<rootDir>assets/js/googlesitekit-$1',
		// Necessary mock to prevent test failures caused by SVGR
		'\\.svg$': '<rootDir>/tests/js/svgrMock.js',
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/tests/js/fileMock.js',
	},
};
