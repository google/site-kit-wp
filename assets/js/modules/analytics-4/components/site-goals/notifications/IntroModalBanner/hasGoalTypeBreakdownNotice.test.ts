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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { Select } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
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
	untilResolved,
} from '@tests/js/test-utils';
import { hasGoalTypeBreakdownNotice } from './hasGoalTypeBreakdownNotice';

const analyticsSettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/settings'
);
const syncCustomDimensionsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
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
		detectedEvents?: string[];
		dismissedItems?: string[];
	}

	const BOTH_WIDGETS: string[] = [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ];
	// One event per goal type, so both widgets render by default.
	const BOTH_WIDGET_EVENTS: string[] = [ 'purchase', 'contact' ];

	function provideActiveWidgets(
		activeWidgets: string[] = BOTH_WIDGETS
	): void {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSiteGoalsSettings( { activeWidgets } );
	}

	function provideCustomDimensions(
		availableCustomDimensions: string[] = [],
		detectedEvents: string[] = BOTH_WIDGET_EVENTS
	): void {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableCustomDimensions,
			detectedEvents,
		} );
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
	 * @since 1.184.0
	 *
	 * @param  overrides                           The state to set in place of the defaults.
	 * @param  overrides.activeWidgets             The goal types whose widget the dashboard shows.
	 * @param  overrides.availableCustomDimensions The custom dimensions the GA4 property already holds.
	 * @param  overrides.detectedEvents            The conversion events currently detected.
	 * @param  overrides.dismissedItems            The dismissed item slugs.
	 * @return {void}
	 */
	function provideNoticeState( {
		activeWidgets,
		availableCustomDimensions,
		detectedEvents,
		dismissedItems,
	}: NoticeState = {} ): void {
		provideActiveWidgets( activeWidgets );
		provideCustomDimensions( availableCustomDimensions, detectedEvents );
		provideDismissedItems( dismissedItems );
	}

	beforeEach( () => {
		registry = createTestRegistry();

		select = registry.select as Select;

		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
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

	it( 'returns false for a goal type whose events are no longer detected', () => {
		// Both widgets stay in `activeWidgets`, which is never pruned, but only
		// the ecommerce widget still has a detected event, so only that one
		// renders and can show the notice.
		provideNoticeState( { detectedEvents: [ 'purchase' ] } );

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

	it( 'returns false while the available custom dimensions have not loaded', async () => {
		muteFetch( analyticsSettingsEndpoint );
		// The resolver syncs the dimension list from GA4 for a user who can
		// manage options, so mock that request too.
		fetchMock.post( syncCustomDimensionsEndpoint, {
			body: [],
			status: 200,
		} );
		provideActiveWidgets();
		provideDismissedItems();

		// Before the dimension list loads, `getAvailableCustomDimensions`
		// reads `undefined`. Assert that here, so the `false` below is the
		// loading case, not a resolved `false`.
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getAvailableCustomDimensions()
		).toBeUndefined();
		expect(
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.ECOMMERCE )
		).toBe( false );

		// Wait for the resolver to finish its GA4 sync request. fetch-mock
		// resets after each test. If the request finishes after that reset, no
		// mock answers it, and fetch-mock throws an error.
		await untilResolved(
			registry,
			MODULES_ANALYTICS_4
		).getAvailableCustomDimensions();
	} );

	it( 'returns false while the site goals settings have not loaded', () => {
		muteFetch( siteGoalsSettingsEndpoint );
		provideCustomDimensions();
		provideDismissedItems();

		// Before the settings load, `isSiteGoalWidgetRenderable` reads
		// `undefined`. Assert that here, so the `false` below is the loading
		// case, not a resolved `false`.
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.isSiteGoalWidgetRenderable( GOAL_TYPES.ECOMMERCE )
		).toBeUndefined();
		expect(
			hasGoalTypeBreakdownNotice( select, GOAL_TYPES.ECOMMERCE )
		).toBe( false );
	} );

	it( 'returns false while the dismissed items have not loaded', () => {
		muteFetch( dismissedItemsEndpoint );
		provideActiveWidgets( [ GOAL_TYPES.ECOMMERCE ] );
		provideCustomDimensions();

		// Before the dismissed items load, `isItemDismissed` reads
		// `undefined`. Assert that here, so the `false` below is the loading
		// case, not a resolved `false`.
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
