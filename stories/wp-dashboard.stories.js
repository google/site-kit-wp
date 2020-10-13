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
import GoogleLogoIcon from '../assets/svg/logo-g.svg';
import SiteKitLogoIcon from '../assets/svg/logo-sitekit.svg';
import WPDashboardMain from '../assets/js/components/wp-dashboard/wp-dashboard-main';
import { googlesitekit as wpDashboardData } from '../.storybook/data/wp-admin-index.php--googlesitekit';
import WPSearchConsoleDashboardWidget from '../assets/js/modules/search-console/components/wp-dashboard/WPSearchConsoleDashboardWidget';
import { createAddToFilter } from '../assets/js/util/helpers';
import WPAnalyticsDashboardWidgetOverview from '../assets/js/modules/analytics/components/wp-dashboard/WPAnalyticsDashboardWidgetOverview';
import WPAnalyticsDashboardWidgetTopPagesTable from '../assets/js/modules/analytics/components/wp-dashboard/WPAnalyticsDashboardWidgetTopPagesTable';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'WordPress', module )
	.add( 'WordPress Dashboard', () => {
		global._googlesitekitLegacyData = wpDashboardData;
		global._googlesitekitLegacyData.admin.assetsRoot = '/assets/';
		global._googlesitekitLegacyData.canAdsRun = true;

		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				usingProxy: true,
				referenceSiteURL: 'https://example.com',
				adminURL: 'https://example.com/wp-admin/',
				siteName: 'My Site Name',
			} );
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: true,
				requiredScopes: [],
				grantedScopes: [],
			} );
		};

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
								<GoogleLogoIcon height="19" width="19" />
								<SiteKitLogoIcon height="17" width="78" />
							</span></span>
						</h2>
						<div className="inside">
							<div id="js-googlesitekit-wp-dashboard">
								<WithTestRegistry callback={ setupRegistry }>
									<WPDashboardMain />
								</WithTestRegistry>
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
