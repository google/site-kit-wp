/**
 * WP Dashboard Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import GoogleLogoIcon from '../assets/svg/logo-g.svg';
import SiteKitLogoIcon from '../assets/svg/logo-sitekit.svg';
import WPDashboardApp from '../assets/js/components/wp-dashboard/WPDashboardApp';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import {
	wpDashboardClicksArgs,
	wpDashboardClicksData,
	wpDashboardImpressionsArgs,
	wpDashboardImpressionsData,
} from '../assets/js/modules/search-console/datastore/__fixtures__';
import { MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import {
	WithTestRegistry,
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
} from '../tests/js/utils';
import { MODULES_SEARCH_CONSOLE } from '../assets/js/modules/search-console/datastore/constants';
import { withActive, withConnected } from '../assets/js/googlesitekit/modules/datastore/__fixtures__';
import { getAnalyticsMockResponse } from '../assets/js/modules/analytics/util/data-mock';

const reportOptions = [
	// For <WPDashboardUniqueVisitors />
	{
		startDate: '2020-12-26',
		endDate: '2021-01-22',
		compareStartDate: '2020-11-28',
		compareEndDate: '2020-12-25',
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
	},

	// For <WPDashboardSessionDuration />
	{
		startDate: '2020-12-26',
		endDate: '2021-01-22',
		compareStartDate: '2020-11-28',
		compareEndDate: '2020-12-25',
		dimensions: 'ga:date',
		limit: 10,
		metrics: [
			{
				expression: 'ga:avgSessionDuration',
				alias: 'Average Session Duration',
			},
		],
	},

	// For <WPDashboardPopularPages />
	{
		startDate: '2020-12-26',
		endDate: '2021-01-22',
		compareStartDate: '2020-11-28',
		compareEndDate: '2020-12-25',
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
		],
		dimensions: [
			'ga:pageTitle',
			'ga:pagePath',
		],
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 5,
	},
];

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	provideSiteInfo( registry );
	provideUserAuthentication( registry );

	return (
		<Story registry={ registry } />
	);
};

storiesOf( 'WordPress', module )
	.add( 'WordPress Dashboard', ( args, { registry } ) => {
		registry.dispatch( CORE_MODULES ).receiveGetModules( withConnected( 'analytics' ) );
		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-23' );

		reportOptions.forEach( ( options ) => {
			registry.dispatch( MODULES_ANALYTICS ).receiveGetReport( getAnalyticsMockResponse( options ), { options } );
			registry.dispatch( MODULES_ANALYTICS ).finishResolution( 'getReport', [ options ] );
		} );

		// For <WPDashboardImpressions />
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( wpDashboardImpressionsData, { options: wpDashboardImpressionsArgs } );

		// For <WPDashboardClicks />
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( wpDashboardClicksData, { options: wpDashboardClicksArgs } );

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
								<WithTestRegistry registry={ registry }>
									<WPDashboardApp />
								</WithTestRegistry>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}, {
		decorators: [
			withRegistry,
		],
		options: {
			readySelector: '.googlesitekit-data-block',
			delay: 2000, // Wait for table overlay to animate.
		},
	} )
	.add( 'WordPress Dashboard (Analytics inactive)', ( args, { registry } ) => {
		registry.dispatch( CORE_MODULES ).receiveGetModules( withActive() );
		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-23' );

		// For <WPDashboardImpressions />
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( wpDashboardImpressionsData, { options: wpDashboardImpressionsArgs } );

		// For <WPDashboardClicks />
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( wpDashboardClicksData, { options: wpDashboardClicksArgs } );

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
								<WithTestRegistry registry={ registry }>
									<WPDashboardApp />
								</WithTestRegistry>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}, {
		decorators: [
			withRegistry,
		],
		options: {
			readySelector: '.googlesitekit-data-block',
			delay: 2000, // Wait for table overlay to animate.
		},
	} )
	.add( 'WordPress Dashboard (Data Unavailable)', ( args, { registry } ) => {
		registry.dispatch( CORE_MODULES ).receiveGetModules( withActive( 'analytics' ) );
		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-23' );

		reportOptions.forEach( ( options ) => {
			registry.dispatch( MODULES_ANALYTICS ).receiveGetReport( [], { options } );
			registry.dispatch( MODULES_ANALYTICS ).finishResolution( 'getReport', [ options ] );
		} );

		// For <WPDashboardImpressions />
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( {}, { options: wpDashboardImpressionsArgs } );

		// For <WPDashboardClicks />
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( {}, { options: wpDashboardClicksArgs } );

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
								<WithTestRegistry registry={ registry }>
									<WPDashboardApp />
								</WithTestRegistry>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}, {
		decorators: [
			withRegistry,
		],
		options: {
			readySelector: '.googlesitekit-data-block',
			delay: 2000, // Wait for table overlay to animate.
		},
	} );
