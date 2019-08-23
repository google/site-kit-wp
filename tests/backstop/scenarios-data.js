const storybookStories = require( '../../.storybook/storybook-data' );

const scenariosData = ( rootURL ) => {
	const scenarios = [];

	storybookStories.forEach( ( story ) => {
		scenarios.push(
			{
				label: `${ story.kind }/${ story.name }`,
				url: `${ rootURL }${ story.id }`,
				readySelector: story.parameters.options.readySelector,
				hoverSelector: story.parameters.options.hoverSelector,
				clickSelector: story.parameters.options.clickSelector,
				clickSelectors: story.parameters.options.clickSelectors,
				postInteractionWait: story.parameters.options.postInteractionWait,
				delay: story.parameters.options.delay,
				onReadyScript: story.parameters.options.onReadyScript,
				misMatchThreshold: story.parameters.options.misMatchThreshold,
			}
		);
	} );

	return scenarios;
};

module.exports = scenariosData;
