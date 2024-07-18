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
				'Tagging necessary for your ads campaigns to work',
				'Conversion tracking for your ads campaigns',
			],
		],
		[
			'adsense',
			[
				'Intelligent, automatic ad placement',
				'Revenue from ads placed on your site',
				'AdSense insights through Site Kit',
			],
		],
		[
			'analytics-4',
			[ 'Audience overview', 'Top pages', 'Top acquisition channels' ],
		],
		[
			'pagespeed-insights',
			[ 'Website performance reports for mobile and desktop' ],
		],
		[
			'reader-revenue-manager',
			[
				'Reader Revenue Manager publication tracking (your Reader Revenue Manager account will still remain active)',
			],
		],
		[ 'search-console', [] ],
		[ 'tagmanager', [ 'Create tags without updating code' ] ],
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
