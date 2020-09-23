/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { addFilter, doAction, removeAllFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DashboardModuleHeader from '../assets/js/components/dashboard/dashboard-module-header';
import CTA from '../assets/js/components/notifications/cta';
import { createAddToFilter } from '../assets/js/util/helpers';
import Layout from '../assets/js/components/layout/layout';
import LegacyDashboardAcquisitionPieChart from '../assets/js/modules/analytics/components/dashboard/LegacyDashboardAcquisitionPieChart';
import LegacyAnalyticsAllTrafficDashboardWidgetTopAcquisitionSources from '../assets/js/modules/analytics/components/dashboard/LegacyAnalyticsAllTrafficDashboardWidgetTopAcquisitionSources';
import LegacyDashboardSearchFunnelInner from '../assets/js/modules/search-console/components/dashboard/LegacyDashboardSearchFunnelInner';
import LegacyAnalyticsDashboardWidgetTopLevel from '../assets/js/modules/analytics/components/dashboard/LegacyAnalyticsDashboardWidgetTopLevel';
import LegacySearchConsoleDashboardWidgetTopLevel from '../assets/js/modules/search-console/components/dashboard/LegacySearchConsoleDashboardWidgetTopLevel';
import PostSearcher from '../assets/js/components/PostSearcher';
import { googlesitekit as analyticsDashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-module-analytics-googlesitekit';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as ANALYTICS_STORE } from '../assets/js/modules/analytics/datastore/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Dashboard', module )
	.add( 'Module Header', () => (
		<DashboardModuleHeader
			title={ __( 'Module Header', 'google-site-kit' ) }
			description={ __( 'Description of Module', 'google-site-kit' ) }
		/>
	) )
	.add( 'All Traffic', () => {
		global._googlesitekitLegacyData = analyticsDashboardData;

		const setupRegistry = ( { dispatch } ) => {
			dispatch( ANALYTICS_STORE ).receiveGetSettings( {} );
			dispatch( ANALYTICS_STORE ).setAccountID( '123456789' );
			dispatch( ANALYTICS_STORE ).setPropertyID( '123456789' );
			dispatch( ANALYTICS_STORE ).setInternalWebPropertyID( '123456789' );
			dispatch( ANALYTICS_STORE ).setProfileID( '123456789' );
		};

		// Load the datacache with data.
		setTimeout( () => {
			doAction(
				'googlesitekit.moduleLoaded',
				'Dashboard'
			);
		}, 250 );
		return (
			<WithTestRegistry callback={ setupRegistry } >
				<Layout className="googlesitekit-dashboard-all-traffic">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-4-desktop
							mdc-layout-grid__cell--span-4-tablet
							mdc-layout-grid__cell--span-4-phone
						">
								<LegacyDashboardAcquisitionPieChart source />
							</div>
							<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-8-desktop
							mdc-layout-grid__cell--span-4-tablet
							mdc-layout-grid__cell--span-4-phone
						">
								<LegacyAnalyticsAllTrafficDashboardWidgetTopAcquisitionSources />
							</div>
						</div>
					</div>
				</Layout>
			</WithTestRegistry>
		);
	},
	{ options: { readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]' } } )
	.add( 'Post Searcher', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				usingProxy: true,
				referenceSiteURL: 'http://example.com',
				adminURL: 'http://example.com/wp-admin',
				timezone: 'America/Detroit',
				siteName: 'My Site Name',
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry } >
				<PostSearcher />
			</WithTestRegistry>
		);
	} )
	.add( 'Search Funnel Analytics Inactive', () => {
		global._googlesitekitLegacyData = analyticsDashboardData;

		const setupRegistry = ( { dispatch } ) => {
			dispatch( ANALYTICS_STORE ).receiveGetSettings( {} );
			dispatch( ANALYTICS_STORE ).setAccountID( '123456789' );
			dispatch( ANALYTICS_STORE ).setPropertyID( '123456789' );
			dispatch( ANALYTICS_STORE ).setInternalWebPropertyID( '123456789' );
			dispatch( ANALYTICS_STORE ).setProfileID( '123456789' );
		};

		const addLegacySearchConsoleDashboardWidgetTopLevel = createAddToFilter( <LegacySearchConsoleDashboardWidgetTopLevel /> );

		removeAllFilters( 'googlesitekit.DashboardSearchFunnel' );

		addFilter( 'googlesitekit.DashboardSearchFunnel',
			'googlesitekit.SearchConsoleSearchFunnel',
			addLegacySearchConsoleDashboardWidgetTopLevel );

		// Load the datacache with data.
		setTimeout( () => {
			doAction(
				'googlesitekit.moduleLoaded',
				'Dashboard'
			);
		}, 250 );

		return (
			<WithTestRegistry callback={ setupRegistry } >
				<Layout className="googlesitekit-analytics-search-funnel">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<LegacyDashboardSearchFunnelInner />
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-4-phone
								mdc-layout-grid__cell--span-4-tablet
								mdc-layout-grid__cell--span-6-desktop
							">
								<CTA
									title={ __( 'Learn more about what visitors do on your site.', 'google-site-kit' ) }
									description={ __( 'Connecting with Google Analytics to see unique vistors, goal completions, top pages and more.', 'google-site-kit' ) }
									ctaLink="#"
									ctaLabel={ __( 'Set up analytics', 'google-site-kit' ) }
								/>
							</div>
						</div>
					</div>
				</Layout>
			</WithTestRegistry>
		);
	},
	{ options: { readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]' } } )
	.add( 'Search Funnel', () => {
		global._googlesitekitLegacyData = analyticsDashboardData;

		const addLegacyAnalyticsDashboardWidgetTopLevel = createAddToFilter( <LegacyAnalyticsDashboardWidgetTopLevel /> );
		const addLegacySearchConsoleDashboardWidgetTopLevel = createAddToFilter( <LegacySearchConsoleDashboardWidgetTopLevel /> );

		removeAllFilters( 'googlesitekit.DashboardSearchFunnel' );
		addFilter( 'googlesitekit.DashboardSearchFunnel',
			'googlesitekit.Analytics',
			addLegacyAnalyticsDashboardWidgetTopLevel, 11 );

		addFilter( 'googlesitekit.DashboardSearchFunnel',
			'googlesitekit.SearchConsoleSearchFunnel',
			addLegacySearchConsoleDashboardWidgetTopLevel );

		// Manual set some missing goals data;
		const datacacheIsString = 'string' === typeof global._googlesitekitLegacyData.admin.datacache;
		if ( datacacheIsString ) {
			global._googlesitekitLegacyData.admin.datacache = JSON.parse( global._googlesitekitLegacyData.admin.datacache );
		}
		global._googlesitekitLegacyData.admin.datacache[ 'modules::analytics::goals::ed2bfff92ddeb68e5946584315c67b28' ] = JSON.parse( '{"itemsPerPage":1000,"kind":"analytics#goals","nextLink":null,"previousLink":null,"startIndex":1,"totalResults":5,"username":"user.name@gmail.com","items":[{"accountID":"XXXXXX","active":true,"created":"2016-12-06T15:36:07.002Z","id":"1","internalWebPropertyID":"XXXXXXX","kind":"analytics#goal","name":"Basic","profileID":"XXXXXXXX","selfLink":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX/goals/1","type":"URL_DESTINATION","updated":"2016-12-06T21:40:31.531Z","value":299,"webPropertyID":"UA-XXXXXX-3","parentLink":{"href":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX","type":"analytics#profile"},"urlDestinationDetails":{"caseSensitive":false,"firstStepRequired":true,"matchType":"EXACT","url":"/thankyou","steps":[{"name":"Basic Button","number":1,"url":"/pricing-basic"}]}},{"accountID":"XXXXXX","active":true,"created":"2016-12-06T16:30:57.626Z","id":"2","internalWebPropertyID":"XXXXXXX","kind":"analytics#goal","name":"Professional","profileID":"XXXXXXXX","selfLink":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX/goals/2","type":"URL_DESTINATION","updated":"2016-12-06T21:40:43.894Z","value":699,"webPropertyID":"UA-XXXXXX-3","parentLink":{"href":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX","type":"analytics#profile"},"urlDestinationDetails":{"caseSensitive":false,"firstStepRequired":true,"matchType":"EXACT","url":"/thankyou","steps":[{"name":"Professional Button","number":1,"url":"/pricing-professional"}]}},{"accountID":"XXXXXX","active":true,"created":"2016-12-06T16:31:32.429Z","id":"3","internalWebPropertyID":"XXXXXXX","kind":"analytics#goal","name":"Enterprise","profileID":"XXXXXXXX","selfLink":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX/goals/3","type":"URL_DESTINATION","updated":"2016-12-06T21:40:55.366Z","value":999,"webPropertyID":"UA-XXXXXX-3","parentLink":{"href":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX","type":"analytics#profile"},"urlDestinationDetails":{"caseSensitive":false,"firstStepRequired":true,"matchType":"EXACT","url":"/thankyou","steps":[{"name":"Enterprise Button","number":1,"url":"/pricing-enterprise"}]}},{"accountID":"XXXXXX","active":true,"created":"2016-12-06T16:32:17.667Z","id":"4","internalWebPropertyID":"XXXXXXX","kind":"analytics#goal","name":"Form Success (non-funnel)","profileID":"XXXXXXXX","selfLink":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX/goals/4","type":"URL_DESTINATION","updated":"2016-12-06T16:53:22.277Z","value":0,"webPropertyID":"UA-XXXXXX-3","parentLink":{"href":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX","type":"analytics#profile"},"urlDestinationDetails":{"caseSensitive":false,"firstStepRequired":false,"matchType":"EXACT","url":"/thankyou"}},{"accountID":"XXXXXX","active":true,"created":"2016-12-06T16:41:10.580Z","id":"5","internalWebPropertyID":"XXXXXXX","kind":"analytics#goal","name":"Get Started","profileID":"XXXXXXXX","selfLink":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX/goals/5","type":"URL_DESTINATION","updated":"2016-12-06T16:53:14.486Z","value":0,"webPropertyID":"UA-XXXXXX-3","parentLink":{"href":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX","type":"analytics#profile"},"urlDestinationDetails":{"caseSensitive":false,"firstStepRequired":true,"matchType":"EXACT","url":"/thankyou","steps":[{"name":"Get Started Header Button","number":1,"url":"/get-started"}]}}]}' );
		if ( datacacheIsString ) {
			global._googlesitekitLegacyData.admin.datacache = JSON.stringify( global._googlesitekitLegacyData.admin.datacache );
		}

		// Load the datacache with data.
		setTimeout( () => {
			doAction(
				'googlesitekit.moduleLoaded',
				'Dashboard'
			);
		}, 250 );
		const setupRegistry = ( { dispatch } ) => {
			dispatch( ANALYTICS_STORE ).receiveGetSettings( {} );
			dispatch( ANALYTICS_STORE ).setAccountID( '123456789' );
			dispatch( ANALYTICS_STORE ).setPropertyID( '123456789' );
			dispatch( ANALYTICS_STORE ).setInternalWebPropertyID( '123456789' );
			dispatch( ANALYTICS_STORE ).setProfileID( '123456789' );
		};
		return (
			<WithTestRegistry callback={ setupRegistry } >
				<Layout className="googlesitekit-analytics-search-funnel">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<LegacyDashboardSearchFunnelInner />
						</div>
					</div>
				</Layout>
			</WithTestRegistry>
		);
	}, {
		options: {
			readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]',
		},
	} );
