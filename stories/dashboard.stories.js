import { storiesOf } from '@storybook/react';
import { __ } from '@wordpress/i18n';
import DashboardModuleHeader from 'GoogleComponents/dashboard/dashboard-module-header';
import CTA from 'GoogleComponents/notifications/cta';
import { createAddToFilter } from 'GoogleUtil/helpers';

import Layout from 'GoogleComponents/layout/layout';
import DashboardAcquisitionPieChart from 'GoogleModules/analytics/dashboard/dashboard-widget-acquisition-piechart';
import AnalyticsAllTrafficDashboardWidgetTopAcquisitionSources from 'GoogleModules/analytics/dashboard/dashboard-alltraffic-widget-top-acquisition-sources-table';
import PageSpeedInsightsDashboardWidgetHomepageSpeed from 'GoogleModules/pagespeed-insights/dashboard/dashboard-widget-homepage-speed';
import DashboardSearchFunnelInner from 'GoogleModules/search-console/dashboard/dashboard-widget-search-funnel-inner';
import AnalyticsDashboardWidgetTopLevel from 'GoogleModules/analytics/dashboard/dashboard-widget-top-level';
import SearchConsoleDashboardWidgetTopLevel from 'GoogleModules/search-console/dashboard/dashboard-widget-top-level';
import PostSearcher from 'GoogleComponents/post-searcher';

