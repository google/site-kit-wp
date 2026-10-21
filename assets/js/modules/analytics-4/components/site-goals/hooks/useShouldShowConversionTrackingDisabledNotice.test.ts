/**
 * Site Goals conversion tracking disabled notice condition hook tests.
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
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	buildSiteGoalsBreakdownValuesReportOptions,
	seedSiteGoalsBreakdownValuesReport,
} from '@/js/modules/analytics-4/components/site-goals/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
	provideUserCapabilities,
	renderHook,
} from '@tests/js/test-utils';
import { useShouldShowConversionTrackingDisabledNotice } from './useShouldShowConversionTrackingDisabledNotice';

describe( 'useShouldShowConversionTrackingDisabledNotice', () => {
	let registry: WPDataRegistry;

	const ALL_BREAKDOWN_DIMENSIONS = [
		'googlesitekit_event_provider',
		'googlesitekit_form_id',
	];

	// One detected event per goal type, so both widgets render.
	const BOTH_WIDGET_EVENTS = [ 'purchase', 'contact' ];

	function provideState( {
		conversionTracking = false,
		activeWidgets = [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ],
		availableCustomDimensions = ALL_BREAKDOWN_DIMENSIONS,
	}: {
		conversionTracking?: boolean;
		activeWidgets?: string[];
		availableCustomDimensions?: string[];
	} = {} ) {
		registry.dispatch( CORE_SITE ).receiveGetConversionTrackingSettings( {
			enabled: conversionTracking,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSiteGoalsSettings( { activeWidgets } );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '12345',
			availableCustomDimensions,
			detectedEvents: BOTH_WIDGET_EVENTS,
		} );
	}

	function hasRequestedBreakdownValues( goalType: string ) {
		return registry
			.select( MODULES_ANALYTICS_4 )
			.hasStartedResolution( 'getReport', [
				buildSiteGoalsBreakdownValuesReportOptions(
					registry,
					goalType as typeof GOAL_TYPES.LEAD
				),
			] );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
	} );

	it( 'returns false without requesting a report while conversion tracking is on', async () => {
		provideState( { conversionTracking: true } );

		const { result, waitForRegistry } = renderHook(
			() => useShouldShowConversionTrackingDisabledNotice(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( false );
		expect( hasRequestedBreakdownValues( GOAL_TYPES.ECOMMERCE ) ).toBe(
			false
		);
		expect( hasRequestedBreakdownValues( GOAL_TYPES.LEAD ) ).toBe( false );
	} );

	it( 'returns undefined while the conversion tracking setting loads', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/core/site/data/conversion-tracking'
			)
		);

		const { result } = renderHook(
			() => useShouldShowConversionTrackingDisabledNotice(),
			{ registry }
		);

		expect( result.current ).toBeUndefined();
	} );

	it( 'returns true while conversion tracking is off and the lead generation widget shows breakdown tabs', () => {
		provideState();
		seedSiteGoalsBreakdownValuesReport(
			registry,
			GOAL_TYPES.ECOMMERCE,
			[]
		);
		seedSiteGoalsBreakdownValuesReport( registry, GOAL_TYPES.LEAD, [
			'5',
		] );

		const { result } = renderHook(
			() => useShouldShowConversionTrackingDisabledNotice(),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'returns true while conversion tracking is off and the online store widget shows breakdown tabs', () => {
		provideState();
		seedSiteGoalsBreakdownValuesReport( registry, GOAL_TYPES.ECOMMERCE, [
			'woocommerce',
		] );
		seedSiteGoalsBreakdownValuesReport( registry, GOAL_TYPES.LEAD, [] );

		const { result } = renderHook(
			() => useShouldShowConversionTrackingDisabledNotice(),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'returns true for a user who cannot manage options', () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );
		provideState();
		seedSiteGoalsBreakdownValuesReport(
			registry,
			GOAL_TYPES.ECOMMERCE,
			[]
		);
		seedSiteGoalsBreakdownValuesReport( registry, GOAL_TYPES.LEAD, [
			'5',
		] );

		const { result } = renderHook(
			() => useShouldShowConversionTrackingDisabledNotice(),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'returns false when the widgets have never shown breakdown tabs', () => {
		provideState();
		seedSiteGoalsBreakdownValuesReport(
			registry,
			GOAL_TYPES.ECOMMERCE,
			[]
		);
		seedSiteGoalsBreakdownValuesReport( registry, GOAL_TYPES.LEAD, [] );

		const { result } = renderHook(
			() => useShouldShowConversionTrackingDisabledNotice(),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'ignores ecommerce breakdown values outside the supported providers', () => {
		provideState();
		seedSiteGoalsBreakdownValuesReport( registry, GOAL_TYPES.ECOMMERCE, [
			'some-other-plugin',
		] );
		seedSiteGoalsBreakdownValuesReport( registry, GOAL_TYPES.LEAD, [] );

		const { result } = renderHook(
			() => useShouldShowConversionTrackingDisabledNotice(),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'ignores breakdown values for a widget that does not render', () => {
		provideState( { activeWidgets: [ GOAL_TYPES.ECOMMERCE ] } );
		seedSiteGoalsBreakdownValuesReport(
			registry,
			GOAL_TYPES.ECOMMERCE,
			[]
		);
		seedSiteGoalsBreakdownValuesReport( registry, GOAL_TYPES.LEAD, [
			'5',
		] );

		const { result } = renderHook(
			() => useShouldShowConversionTrackingDisabledNotice(),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'returns false without requesting a report when the breakdown dimensions are missing', async () => {
		provideState( { availableCustomDimensions: [] } );

		const { result, waitForRegistry } = renderHook(
			() => useShouldShowConversionTrackingDisabledNotice(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( false );
		expect( hasRequestedBreakdownValues( GOAL_TYPES.ECOMMERCE ) ).toBe(
			false
		);
		expect( hasRequestedBreakdownValues( GOAL_TYPES.LEAD ) ).toBe( false );
	} );

	it( 'returns undefined while a breakdown values report loads', () => {
		provideState();
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/modules/analytics-4/data/report' )
		);

		const { result } = renderHook(
			() => useShouldShowConversionTrackingDisabledNotice(),
			{ registry }
		);

		expect( result.current ).toBeUndefined();
	} );
} );
