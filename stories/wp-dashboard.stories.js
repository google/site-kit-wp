/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { addFilter, doAction, removeAllFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import SvgIcon from '../assets/js/util/svg-icon';
import WPDashboardMain from '../assets/js/components/wp-dashboard/wp-dashboard-main';
import { googlesitekit as wpDashboardData } from '../.storybook/data/wp-admin-index.php--googlesitekit';
import WPSearchConsoleDashboardWidget from '../assets/js/modules/search-console/wp-dashboard/wp-dashboard-widget';
import { createAddToFilter } from '../assets/js/util/helpers';
import WPAnalyticsDashboardWidgetOverview from '../assets/js/modules/analytics/wp-dashboard/wp-dashboard-widget-overview';
import WPAnalyticsDashboardWidgetTopPagesTable from '../assets/js/modules/analytics/wp-dashboard/wp-dashboard-widget-top-pages-table';

storiesOf( 'WordPress', module )
	.add( 'WordPress Dashboard', () => {
		global.googlesitekit = wpDashboardData;
		global.googlesitekit.admin.assetsRoot = '/assets/';
		global.googlesitekit.canAdsRun = true;
		const addWPSearchConsoleDashboardWidget = createAddToFilter( <WPSearchConsoleDashboardWidget /> );
		const addWPAnalyticsDashboardWidgetOverview = createAddToFilter( <WPAnalyticsDashboardWidgetOverview /> );
		const addWPAnalyticsDashboardWidgetTopPagesTable = createAddToFilter( <WPAnalyticsDashboardWidgetTopPagesTable /> );

		removeAllFilters( 'googlesitekit.WPDashboardHeader' );
		removeAllFilters( 'googlesitekit.WPDashboardModule' );

		addFilter( 'googlesitekit.WPDashboardHeader',
			'googlesitekit.SearchConsole',
			addWPSearchConsoleDashboardWidget, 11 );

		addFilter( 'googlesitekit.WPDashboardHeader',
			'googlesitekit.Analytics',
			addWPAnalyticsDashboardWidgetOverview, 1 );
		addFilter( 'googlesitekit.WPDashboardModule',
			'googlesitekit.Analytics',
			addWPAnalyticsDashboardWidgetTopPagesTable );

		setTimeout( () => {
			doAction(
				'googlesitekit.moduleLoaded',
				'WPDashboard'
			);
		}, 250 );

		return (
			<div id="dashboard-widgets">
				<div className="metabox-holder">
					<div id="google_dashboard_widget" className="postbox">
						<h2 className="hndle ui-sortable-handle">
							<span><span className="googlesitekit-logo googlesitekit-logo--mini">
								<SvgIcon id="logo-g" height="19" width="19" />
								<SvgIcon id="logo-sitekit" height="17" width="78" />
							</span></span>
						</h2>
						<div className="inside">
							<div id="js-googlesitekit-wp-dashboard">
								<WPDashboardMain />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}, {
		options: {
			readySelector: '.googlesitekit-data-block',
			delay: 2000, // Wait for table overlay to animate.
		},
	} );
