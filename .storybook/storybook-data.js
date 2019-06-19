module.exports = [
	{
		'id': 'global--admin-bar',
		'kind': 'Global',
		'name': 'Admin Bar',
		'story': 'Admin Bar',
		'parameters': {
			'fileName': './stories/adminbar.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-data-block'
			}
		}
	},
	{
		'id': 'global--buttons',
		'kind': 'Global',
		'name': 'Buttons',
		'story': 'Buttons',
		'parameters': {
			'fileName': './stories/buttons.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'hoverSelector': '.googlesitekit-button--hover',
				'postInteractionWait': 3000,
				'onReadyScript': 'mouse.js'
			}
		}
	},
	{
		'id': 'dashboard--module-header',
		'kind': 'Dashboard',
		'name': 'Module Header',
		'story': 'Module Header',
		'parameters': {
			'fileName': './stories/dashboard.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'dashboard--all-traffic',
		'kind': 'Dashboard',
		'name': 'All Traffic',
		'story': 'All Traffic',
		'parameters': {
			'fileName': './stories/dashboard.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-line-chart > div[style="position: relative;"]'
			}
		}
	},
	{
		'id': 'dashboard--pagespeed-insights',
		'kind': 'Dashboard',
		'name': 'PageSpeed Insights',
		'story': 'PageSpeed Insights',
		'parameters': {
			'fileName': './stories/dashboard.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-pagespeed-report__score-gauge',
				'delay': 1000
			}
		}
	},
	{
		'id': 'dashboard--post-searcher',
		'kind': 'Dashboard',
		'name': 'Post Searcher',
		'story': 'Post Searcher',
		'parameters': {
			'fileName': './stories/dashboard.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'dashboard--search-funnel-analytics-inactive',
		'kind': 'Dashboard',
		'name': 'Search Funnel Analytics Inactive',
		'story': 'Search Funnel Analytics Inactive',
		'parameters': {
			'fileName': './stories/dashboard.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-line-chart > div[style="position: relative;"]'
			}
		}
	},
	{
		'id': 'dashboard--search-funnel',
		'kind': 'Dashboard',
		'name': 'Search Funnel',
		'story': 'Search Funnel',
		'parameters': {
			'fileName': './stories/dashboard.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-line-chart > div[style="position: relative;"]'
			}
		}
	},
	{
		'id': 'global--data-table',
		'kind': 'Global',
		'name': 'Data Table',
		'story': 'Data Table',
		'parameters': {
			'fileName': './stories/data-table.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-table-overflow',
				'delay': 2000
			}
		}
	},
	{
		'id': 'global--plugin-header',
		'kind': 'Global',
		'name': 'Plugin Header',
		'story': 'Plugin Header',
		'parameters': {
			'fileName': './stories/header.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'delay': 3000
			}
		}
	},
	{
		'id': 'global-layout--layout-with-header-footer-and-ctas',
		'kind': 'Global/Layout',
		'name': 'Layout with Header Footer and CTAs',
		'story': 'Layout with Header Footer and CTAs',
		'parameters': {
			'fileName': './stories/layout.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global-layout--layout-with-header-and-footer',
		'kind': 'Global/Layout',
		'name': 'Layout with Header and Footer',
		'story': 'Layout with Header and Footer',
		'parameters': {
			'fileName': './stories/layout.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global--links',
		'kind': 'Global',
		'name': 'Links',
		'story': 'Links',
		'parameters': {
			'fileName': './stories/links.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'hoverSelector': '.googlesitekit-cta-link--hover',
				'onReadyScript': 'mouse.js'
			}
		}
	},
	{
		'id': 'global--modal-dialog',
		'kind': 'Global',
		'name': 'Modal Dialog',
		'story': 'Modal Dialog',
		'parameters': {
			'fileName': './stories/modal-dialog.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'delay': 1000
			}
		}
	},
	{
		'id': 'adsense-module--estimate-earnings',
		'kind': 'AdSense Module',
		'name': 'Estimate Earnings',
		'story': 'Estimate Earnings',
		'parameters': {
			'fileName': './stories/module-adsense.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-data-block'
			}
		}
	},
	{
		'id': 'adsense-module--performance',
		'kind': 'AdSense Module',
		'name': 'Performance',
		'story': 'Performance',
		'parameters': {
			'fileName': './stories/module-adsense.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'adsense-module--adsense-outro',
		'kind': 'AdSense Module',
		'name': 'AdSense Outro',
		'story': 'AdSense Outro',
		'parameters': {
			'fileName': './stories/module-adsense.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'analytics-module--audience-overview-chart',
		'kind': 'Analytics Module',
		'name': 'Audience Overview Chart',
		'story': 'Audience Overview Chart',
		'parameters': {
			'fileName': './stories/module-analytics.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-line-chart > div[style="position: relative;"]'
			}
		}
	},
	{
		'id': 'analytics-module--top-acquisition-pie-chart',
		'kind': 'Analytics Module',
		'name': 'Top Acquisition Pie Chart',
		'story': 'Top Acquisition Pie Chart',
		'parameters': {
			'fileName': './stories/module-analytics.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-line-chart > div[style="position: relative;"]'
			}
		}
	},
	{
		'id': 'search-console-module--overview-chart',
		'kind': 'Search Console Module',
		'name': 'Overview Chart',
		'story': 'Overview Chart',
		'parameters': {
			'fileName': './stories/module-search-console.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-line-chart > div[style="position: relative;"]'
			}
		}
	},
	{
		'id': 'global-notifications--module-setup-complete',
		'kind': 'Global/Notifications',
		'name': 'Module Setup Complete',
		'story': 'Module Setup Complete',
		'parameters': {
			'fileName': './stories/notifications.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global-notifications--small-with-image',
		'kind': 'Global/Notifications',
		'name': 'Small with Image',
		'story': 'Small with Image',
		'parameters': {
			'fileName': './stories/notifications.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global-notifications--small-with-no-image',
		'kind': 'Global/Notifications',
		'name': 'Small with No Image',
		'story': 'Small with No Image',
		'parameters': {
			'fileName': './stories/notifications.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global-notifications--small-with-error',
		'kind': 'Global/Notifications',
		'name': 'Small with Error',
		'story': 'Small with Error',
		'parameters': {
			'fileName': './stories/notifications.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global-notifications--small-with-warning',
		'kind': 'Global/Notifications',
		'name': 'Small with Warning',
		'story': 'Small with Warning',
		'parameters': {
			'fileName': './stories/notifications.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global-notifications--traffic-increase-win',
		'kind': 'Global/Notifications',
		'name': 'Traffic Increase Win',
		'story': 'Traffic Increase Win',
		'parameters': {
			'fileName': './stories/notifications.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global-notifications--pageview-increase-win',
		'kind': 'Global/Notifications',
		'name': 'Pageview Increase Win',
		'story': 'Pageview Increase Win',
		'parameters': {
			'fileName': './stories/notifications.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global-notifications--publishing-win',
		'kind': 'Global/Notifications',
		'name': 'Publishing Win',
		'story': 'Publishing Win',
		'parameters': {
			'fileName': './stories/notifications.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global-notifications--total-stats',
		'kind': 'Global/Notifications',
		'name': 'Total Stats',
		'story': 'Total Stats',
		'parameters': {
			'fileName': './stories/notifications.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global--page-headers',
		'kind': 'Global',
		'name': 'Page Headers',
		'story': 'Page Headers',
		'parameters': {
			'fileName': './stories/page-header.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global--progress-bars',
		'kind': 'Global',
		'name': 'Progress Bars',
		'story': 'Progress Bars',
		'parameters': {
			'fileName': './stories/progress-bars.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'misMatchThreshold': 10
			}
		}
	},
	{
		'id': 'global--radios',
		'kind': 'Global',
		'name': 'Radios',
		'story': 'Radios',
		'parameters': {
			'fileName': './stories/radio.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global--selects',
		'kind': 'Global',
		'name': 'Selects',
		'story': 'Selects',
		'parameters': {
			'fileName': './stories/select.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'delay': 3000,
				'clickSelector': '.googlesitekit-story-select-click',
				'postInteractionWait': 3000,
				'onReadyScript': 'mouse.js'
			}
		}
	},
	{
		'id': 'settings--settings-tabs',
		'kind': 'Settings',
		'name': 'Settings Tabs',
		'story': 'Settings Tabs',
		'parameters': {
			'fileName': './stories/settings.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'delay': 3000
			}
		}
	},
	{
		'id': 'settings--connected-services',
		'kind': 'Settings',
		'name': 'Connected Services',
		'story': 'Connected Services',
		'parameters': {
			'fileName': './stories/settings.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'delay': 1000
			}
		}
	},
	{
		'id': 'settings--vrt-editing-settings-module',
		'kind': 'Settings',
		'name': 'VRT: Editing Settings Module',
		'story': 'VRT: Editing Settings Module',
		'parameters': {
			'fileName': './stories/settings.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'delay': 2000,
				'clickSelectors': [
					'#googlesitekit-settings-module__header--analytics',
					'.googlesitekit-settings-module__edit-button'
				],
				'hoverSelector': '.googlesitekit-settings-module__title',
				'postInteractionWait': 3000,
				'onReadyScript': 'mouse.js'
			}
		}
	},
	{
		'id': 'settings--connect-more-services',
		'kind': 'Settings',
		'name': 'Connect More Services',
		'story': 'Connect More Services',
		'parameters': {
			'fileName': './stories/settings.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'settings--admin-settings',
		'kind': 'Settings',
		'name': 'Admin Settings',
		'story': 'Admin Settings',
		'parameters': {
			'fileName': './stories/settings.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'setup--client-id',
		'kind': 'Setup',
		'name': 'Client ID',
		'story': 'Client ID',
		'parameters': {
			'fileName': './stories/setup.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'splash--splash-page',
		'kind': 'Splash',
		'name': 'Splash Page',
		'story': 'Splash Page',
		'parameters': {
			'fileName': './stories/splash.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global--switches',
		'kind': 'Global',
		'name': 'Switches',
		'story': 'Switches',
		'parameters': {
			'fileName': './stories/switch.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'global--text-fields',
		'kind': 'Global',
		'name': 'Text Fields',
		'story': 'Text Fields',
		'parameters': {
			'fileName': './stories/text-field.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'wordpress--wordpress-activation',
		'kind': 'WordPress',
		'name': 'WordPress Activation',
		'story': 'WordPress Activation',
		'parameters': {
			'fileName': './stories/wp-activation.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {}
			}
		}
	},
	{
		'id': 'wordpress--wordpress-dashboard',
		'kind': 'WordPress',
		'name': 'WordPress Dashboard',
		'story': 'WordPress Dashboard',
		'parameters': {
			'fileName': './stories/wp-dashboard.stories.js',
			'options': {
				'hierarchyRootSeparator': '|',
				'hierarchySeparator': {},
				'readySelector': '.googlesitekit-data-block',
				'delay': 2000
			}
		}
	}
];
