/**
 * Site Goals breakdown notice presence helper tests.
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
import { Select } from 'googlesitekit-data';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE,
	SITE_GOALS_BREAKDOWN_NOTICE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	muteFetch,
	provideModules,
	provideUserAuthentication,
	provideUserCapabilities,
} from '@tests/js/test-utils';
import { hasGoalTypeBreakdownNotice } from './hasGoalTypeBreakdownNotice';

const analyticsSettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/settings'
);
const siteGoalsSettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/site-goals-settings'
);
const dismissedItemsEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismissed-items'
);

describe( 'hasGoalTypeBreakdownNotice', () => {
	let registry: ReturnType< typeof createTestRegistry >;
	let select: Select;

	interface NoticeState {
		activeWidgets?: string[];
		availableCustomDimensions?: string[];
		dismissedItems?: string[];
	}

	const BOTH_WIDGETS: string[] = [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ];

	function provideActiveWidgets(
		activeWidgets: string[] = BOTH_WIDGETS
	): void {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSiteGoalsSettings( { activeWidgets } );
	}

	function provideCustomDimensions(
		availableCustomDimensions: string[] = []
	): void {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { availableCustomDimensions } );
	}

	function provideDismissedItems( dismissedItems: string[] = [] ): void {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( dismissedItems );
	}

	/**
	 * Puts the store in the state where both widgets show the notice.
	 *
	 * Each test then overrides the one condition it covers.
	 *
	 * @since n.e.x.t
	 *
	 * @param  overrides                           The state to set in place of the defaults.
	 * @param  overrides.activeWidgets             The goal types whose widget the dashboard shows.
	 * @param  overrides.availableCustomDimensions The custom dimensions the GA4 property already holds.
	 * @param  overrides.dismissedItems            The dismissed item slugs.
	 * @return {void}
	 */
	function provideNoticeState( {
		activeWidgets,
		availableCustomDimensions,
		dismissedItems,
	}: NoticeState = {} ): void {
		provideActiveWidgets( activeWidgets );
		provideCustomDimensions( availableCustomDimensions );
		provideDismissedItems( dismissedItems );
	}

	beforeEach( () => {
		registry = createTestRegistry();

		select = registry.select as Select;

		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		provideUserAuthentication( registry );

		// The available dimensions resolver ends by syncing the list from GA4,
		// but only for a user who can manage options. The helper reads none of
		// that, so withhold the capability and the resolver stops short of the
		// request.
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );
	} );

	it( 'returns true when the widget is active, its dimension is missing, and the notice is not dismissed', () => {
		provideNoticeState();

		expect(
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.ECOMMERCE )
		).toBe( true );
		expect( hasGoalTypeBreakdownNotice( select, GOAL_TYPES.LEAD ) ).toBe(
			true
		);
	} );

	it( 'returns false for a goal type whose widget is not active', () => {
		provideNoticeState( { activeWidgets: [ GOAL_TYPES.ECOMMERCE ] } );

		expect( hasGoalTypeBreakdownNotice( select, GOAL_TYPES.LEAD ) ).toBe(
			false
		);
		expect(
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.ECOMMERCE )
		).toBe( true );
	} );

	it( 'returns false for a goal type whose breakdown dimension already exists', () => {
		provideNoticeState( {
			availableCustomDimensions: [
				SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[
					GOAL_TYPES.ECOMMERCE
				],
			],
		} );

		expect(
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.ECOMMERCE )
		).toBe( false );
		expect( hasGoalTypeBreakdownNotice( select, GOAL_TYPES.LEAD ) ).toBe(
			true
		);
	} );

	it( 'returns false for every goal type once the notice is dismissed', () => {
		provideNoticeState( {
			dismissedItems: [ SITE_GOALS_BREAKDOWN_NOTICE ],
		} );

		expect(
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.ECOMMERCE )
		).toBe( false );
		expect( hasGoalTypeBreakdownNotice( select, GOAL_TYPES.LEAD ) ).toBe(
			false
		);
	} );

	it( 'returns false while the available custom dimensions have not loaded', () => {
		muteFetch( analyticsSettingsEndpoint );
		provideActiveWidgets();
		provideDismissedItems();

		// The dimension list is still on its way, so `hasCustomDimensions`
		// reads `undefined` rather than `false`.
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getAvailableCustomDimensions()
		).toBeUndefined();
		expect(
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.ECOMMERCE )
		).toBe( false );
	} );

	it( 'returns false while the site goals settings have not loaded', () => {
		muteFetch( siteGoalsSettingsEndpoint );
		provideCustomDimensions();
		provideDismissedItems();

		// Without the settings, `isSiteGoalWidgetActive` reads `undefined`
		// rather than `false`.
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.isSiteGoalWidgetActive( GOAL_TYPES.ECOMMERCE )
		).toBeUndefined();
		expect(
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.ECOMMERCE )
		).toBe( false );
	} );

	it( 'returns false while the dismissed items have not loaded', () => {
		muteFetch( dismissedItemsEndpoint );
		provideActiveWidgets( [ GOAL_TYPES.ECOMMERCE ] );
		provideCustomDimensions();

		// Without the dismissed items, `isItemDismissed` reads `undefined`
		// rather than `false`.
		expect(
			registry
				.select( CORE_USER )
				.isItemDismissed( SITE_GOALS_BREAKDOWN_NOTICE )
		).toBeUndefined();
		expect(
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.ECOMMERCE )
		).toBe( false );
	} );
} );
