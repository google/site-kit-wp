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
		id: 'global-layout--layout-with-header-footer-and-ctas',
		kind: 'Global/Layout',
		name: 'Layout with Header Footer and CTAs',
		story: 'Layout with Header Footer and CTAs',
		parameters: {
			fileName: './stories/layout.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global-layout--layout-with-header-and-footer',
		kind: 'Global/Layout',
		name: 'Layout with Header and Footer',
		story: 'Layout with Header and Footer',
		parameters: {
			fileName: './stories/layout.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global--links',
		kind: 'Global',
		name: 'Links',
		story: 'Links',
		parameters: {
			fileName: './stories/links.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				hoverSelector: '.googlesitekit-cta-link--hover',
				onReadyScript: 'mouse.js',
			},
		},
	},
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
	{
		id: 'global--page-headers',
		kind: 'Global',
		name: 'Page Headers',
		story: 'Page Headers',
		parameters: {
			fileName: './stories/page-header.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global--progress-bars',
		kind: 'Global',
		name: 'Progress Bars',
		story: 'Progress Bars',
		parameters: {
			fileName: './stories/progress-bars.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global--radios',
		kind: 'Global',
		name: 'Radios',
		story: 'Radios',
		parameters: {
			fileName: './stories/radio.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global--selects',
		kind: 'Global',
		name: 'Selects',
		story: 'Selects',
		parameters: {
			fileName: './stories/select.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				delay: 3000,
				clickSelector: '.googlesitekit-story-select-click',
				postInteractionWait: 3000,
				onReadyScript: 'mouse.js',
			},
		},
	},
	{
		id: 'settings--settings-tabs',
		kind: 'Settings',
		name: 'Settings Tabs',
		story: 'Settings Tabs',
		parameters: {
			fileName: './stories/settings.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				delay: 3000,
			},
		},
	},
	{
		id: 'settings--connected-services',
		kind: 'Settings',
		name: 'Connected Services',
		story: 'Connected Services',
		parameters: {
			fileName: './stories/settings.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				delay: 1000,
			},
		},
	},
	{
		id: 'settings--connect-more-services',
		kind: 'Settings',
		name: 'Connect More Services',
		story: 'Connect More Services',
		parameters: {
			fileName: './stories/settings.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'settings--admin-settings',
		kind: 'Settings',
		name: 'Admin Settings',
		story: 'Admin Settings',
		parameters: {
			fileName: './stories/settings.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'setup-using-gcp--step-one',
		kind: 'Setup / Using GCP',
		name: 'Step One',
		story: 'Step One',
		parameters: {
			fileName: './stories/setup.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global--switches',
		kind: 'Global',
		name: 'Switches',
		story: 'Switches',
		parameters: {
			fileName: './stories/switch.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global--visually-hidden',
		kind: 'Global',
		name: 'Visually Hidden',
		story: 'Visually Hidden',
		parameters: {
			fileName: './stories/visually-hidden.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'wordpress--wordpress-dashboard',
		kind: 'WordPress',
		name: 'WordPress Dashboard',
		story: 'WordPress Dashboard',
		parameters: {
			fileName: './stories/wp-dashboard.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-data-block',
				delay: 2000,
			},
		},
	},
];
