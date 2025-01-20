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
import { enabledFeatures } from '../features';

describe( 'Module Features', () => {
	let registry;
	beforeAll( () => {
		registry = createTestRegistry();
		enabledFeatures.add( 'rrmModule' ); // Enable RRM module to get its features.

		provideUserInfo( registry );
		provideModules( registry );
		provideModuleRegistrations( registry );
	} );

	it.each( [
		[
			'ads',
			[
				'Tagging necessary for your ads campaigns to work will be disabled.',
				'Conversion tracking for your ads campaigns will be disabled.',
			],
		],
		[
			'adsense',
			[
				'Intelligent, automatic ad placement will be disabled.',
				'You will miss out on revenue from ads placed on your site.',
				'You will lose access to AdSense insights through Site Kit.',
			],
		],
		[
			'analytics-4',
			[
				'Your site will no longer send data to Google Analytics.',
				'Analytics reports in Site Kit will be disabled.',
			],
		],
		[
			'pagespeed-insights',
			[
				'Website performance reports for mobile and desktop will be disabled.',
			],
		],
		[
			'reader-revenue-manager',
			[ 'Reader Revenue Manager publication tracking will be disabled.' ],
		],
		[ 'search-console', [] ],
		[
			'sign-in-with-google',
			[
				'Users will no longer be able to sign in to your WordPress site using their Google Accounts.',
				'Users will not be able to create an account on your site using their Google Account (if account creation is enabled).',
				'Existing users who have only used Sign in With Google to sign in to your site will need to use WordPress’ “Reset my password” to set a password for their account.',
			],
		],
		[
			'tagmanager',
			[ 'You will not be able to create tags without updating code.' ],
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
