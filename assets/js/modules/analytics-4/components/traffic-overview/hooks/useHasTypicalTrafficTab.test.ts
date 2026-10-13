/**
 * Traffic Overview `useHasTypicalTrafficTab` hook tests.
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
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import { freezeFetch, provideModules } from '@tests/js/utils';
import { useHasTypicalTrafficTab } from './useHasTypicalTrafficTab';

describe( 'useHasTypicalTrafficTab', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		// Thirteen months before this reference date is `2025-09-15`.
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-10-15' );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
	} );

	/**
	 * Stores the property's creation time as midnight of the given day in the
	 * test's own time zone, so the hook reads the same day in any time zone.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} year  The year.
	 * @param {number} month The month, `0` for January.
	 * @param {number} day   The day of the month.
	 * @return {void}
	 */
	function setPropertyCreateDate( year: number, month: number, day: number ) {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyCreateTime( new Date( year, month, day ).getTime() );
	}

	it( 'should return `true` with `typicalTraffic` enabled on the main dashboard for a property older than thirteen months', async () => {
		setPropertyCreateDate( 2024, 4, 1 );

		const { result, waitForRegistry } = renderHook(
			() => useHasTypicalTrafficTab(),
			{
				registry,
				features: [ 'typicalTraffic' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( result.current ).toBe( true );
	} );

	it( 'should return `false` with `typicalTraffic` disabled', () => {
		setPropertyCreateDate( 2024, 4, 1 );

		const { result } = renderHook( () => useHasTypicalTrafficTab(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'should return `false` on the entity dashboard', () => {
		setPropertyCreateDate( 2024, 4, 1 );

		const { result } = renderHook( () => useHasTypicalTrafficTab(), {
			registry,
			features: [ 'typicalTraffic' ],
			viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'should return `false` when Analytics is not connected', () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: false,
			},
		] );
		setPropertyCreateDate( 2024, 4, 1 );

		const { result } = renderHook( () => useHasTypicalTrafficTab(), {
			registry,
			features: [ 'typicalTraffic' ],
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'should return `false` for a property younger than thirteen months', async () => {
		setPropertyCreateDate( 2026, 0, 1 );

		const { result, waitForRegistry } = renderHook(
			() => useHasTypicalTrafficTab(),
			{
				registry,
				features: [ 'typicalTraffic' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( result.current ).toBe( false );
	} );

	it( 'should return `true` on the view-only main dashboard when the settings include the creation time', async () => {
		// View-only readers read the creation time from the shared settings,
		// which have no property ID.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyCreateTime: new Date( 2024, 4, 1 ).getTime(),
		} );

		const { result, waitForRegistry } = renderHook(
			() => useHasTypicalTrafficTab(),
			{
				registry,
				features: [ 'typicalTraffic' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);

		await waitForRegistry();

		expect( result.current ).toBe( true );
	} );

	it.each( [
		{ description: 'exactly thirteen months ago', day: 15, expected: true },
		{
			description: 'thirteen months ago less one day',
			day: 16,
			expected: false,
		},
	] )(
		'should return `$expected` for a property created $description',
		async ( { day, expected } ) => {
			setPropertyCreateDate( 2025, 8, day );

			const { result, waitForRegistry } = renderHook(
				() => useHasTypicalTrafficTab(),
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( result.current ).toBe( expected );
		}
	);

	it( 'should return `false` when the creation time has not loaded', () => {
		// With no creation time stored, the resolver requests the property to
		// read its creation time.
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1234567890' );
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/property'
			)
		);

		const { result } = renderHook( () => useHasTypicalTrafficTab(), {
			registry,
			features: [ 'typicalTraffic' ],
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getPropertyCreateTime()
		).toBeUndefined();
		expect( result.current ).toBe( false );
	} );
} );
