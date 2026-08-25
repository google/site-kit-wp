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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createWidgets,
	registerWidgets as registerDefaultWidgets,
} from '@/js/googlesitekit/widgets';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';
import { AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG } from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationBackNotice';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry } from '../../../../../tests/js/utils';
import { registerWidgets } from './index';

describe( 'Analytics 4 widget registrations', () => {
	let registry;
	let widgets;

	beforeEach( () => {
		registry = createTestRegistry();
		widgets = createWidgets( registry );
		registerDefaultWidgets( widgets );
	} );

	afterEach( () => {
		enabledFeatures.delete( 'setupFlowRefresh' );
	} );

	describe( 'Audience Segmentation back notice widget', () => {
		it( 'should not register back notice widget when setupFlowRefresh is disabled', () => {
			registerWidgets( widgets );

			expect(
				registry
					.select( CORE_WIDGETS )
					.getWidget( 'analyticsAudienceSegmentationBackNotice' )
			).toBeNull();
		} );

		it( 'should register back notice widget when setupFlowRefresh is enabled', () => {
			enabledFeatures.add( 'setupFlowRefresh' );

			registerWidgets( widgets );

			expect(
				registry
					.select( CORE_WIDGETS )
					.getWidget( 'analyticsAudienceSegmentationBackNotice' )
			).toBeDefined();
		} );

		it( 'should only be active when raw hidden is true and notice is not dismissed', () => {
			enabledFeatures.add( 'setupFlowRefresh' );
			registerWidgets( widgets );

			const widget = registry
				.select( CORE_WIDGETS )
				.getWidget( 'analyticsAudienceSegmentationBackNotice' );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
				configuredAudiences: [ 'audienceA' ],
				isAudienceSegmentationWidgetHidden: true,
				didSetAudiences: true,
			} );

			expect( widget.isActive( registry.select ) ).toBe( true );

			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG,
				] );

			expect( widget.isActive( registry.select ) ).toBe( false );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			// Even without dismissal, the widget must remain inactive if the raw hidden setting is false.
			registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
				configuredAudiences: [ 'audienceA' ],
				isAudienceSegmentationWidgetHidden: false,
				didSetAudiences: true,
			} );

			expect( widget.isActive( registry.select ) ).toBe( false );
		} );
	} );

	describe( 'Site Goals widgets', () => {
		const ALL_SITE_GOALS_WIDGETS = [
			'analyticsOnlineStorePerformance',
			'analyticsLeadGenerationPerformance',
		];

		it.each( [
			[
				'only ecommerce active',
				{ activeWidgets: [ 'ecommerce' ] },
				[ 'purchase', 'contact' ],
				[ 'analyticsOnlineStorePerformance' ],
				[ 'analyticsLeadGenerationPerformance' ],
			],
			[
				'only lead active',
				{ activeWidgets: [ 'lead' ] },
				[ 'purchase', 'contact' ],
				[ 'analyticsLeadGenerationPerformance' ],
				[ 'analyticsOnlineStorePerformance' ],
			],
			[
				'both active',
				{ activeWidgets: [ 'ecommerce', 'lead' ] },
				[ 'purchase', 'contact' ],
				ALL_SITE_GOALS_WIDGETS,
				[],
			],
			[
				'neither active',
				{ activeWidgets: [] },
				[ 'purchase', 'contact' ],
				[],
				ALL_SITE_GOALS_WIDGETS,
			],
			[
				'a category is active but its events are no longer detected',
				{ activeWidgets: [ 'ecommerce', 'lead' ] },
				[],
				[],
				ALL_SITE_GOALS_WIDGETS,
			],
			[
				'a category is active but only the other category has events',
				{ activeWidgets: [ 'ecommerce', 'lead' ] },
				[ 'purchase' ],
				[ 'analyticsOnlineStorePerformance' ],
				[ 'analyticsLeadGenerationPerformance' ],
			],
		] )(
			'should gate widgets correctly when %s',
			(
				_,
				siteGoalsSettings,
				detectedEvents,
				expectedPresent,
				expectedAbsent
			) => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( siteGoalsSettings );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( { detectedEvents } );
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
