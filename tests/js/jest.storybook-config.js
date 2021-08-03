const jestConfig = require( './jest.config' );

module.exports = {
	...jestConfig,
	testMatch: [ '<rootDir>/.storybook/?(*.)test.js' ],
};
