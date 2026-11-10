/**
 * Site Goals `useSiteGoalsWidgetViewAction` hook tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE } from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	provideUserCapabilities,
	renderHook,
} from '@tests/js/test-utils';
import { useSiteGoalsWidgetViewAction } from './useSiteGoalsWidgetViewAction';

describe( 'useSiteGoalsWidgetViewAction', () => {
	const breakdownDimension =
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[ GOAL_TYPES.LEAD ];

	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		provideUserCapabilities( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '12345',
			availableCustomDimensions: [ breakdownDimension ],
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		// A dimension collecting since long before the selected range is not
		// in partial data.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
			resourceAvailabilityDates: {
				audience: {},
				customDimension: { [ breakdownDimension ]: 20200101 },
				property: {},
			},
		} );
		registry
			.dispatch( CORE_SITE )
			.receiveGetConversionTrackingSettings( { enabled: false } );
	} );

	it( 'should return view_widget_breakdown while conversion tracking is off and the widget shows tabs', () => {
		const { result } = renderHook(
			() =>
				useSiteGoalsWidgetViewAction( {
					breakdownDimension,
					hasBreakdownTabs: true,
				} ),
			{ registry }
		);

		expect( result.current ).toBe( 'view_widget_breakdown' );
	} );

	it( 'should return view_widget while conversion tracking is off and the widget shows no tabs', () => {
		const { result } = renderHook(
			() =>
				useSiteGoalsWidgetViewAction( {
					breakdownDimension,
					hasBreakdownTabs: false,
				} ),
			{ registry }
		);

		expect( result.current ).toBe( 'view_widget' );
	} );
} );
