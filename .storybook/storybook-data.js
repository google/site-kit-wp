module.exports = [
	/**
	 * DashboardCoreSiteAlerts renders notifications after a five second timeout
	 * and only if there has been no survey available in that time period.
	 *
	 * We have several seemingly similar backstop scenarios to catch potential
	 * regressions in our render logic.
	 *
	 * The title 'Not Displayed' in the story indicates the component won't be
	 * rendered and the lack of a readySelector in the corresponding test here
	 * indicates that we're not expecting render to occur.
	 */
	{
		id: 'adsense-module-components-module-overview-widget--loaded',
		kind: 'AdSense Module',
		name: 'Overview Widget',
		story: 'Loaded',
		parameters: {
			fileName: './stories/module-adsense-components.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector:
					'.googlesitekit-chart .googlesitekit-chart__inner',
			},
		},
	},
];
