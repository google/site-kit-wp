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
		id: 'components-dashboardcoresitealerts--notification-cta',
		kind: 'Global',
		name: 'DashboardCoreSiteAlerts1',
		story: 'DashboardCoreSiteAlerts1',
		parameters: {
			fileName: './assets/js/components/legacy-notifications/DashboardCoreSiteAlerts.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-publisher-win',
			},
		},
	},
	{
		id: 'components-dashboardcoresitealerts--no-notifications',
		kind: 'Global',
		name: 'DashboardCoreSiteAlerts2',
		story: 'DashboardCoreSiteAlerts2',
		parameters: {
			fileName: './assets/js/components/legacy-notifications/DashboardCoreSiteAlerts.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'components-dashboardcoresitealerts--notification-cta-with-survey',
		kind: 'Global',
		name: 'DashboardCoreSiteAlerts3',
		story: 'DashboardCoreSiteAlerts3',
		parameters: {
			fileName: './assets/js/components/legacy-notifications/DashboardCoreSiteAlerts.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'components-dashboardcoresitealerts--notification-cta-with-survey-short-delay',
		kind: 'Global',
		name: 'DashboardCoreSiteAlerts4',
		story: 'DashboardCoreSiteAlerts4',
		parameters: {
			fileName: './assets/js/components/legacy-notifications/DashboardCoreSiteAlerts.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'components-dashboardcoresitealerts--notification-cta-with-survey-longer-delay',
		kind: 'Global',
		name: 'DashboardCoreSiteAlerts5',
		story: 'DashboardCoreSiteAlerts5',
		parameters: {
			fileName: './assets/js/components/legacy-notifications/DashboardCoreSiteAlerts.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-publisher-win',
			},
		},
	},
	{
		id: 'views-adminbarapp-adminbarapp--ready',
		kind: 'Global',
		name: 'Admin Bar',
		story: 'Admin Bar',
		parameters: {
			fileName: './assets/js/components/adminbar/AdminBarApp.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-data-block',
			},
		},
	},
	{
		id: 'components-button--vrt-story',
		kind: 'Global',
		name: 'Buttons',
		story: 'VRT Story',
		parameters: {
			fileName: './assets/js/components/Button.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				hoverSelector: '.googlesitekit-button--hover',
				postInteractionWait: 3000,
				onReadyScript: 'mouse.js',
			},
		},
	},
	{
		id: 'dashboard--module-header',
		kind: 'Dashboard',
		name: 'Module Header',
		story: 'Module Header',
		parameters: {
			fileName: './stories/dashboard.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'dashboard--post-searcher',
		kind: 'Dashboard',
		name: 'Post Searcher',
		story: 'Post Searcher',
		parameters: {
			fileName: './stories/dashboard.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'dashboard--search-funnel-analytics-inactive',
		kind: 'Dashboard',
		name: 'Search Funnel Analytics Inactive',
		story: 'Search Funnel Analytics Inactive',
		parameters: {
			fileName: './stories/dashboard.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-chart .googlesitekit-chart__inner',
			},
		},
	},
	{
		id: 'dashboard--search-funnel',
		kind: 'Dashboard',
		name: 'Search Funnel',
		story: 'Search Funnel',
		parameters: {
			fileName: './stories/dashboard.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-chart .googlesitekit-chart__inner',
			},
		},
	},
	{
		id: 'global--data-table',
		kind: 'Global',
		name: 'Data Table',
		story: 'Data Table',
		parameters: {
			fileName: './stories/data-table.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-table-overflow',
				delay: 2000,
			},
		},
	},
	{
		id: 'global--plugin-header',
		kind: 'Global',
		name: 'Plugin Header',
		story: 'Plugin Header',
		parameters: {
			fileName: './stories/header.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				delay: 3000,
			},
		},
	},
	{
		id: 'global--plugin-header-with-date-selector',
		kind: 'Global',
		name: 'Plugin Header with Date Selector',
		story: 'Plugin Header with Date Selector',
		parameters: {
			fileName: './stories/header-date-selector.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				delay: 3000,
			},
		},
	},
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
		id: 'global--modal-dialog',
		kind: 'Global',
		name: 'Modal Dialog',
		story: 'Modal Dialog',
		parameters: {
			fileName: './stories/modal-dialog.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				delay: 1000,
			},
		},
	},
	{
		id: 'adsense-module--performance',
		kind: 'AdSense Module',
		name: 'Performance',
		story: 'Performance',
		parameters: {
			fileName: './stories/module-adsense.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				delay: 1000,
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
				readySelector: '.googlesitekit-chart .googlesitekit-chart__inner',
			},
		},
	},
	{
		id: 'analytics-module--audience-overview-chart',
		kind: 'Analytics Module',
		name: 'Audience Overview Chart',
		story: 'Audience Overview Chart',
		parameters: {
			fileName: './stories/module-analytics.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-chart .googlesitekit-chart__inner',
			},
		},
	},
	{
		id: 'analytics-module-components-module-page-overview-widget--loaded',
		kind: 'Analytics Module',
		name: 'Overview Widget',
		story: 'Loaded',
		parameters: {
			fileName: './stories/module-analytics-components.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-chart .googlesitekit-chart__inner',
			},
		},
	},
	{
		id: 'analytics-module--top-acquisition-pie-chart',
		kind: 'Analytics Module',
		name: 'Top Acquisition Pie Chart',
		story: 'Top Acquisition Pie Chart',
		parameters: {
			fileName: './stories/module-analytics.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-chart .googlesitekit-chart__inner',
			},
		},
	},
	{
		id: 'search-console-module-components-module-page-overview-widget--loaded',
		kind: 'Search Console Module',
		name: 'Overview Widget',
		story: 'Loaded',
		parameters: {
			fileName: './stories/module-search-console-components.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-chart .googlesitekit-chart__inner',
			},
		},
	},
	{
		id: 'search-console-module--overview-chart',
		kind: 'Search Console Module',
		name: 'Overview Chart',
		story: 'Overview Chart',
		parameters: {
			fileName: './stories/module-search-console.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
				readySelector: '.googlesitekit-chart .googlesitekit-chart__inner',
			},
		},
	},
	{
		id: 'global-notifications--module-setup-complete',
		kind: 'Global/Notifications',
		name: 'Module Setup Complete',
		story: 'Module Setup Complete',
		parameters: {
			fileName: './stories/notifications.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global-notifications--small-with-image',
		kind: 'Global/Notifications',
		name: 'Small with Image',
		story: 'Small with Image',
		parameters: {
			fileName: './stories/notifications.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global-notifications--small-with-no-image',
		kind: 'Global/Notifications',
		name: 'Small with No Image',
		story: 'Small with No Image',
		parameters: {
			fileName: './stories/notifications.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global-notifications--small-with-error',
		kind: 'Global/Notifications',
		name: 'Small with Error',
		story: 'Small with Error',
		parameters: {
			fileName: './stories/notifications.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global-notifications--small-with-warning',
		kind: 'Global/Notifications',
		name: 'Small with Warning',
		story: 'Small with Warning',
		parameters: {
			fileName: './stories/notifications.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
			},
		},
	},
	{
		id: 'global-notifications--user-input-success-notification',
		kind: 'Global/Notifications',
		name: 'User Input Success Notification',
		story: 'User Input Success Notification',
		parameters: {
			fileName: './stories/notifications.stories.js',
			options: {
				hierarchyRootSeparator: '|',
				hierarchySeparator: {},
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
				misMatchThreshold: 10,
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
		id: 'global--text-fields',
		kind: 'Global',
		name: 'Text Fields',
		story: 'Text Fields',
		parameters: {
			fileName: './stories/text-field.stories.js',
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
