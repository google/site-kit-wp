/**
 * Tests for the useSiteGoalsSectionReady hook.
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
	CORE_UI,
	FORCED_IN_VIEW_WIDGET_AREAS,
} from '@/js/googlesitekit/datastore/ui/constants';
import { SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS } from '@/js/modules/analytics-4/components/site-goals/feature-tours/site-goals';
import { actHook, createTestRegistry, renderHook } from '@tests/js/test-utils';
import { useSiteGoalsSectionReady } from './useSiteGoalsSectionReady';

/**
 * Adds the element the Site Goals tour points to first. The hook waits for
 * this element before it reports the section loaded, so every test that needs
 * a loaded section adds it. The `afterEach` below removes it.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
function appendTourTarget() {
	const target = document.createElement( 'div' );
	target.className = 'googlesitekit-site-goals-primary-action';
	document.body.appendChild( target );
}

/**
 * Moves the fake timers forward so the wait inside the hook finishes and the
 * hook reports the Site Goals section as ready. The wait checks the target
 * position every 250 milliseconds and finishes once two checks in a row match,
 * so 500 milliseconds is enough. Use this only after `jest.useFakeTimers()`.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
async function advanceUntilSectionLoads() {
	// eslint-disable-next-line require-await
	await actHook( async () => {
		jest.advanceTimersByTime( 500 );
	} );
}

describe( 'useSiteGoalsSectionReady', () => {
	let registry: WPDataRegistry;

	function getWidgetAreasToLoad() {
		return registry
			.select( CORE_UI )
			.getValue( FORCED_IN_VIEW_WIDGET_AREAS );
	}

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		document
			.querySelectorAll( '.googlesitekit-site-goals-primary-action' )
			.forEach( ( target ) => target.remove() );
	} );

	it( 'returns false and sets no widget areas to load when enabled is false', () => {
		appendTourTarget();

		const { result } = renderHook(
			() => useSiteGoalsSectionReady( false ),
			{ registry }
		);

		expect( result.current ).toBe( false );
		expect( getWidgetAreasToLoad() ).toBeUndefined();
	} );

	it( 'sets the widget areas to load while it waits', () => {
		appendTourTarget();

		const { result } = renderHook( () => useSiteGoalsSectionReady( true ), {
			registry,
		} );

		expect( result.current ).toBe( false );
		expect( getWidgetAreasToLoad() ).toEqual(
			SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS
		);
	} );

	it( 'returns true after the Site Goals section loads and its layout settles', async () => {
		jest.useFakeTimers();
		appendTourTarget();

		const { result } = renderHook( () => useSiteGoalsSectionReady( true ), {
			registry,
		} );

		await advanceUntilSectionLoads();

		expect( result.current ).toBe( true );

		// The hook keeps the widget areas to load while it stays enabled.
		expect( getWidgetAreasToLoad() ).toEqual(
			SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS
		);

		jest.useRealTimers();
	} );

	it( 'clears the widget areas to load on unmount', async () => {
		jest.useFakeTimers();
		appendTourTarget();

		const { result, unmount } = renderHook(
			() => useSiteGoalsSectionReady( true ),
			{ registry }
		);

		await advanceUntilSectionLoads();

		expect( result.current ).toBe( true );

		unmount();

		expect( getWidgetAreasToLoad() ).toBeUndefined();

		jest.useRealTimers();
	} );

	it( 'returns to false and clears the widget areas to load when enabled becomes false', async () => {
		jest.useFakeTimers();
		appendTourTarget();

		let enabled = true;
		const { result, rerender } = renderHook(
			() => useSiteGoalsSectionReady( enabled ),
			{ registry }
		);

		await advanceUntilSectionLoads();

		expect( result.current ).toBe( true );

		enabled = false;
		rerender();

		expect( result.current ).toBe( false );
		expect( getWidgetAreasToLoad() ).toBeUndefined();

		jest.useRealTimers();
	} );
} );
