/**
 * Analytics module widget registration tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { enabledFeatures } from '@/js/features';
import {
	createWidgets,
	registerWidgets as registerDefaultWidgets,
} from '@/js/googlesitekit/widgets';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';
import {
	createTestRegistry,
	provideSiteInfo,
} from '../../../../../tests/js/utils';
import { registerWidgets } from './index';

describe( 'Analytics 4 widget registrations', () => {
	let registry;
	let widgets;

	beforeEach( () => {
		registry = createTestRegistry();
		enabledFeatures.add( 'siteGoals' );
		widgets = createWidgets( registry );
		registerDefaultWidgets( widgets );
	} );

	afterEach( () => {
		enabledFeatures.delete( 'siteGoals' );
	} );

	describe( 'Site Goals widgets', () => {
		it.each( [
			[
				'only ecommerce active',
				{
					hasActiveEcommerceEventProviders: true,
					hasActiveLeadEventProviders: false,
				},
				[ 'analyticsOnlineStorePerformance' ],
				[ 'analyticsLeadGenerationPerformance' ],
			],
			[
				'only lead active',
				{
					hasActiveEcommerceEventProviders: false,
					hasActiveLeadEventProviders: true,
				},
				[ 'analyticsLeadGenerationPerformance' ],
				[ 'analyticsOnlineStorePerformance' ],
			],
			[
				'both active',
				{
					hasActiveEcommerceEventProviders: true,
					hasActiveLeadEventProviders: true,
				},
				[
					'analyticsOnlineStorePerformance',
					'analyticsLeadGenerationPerformance',
				],
				[],
			],
			[
				'neither active',
				{
					hasActiveEcommerceEventProviders: false,
					hasActiveLeadEventProviders: false,
				},
				[],
				[
					'analyticsOnlineStorePerformance',
					'analyticsLeadGenerationPerformance',
				],
			],
		] )(
			'should gate widgets correctly when %s',
			( _, siteInfo, expectedPresent, expectedAbsent ) => {
				provideSiteInfo( registry, siteInfo );
				registerWidgets( widgets );

				const slugs = registry
					.select( CORE_WIDGETS )
					.getWidgets( AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY )
					.map( ( w ) => w.slug );

				expectedPresent.forEach( ( slug ) => {
					expect( slugs ).toContain( slug );
				} );
				expectedAbsent.forEach( ( slug ) => {
					expect( slugs ).not.toContain( slug );
				} );
			}
		);
	} );
} );
