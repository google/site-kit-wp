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

it( 'ensures all features are defined as expected.', () => {
	const registry = createTestRegistry();
	enabledFeatures.add( 'rrmModule' ); // Enable RRM module to get its features.

	provideUserInfo( registry );
	provideModules( registry );
	provideModuleRegistrations( registry );

	// Define the expected features for each module.
	const moduleFeatures = {
		ads: [
			'Tagging necessary for your ads campaigns to work',
			'Conversion tracking for your ads campaigns',
		],
		adsense: [
			'Intelligent, automatic ad placement',
			'Revenue from ads placed on your site',
			'AdSense insights through Site Kit',
		],
		'analytics-4': [
			'Audience overview',
			'Top pages',
			'Top acquisition channels',
		],
		'pagespeed-insights': [
			'Website performance reports for mobile and desktop',
		],
		'reader-revenue-manager': [
			'Reader Revenue Manager publication tracking (your Reader Revenue Manager account will still remain active)',
		],
		'search-console': [],
		tagmanager: [ 'Create tags without updating code' ],
	};

	/**
	 * Iterate through each module slug and its features and compare
	 * that module feature are equal to the expected module features.
	 */
	for ( const moduleSlug in moduleFeatures ) {
		const currentFeatures = registry
			.select( CORE_MODULES )
			.getModuleFeatures( moduleSlug );
		const expectedFeature = moduleFeatures[ moduleSlug ];

		//  Compare the current features with the expected features.
		expect( currentFeatures ).toEqual( expectedFeature );
	}
} );
