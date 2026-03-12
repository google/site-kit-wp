const baseConfig = require( './.eslintrc.js' );

module.exports = {
	...baseConfig,
	rules: {
		...baseConfig.rules,
		'sitekit/no-storybook-scenario-label': 'error',
	},
};
