/**
 * Admin Bar Component Stories.
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
 * Internal dependencies
 */
import { GoogleSitekitAdminbar } from '../assets/js/googlesitekit-adminbar';
import { googlesitekit as wpAdminBarData } from '../.storybook/data/blog---googlesitekit';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { provideModules, provideSiteInfo, WithTestRegistry } from '../tests/js/utils';
import { MODULES_SEARCH_CONSOLE } from '../assets/js/modules/search-console/datastore/constants';
import { MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import { adminbarSearchConsoleMockData, adminbarSearchConsoleOptions } from '../assets/js/modules/search-console/datastore/__fixtures__';
import { adminBarAnalyticsTotalUsersMockData, adminBarAnalyticsTotalUsersOptions, adminBarAnalyticsSessionsMockData, adminBarAnalyticsSessionsOptions } from '../assets/js/modules/analytics/datastore/__fixtures__';

storiesOf( 'Global', module )
	.add( 'Admin Bar', () => {
		global._googlesitekitLegacyData = wpAdminBarData;

		const setupRegistry = ( registry ) => {
			// Set some site information.
			provideSiteInfo( registry, {
				currentEntityURL: 'https://www.sitekitbygoogle.com/blog/',
				currentEntityTitle: 'Blog test post for Google Site Kit',
			} );

			// Set up the search console and analytics modules stores but provide no data.
			provideModules( registry, [
				{ slug: 'search-console', active: true, connected: true },
				{ slug: 'analytics', active: true, connected: true },
			] );

			registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

			// Mock both Search Console widgets data
			registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( adminbarSearchConsoleMockData, { options: adminbarSearchConsoleOptions } );

			// Mock Total Users widget data
			registry.dispatch( MODULES_ANALYTICS ).receiveGetReport( adminBarAnalyticsTotalUsersMockData, { options: adminBarAnalyticsTotalUsersOptions } );

			// Mock Sessions widget data
			registry.dispatch( MODULES_ANALYTICS ).receiveGetReport( adminBarAnalyticsSessionsMockData, { options: adminBarAnalyticsSessionsOptions } );
		};

		return (
			<div id="wpadminbar">
				<div className="googlesitekit-plugin">
					<div id="js-googlesitekit-adminbar" className="ab-sub-wrapper googlesitekit-adminbar" style={ { display: 'block' } }>
						<section id="js-googlesitekit-adminbar-modules" className="googlesitekit-adminbar-modules">
							<WithTestRegistry callback={ setupRegistry }>
								<GoogleSitekitAdminbar />
							</WithTestRegistry>
						</section>
					</div>
				</div>
			</div>
		);
	} )
	.add( 'Admin Bar Zero Data', () => {
		global._googlesitekitLegacyData = wpAdminBarData;

		const setupRegistry = ( registry ) => {
			// Set the Story site information.
			provideSiteInfo( registry, {
				currentEntityURL: 'https://www.sitekitbygoogle.com/blog/',
				currentEntityTitle: 'Blog test post for Google Site Kit',
			} );
		};

		return (
			<div id="wpadminbar">
				<div className="googlesitekit-plugin">
					<div id="js-googlesitekit-adminbar" className="ab-sub-wrapper googlesitekit-adminbar" style={ { display: 'block' } }>
						<section id="js-googlesitekit-adminbar-modules" className="googlesitekit-adminbar-modules">
							<WithTestRegistry callback={ setupRegistry }>
								<GoogleSitekitAdminbar />
							</WithTestRegistry>
						</section>
					</div>
				</div>
			</div>
		);
	} );

