/**
 * Features Tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideModules,
	provideUserInfo,
	provideModuleRegistrations,
} from '../../../tests/js/utils';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from './pagespeed-insights/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from './reader-revenue-manager/constants';
import { MODULE_SLUG_ADS } from './ads/constants';
import { MODULE_SLUG_ADSENSE } from './adsense/constants';
import { MODULE_SLUG_ANALYTICS_4 } from './analytics-4/constants';
import { MODULE_SLUG_TAGMANAGER } from './tagmanager/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from './sign-in-with-google/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from './search-console/constants';

describe( 'Module Features', () => {
	let registry;
	beforeAll( () => {
		registry = createTestRegistry();
		provideUserInfo( registry );
		provideModules( registry );
		provideModuleRegistrations( registry );
	} );

	it.each( [
		[
			MODULE_SLUG_ADS,
			[
				'Tagging necessary for your ads campaigns to work will be disabled',
				'Conversion tracking for your ads campaigns will be disabled',
			],
		],
		[
			MODULE_SLUG_ADSENSE,
			[
				'Intelligent, automatic ad placement will be disabled',
				'You will miss out on revenue from ads placed on your site',
				'You will lose access to AdSense insights through Site Kit',
			],
		],
		[
			MODULE_SLUG_ANALYTICS_4,
			[
				'Your site will no longer send data to Google Analytics',
				'Analytics reports in Site Kit will be disabled',
			],
		],
		[
			MODULE_SLUG_PAGESPEED_INSIGHTS,
			[
				'Website performance reports for mobile and desktop will be disabled',
			],
		],
		[
			MODULE_SLUG_READER_REVENUE_MANAGER,
			[ 'Reader Revenue Manager publication tracking will be disabled' ],
		],
		[ MODULE_SLUG_SEARCH_CONSOLE, [] ],
		[
			MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
			[
				'Users will no longer be able to sign in to your WordPress site using their Google Accounts',
				'Users will not be able to create an account on your site using their Google Account (if account creation is enabled)',
				'Existing users who have only used Sign in with Google to sign in to your site will need to use WordPress’ “Reset my password” to set a password for their account',
			],
		],
		[
			MODULE_SLUG_TAGMANAGER,
			[ 'You will not be able to create tags without updating code' ],
		],
	] )(
		'should return the correct features for %s module.',
		( moduleSlug, expectedFeatures ) => {
			const currentFeatures = registry
				.select( CORE_MODULES )
				.getModuleFeatures( moduleSlug );

			expect( currentFeatures ).toEqual( expectedFeatures );
		}
	);
} );
