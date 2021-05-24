/**
 * Dashboard Page Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import DashboardModuleHeader from '../assets/js/components/dashboard/DashboardModuleHeader';
import CTA from '../assets/js/components/legacy-notifications/cta';
import { createAddToFilter } from '../assets/js/util/helpers';
import Layout from '../assets/js/components/layout/Layout';
import LegacyDashboardSearchFunnelInner from '../assets/js/modules/search-console/components/dashboard/LegacyDashboardSearchFunnelInner';
import LegacyAnalyticsDashboardWidgetTopLevel from '../assets/js/modules/analytics/components/dashboard/LegacyAnalyticsDashboardWidgetTopLevel';
import LegacySearchConsoleDashboardWidgetTopLevel from '../assets/js/modules/search-console/components/dashboard/LegacySearchConsoleDashboardWidgetTopLevel';
import PostSearcher from '../assets/js/components/PostSearcher';
import URLSearchWidget from '../assets/js/googlesitekit/widgets/components/URLSearchWidget';
import { googlesitekit as analyticsDashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-module-analytics-googlesitekit';
import { CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../assets/js/modules/search-console/datastore/constants';
import { provideSiteInfo, WithTestRegistry } from '../tests/js/utils';
import { getWidgetComponentProps } from '../assets/js/googlesitekit/widgets/util';

storiesOf( 'Dashboard', module )
	.add( 'Module Header', () => (
		<DashboardModuleHeader
			title={ __( 'Module Header', 'google-site-kit' ) }
			description={ __( 'Description of Module', 'google-site-kit' ) }
		/>
	) )
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
	.add( 'URL Search Widget', () => {
		const setupRegistry = ( registry ) => provideSiteInfo( registry );
		const widgetComponentProps = getWidgetComponentProps( 'urlSearch' );

		return (
			<WithTestRegistry callback={ setupRegistry } >
				<URLSearchWidget { ...widgetComponentProps } />
			</WithTestRegistry>
		);
	} )
	.add( 'Search Funnel Analytics Inactive', () => {
		global._googlesitekitLegacyData = analyticsDashboardData;

		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				accountID: '123456789',
				propertyID: '123456789',
				internalWebPropertyID: '123456789',
				profileID: '123456789',
			} );
			dispatch( MODULES_SEARCH_CONSOLE ).receiveGetSettings( {
				propertyID: 'https://example.com/',
			} );
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
									title={ __( 'Learn more about what visitors do on your site', 'google-site-kit' ) }
									description={ __( 'Connecting with Google Analytics to see unique visitors, goal completions, top pages and more', 'google-site-kit' ) }
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
	{ options: { readySelector: '.googlesitekit-chart .googlesitekit-chart__inner' } } )
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
			dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				accountID: '123456789',
				propertyID: '123456789',
				internalWebPropertyID: '123456789',
				profileID: '123456789',
			} );
			dispatch( MODULES_SEARCH_CONSOLE ).receiveGetSettings( {
				propertyID: 'https://example.com/',
			} );
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
			readySelector: '.googlesitekit-chart .googlesitekit-chart__inner',
		},
	} );