import { googlesitekit as analyticsDashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-module-analytics-googlesitekit';
import { googlesitekit as dashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-dashboard-googlesitekit';

storiesOf( 'Dashboard', module )
	.add( 'Module Header', () => (
		<DashboardModuleHeader
			title={ __( 'Module Header', 'google-site-kit' ) }
			description={ __( 'Description of Module', 'google-site-kit' ) }
			timePeriod={ __( 'Last 28 Days', 'google-site-kit' ) }
		/>
	) )
	.add( 'All Traffic', () => {
		window.googlesitekit = analyticsDashboardData;

		// Load the datacache with data.
		setTimeout( () => {
			wp.hooks.doAction(
				'googlesitekit.moduleLoaded',
				'Dashboard'
			);
		}, 250 );
		return (
			<Layout className="googlesitekit-dashboard-all-traffic">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-4-desktop
							mdc-layout-grid__cell--span-4-tablet
							mdc-layout-grid__cell--span-4-phone
						">
							<DashboardAcquisitionPieChart source/>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-8-desktop
							mdc-layout-grid__cell--span-4-tablet
							mdc-layout-grid__cell--span-4-phone
						">
							<AnalyticsAllTrafficDashboardWidgetTopAcquisitionSources/>
						</div>
					</div>
				</div>
			</Layout>
		);
	},
	{ options: { readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]' } } )
	.add( 'PageSpeed Insights', () => {
		window.googlesitekit = dashboardData;

		// Load the datacache with data.
		setTimeout( () => {
			wp.hooks.doAction(
				'googlesitekit.moduleLoaded',
				'Dashboard'
			);
		}, 250 );
		return (
			<Layout className="googlesitekit-pagespeed-report">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<PageSpeedInsightsDashboardWidgetHomepageSpeed />
					</div>
				</div>
			</Layout>
		);
	}, {
		options: {
			readySelector: '.googlesitekit-pagespeed-report__score-gauge',
			delay: 1000, // Wait for table overlay to animate.
		}
	} )
	.add( 'Post Searcher', () => (
		<PostSearcher/>
	) )
	.add( 'Search Funnel Analytics Inactive', () => {
		window.googlesitekit = analyticsDashboardData;

		const addSearchConsoleDashboardWidgetTopLevel = createAddToFilter( <SearchConsoleDashboardWidgetTopLevel /> );

		wp.hooks.removeAllFilters( 'googlesitekit.DashboardSearchFunnel' );

		wp.hooks.addFilter( 'googlesitekit.DashboardSearchFunnel',
			'googlesitekit.SearchConsoleSearchFunnel',
			addSearchConsoleDashboardWidgetTopLevel );

		// Load the datacache with data.
		setTimeout( () => {
			wp.hooks.doAction(
				'googlesitekit.moduleLoaded',
				'Dashboard'
			);
		}, 250 );

		return (
			<Layout className="googlesitekit-analytics-search-funnel">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<DashboardSearchFunnelInner/>
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
		);
	},
	{ options: { readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]' } } )
	.add( 'Search Funnel', () => {
		window.googlesitekit = analyticsDashboardData;

		const addAnalyticsDashboardWidgetTopLevel     = createAddToFilter( <AnalyticsDashboardWidgetTopLevel /> );
		const addSearchConsoleDashboardWidgetTopLevel = createAddToFilter( <SearchConsoleDashboardWidgetTopLevel /> );

		wp.hooks.removeAllFilters( 'googlesitekit.DashboardSearchFunnel' );
		wp.hooks.addFilter( 'googlesitekit.DashboardSearchFunnel',
			'googlesitekit.Analytics',
			addAnalyticsDashboardWidgetTopLevel, 11 );

		wp.hooks.addFilter( 'googlesitekit.DashboardSearchFunnel',
			'googlesitekit.SearchConsoleSearchFunnel',
			addSearchConsoleDashboardWidgetTopLevel );

		// Manual set some missing goals data;
		var cache = JSON.parse( googlesitekit.admin.datacache );
		cache[ 'googlesitekit_modules::analytics::goals::last-28-days' ] = JSON.parse( '{"itemsPerPage":1000,"kind":"analytics#goals","nextLink":null,"previousLink":null,"startIndex":1,"totalResults":5,"username":"user.name@gmail.com","items":[{"accountId":"XXXXXX","active":true,"created":"2016-12-06T15:36:07.002Z","id":"1","internalWebPropertyId":"XXXXXXX","kind":"analytics#goal","name":"Basic","profileId":"XXXXXXXX","selfLink":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX/goals/1","type":"URL_DESTINATION","updated":"2016-12-06T21:40:31.531Z","value":299,"webPropertyId":"UA-XXXXXX-3","parentLink":{"href":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX","type":"analytics#profile"},"urlDestinationDetails":{"caseSensitive":false,"firstStepRequired":true,"matchType":"EXACT","url":"/thankyou","steps":[{"name":"Basic Button","number":1,"url":"/pricing-basic"}]}},{"accountId":"XXXXXX","active":true,"created":"2016-12-06T16:30:57.626Z","id":"2","internalWebPropertyId":"XXXXXXX","kind":"analytics#goal","name":"Professional","profileId":"XXXXXXXX","selfLink":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX/goals/2","type":"URL_DESTINATION","updated":"2016-12-06T21:40:43.894Z","value":699,"webPropertyId":"UA-XXXXXX-3","parentLink":{"href":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX","type":"analytics#profile"},"urlDestinationDetails":{"caseSensitive":false,"firstStepRequired":true,"matchType":"EXACT","url":"/thankyou","steps":[{"name":"Professional Button","number":1,"url":"/pricing-professional"}]}},{"accountId":"XXXXXX","active":true,"created":"2016-12-06T16:31:32.429Z","id":"3","internalWebPropertyId":"XXXXXXX","kind":"analytics#goal","name":"Enterprise","profileId":"XXXXXXXX","selfLink":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX/goals/3","type":"URL_DESTINATION","updated":"2016-12-06T21:40:55.366Z","value":999,"webPropertyId":"UA-XXXXXX-3","parentLink":{"href":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX","type":"analytics#profile"},"urlDestinationDetails":{"caseSensitive":false,"firstStepRequired":true,"matchType":"EXACT","url":"/thankyou","steps":[{"name":"Enterprise Button","number":1,"url":"/pricing-enterprise"}]}},{"accountId":"XXXXXX","active":true,"created":"2016-12-06T16:32:17.667Z","id":"4","internalWebPropertyId":"XXXXXXX","kind":"analytics#goal","name":"Form Success (non-funnel)","profileId":"XXXXXXXX","selfLink":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX/goals/4","type":"URL_DESTINATION","updated":"2016-12-06T16:53:22.277Z","value":0,"webPropertyId":"UA-XXXXXX-3","parentLink":{"href":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX","type":"analytics#profile"},"urlDestinationDetails":{"caseSensitive":false,"firstStepRequired":false,"matchType":"EXACT","url":"/thankyou"}},{"accountId":"XXXXXX","active":true,"created":"2016-12-06T16:41:10.580Z","id":"5","internalWebPropertyId":"XXXXXXX","kind":"analytics#goal","name":"Get Started","profileId":"XXXXXXXX","selfLink":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX/goals/5","type":"URL_DESTINATION","updated":"2016-12-06T16:53:14.486Z","value":0,"webPropertyId":"UA-XXXXXX-3","parentLink":{"href":"https://www.googleapis.com/analytics/v3/management/accounts/XXXXXX/webproperties/UA-XXXXXX-3/profiles/XXXXXXXX","type":"analytics#profile"},"urlDestinationDetails":{"caseSensitive":false,"firstStepRequired":true,"matchType":"EXACT","url":"/thankyou","steps":[{"name":"Get Started Header Button","number":1,"url":"/get-started"}]}}]}' );

		googlesitekit.admin.datacache = JSON.stringify( cache );

		// Load the datacache with data.
		setTimeout( () => {
			wp.hooks.doAction(
				'googlesitekit.moduleLoaded',
				'Dashboard'
			);
		}, 250 );

		return (
			<Layout className="googlesitekit-analytics-search-funnel">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<DashboardSearchFunnelInner/>
					</div>
				</div>
			</Layout>
		);
	}, {
		options: {
			readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]'
		}
	} );
