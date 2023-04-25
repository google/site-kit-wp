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
import GoogleLogoIcon from '../assets/svg/graphics/logo-g.svg';
import SiteKitLogoIcon from '../assets/svg/graphics/logo-sitekit.svg';
import WPDashboardApp from '../assets/js/components/wp-dashboard/WPDashboardApp';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import {
	WithTestRegistry,
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
} from '../tests/js/utils';
import { MODULES_SEARCH_CONSOLE } from '../assets/js/modules/search-console/datastore/constants';
import {
	withActive,
	withConnected,
} from '../assets/js/googlesitekit/modules/datastore/__fixtures__';
import { provideAnalyticsMockReport } from '../assets/js/modules/analytics/util/data-mock';
import { provideSearchConsoleMockReport } from '../assets/js/modules/search-console/util/data-mock';
import { wpDashboardAnalyticsOptionSets } from '../assets/js/components/wp-dashboard/common.stories';

const clicksOptions = {
	startDate: '2020-12-31',
	endDate: '2021-01-27',
	compareStartDate: '2020-12-03',
	compareEndDate: '2020-12-30',
	dimensions: 'ga:date',
	limit: 10,
	metrics: [
		{
			expression: 'ga:avgSessionDuration',
			alias: 'Average Session Duration',
		},
	],
};

const impressionsArgs = {
	startDate: '2020-12-03',
	endDate: '2021-01-27',
	dimensions: 'date',
};

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	provideSiteInfo( registry );
	provideUserAuthentication( registry );

	return <Story registry={ registry } />;
};

storiesOf( 'WordPress', module )
	.add(
		'WordPress Dashboard',
		( args, { registry } ) => {
			registry
				.dispatch( CORE_MODULES )
				.receiveGetModules( withConnected( 'analytics' ) );
			registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

			wpDashboardAnalyticsOptionSets.forEach(
				provideAnalyticsMockReport.bind( null, registry )
			);

			// For <WPDashboardImpressions />
			provideSearchConsoleMockReport( registry, impressionsArgs );
			// For <WPDashboardClicks />
			provideSearchConsoleMockReport( registry, clicksOptions );

			return (
				<div id="dashboard-widgets">
					<div className="metabox-holder">
						<div id="google_dashboard_widget" className="postbox">
							<h2 className="hndle ui-sortable-handle">
								<span>
									<span className="googlesitekit-logo googlesitekit-logo--mini">
										<GoogleLogoIcon
											height="19"
											width="19"
										/>
										<SiteKitLogoIcon
											height="17"
											width="78"
										/>
									</span>
								</span>
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
		},
		{
			decorators: [ withRegistry ],
			options: {
				readySelector: '.googlesitekit-data-block',
				delay: 2000, // Wait for table overlay to animate.
			},
		}
	)
	.add(
		'WordPress Dashboard (Analytics inactive)',
		( args, { registry } ) => {
			registry.dispatch( CORE_MODULES ).receiveGetModules( withActive() );
			registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

			// For <WPDashboardImpressions />
			provideSearchConsoleMockReport( registry, impressionsArgs );
			// For <WPDashboardClicks />
			provideSearchConsoleMockReport( registry, clicksOptions );

			return (
				<div id="dashboard-widgets">
					<div className="metabox-holder">
						<div id="google_dashboard_widget" className="postbox">
							<h2 className="hndle ui-sortable-handle">
								<span>
									<span className="googlesitekit-logo googlesitekit-logo--mini">
										<GoogleLogoIcon
											height="19"
											width="19"
										/>
										<SiteKitLogoIcon
											height="17"
											width="78"
										/>
									</span>
								</span>
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
		},
		{
			decorators: [ withRegistry ],
			options: {
				readySelector: '.googlesitekit-data-block',
				delay: 2000, // Wait for table overlay to animate.
			},
		}
	)
	.add(
		'WordPress Dashboard (Data Unavailable)',
		( args, { registry } ) => {
			registry
				.dispatch( CORE_MODULES )
				.receiveGetModules( withActive( 'analytics' ) );
			registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

			wpDashboardAnalyticsOptionSets.forEach( ( options ) => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetReport( [], { options } );
				registry
					.dispatch( MODULES_ANALYTICS )
					.finishResolution( 'getReport', [ options ] );
			} );

			// For <WPDashboardImpressions />
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveGetReport( [], { options: impressionsArgs } );

			// For <WPDashboardClicks />
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveGetReport( [], { options: clicksOptions } );

			return (
				<div id="dashboard-widgets">
					<div className="metabox-holder">
						<div id="google_dashboard_widget" className="postbox">
							<h2 className="hndle ui-sortable-handle">
								<span>
									<span className="googlesitekit-logo googlesitekit-logo--mini">
										<GoogleLogoIcon
											height="19"
											width="19"
										/>
										<SiteKitLogoIcon
											height="17"
											width="78"
										/>
									</span>
								</span>
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
		},
		{
			decorators: [ withRegistry ],
			options: {
				readySelector: '.googlesitekit-data-block',
				delay: 2000, // Wait for table overlay to animate.
			},
		}
	);
