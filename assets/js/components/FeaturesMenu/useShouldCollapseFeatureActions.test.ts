/**
 * `useShouldCollapseFeatureActions` hook tests.
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
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { renderHook } from '@tests/js/test-utils';
import { getViewportWidth, setViewportWidth } from '@tests/js/viewport-utils';
import useShouldCollapseFeatureActions from './useShouldCollapseFeatureActions';

const COLLAPSE_WIDTH = 1060;

describe( 'useShouldCollapseFeatureActions', () => {
	let originalViewportWidth: number;

	beforeEach( () => {
		originalViewportWidth = getViewportWidth();
	} );

	afterEach( () => {
		setViewportWidth( originalViewportWidth );
	} );

	function renderAtWidth(
		viewportWidth: number,
		{
			features = [ 'featureDiscoveryHub' ],
			viewContext = VIEW_CONTEXT_MAIN_DASHBOARD,
		}: { features?: string[]; viewContext?: string } = {}
	) {
		setViewportWidth( viewportWidth );

		return renderHook(
			() => useShouldCollapseFeatureActions( COLLAPSE_WIDTH ),
			{ features, viewContext }
		);
	}

	it.each( [
		[ 'small', 600 ],
		[ 'tablet', 960 ],
	] )(
		'should return true on the %s breakpoint when the "Add features" button is not shown',
		( _, viewportWidth ) => {
			const { result } = renderAtWidth( viewportWidth, {
				features: [],
			} );

			expect( result.current ).toBe( true );
		}
	);

	it.each( [
		[ 'at', COLLAPSE_WIDTH ],
		[ 'below', COLLAPSE_WIDTH - 1 ],
	] )(
		'should return true on desktop %s the collapse width when the "Add features" button is shown',
		( _, viewportWidth ) => {
			const { result } = renderAtWidth( viewportWidth );

			expect( result.current ).toBe( true );
		}
	);

	it( 'should return false on desktop above the collapse width when the "Add features" button is shown', () => {
		const { result } = renderAtWidth( COLLAPSE_WIDTH + 1 );

		expect( result.current ).toBe( false );
	} );

	it( 'should return false on desktop at the collapse width when the `featureDiscoveryHub` feature is disabled', () => {
		const { result } = renderAtWidth( COLLAPSE_WIDTH, { features: [] } );

		expect( result.current ).toBe( false );
	} );

	it( 'should return false on desktop at the collapse width on a view-only dashboard', () => {
		const { result } = renderAtWidth( COLLAPSE_WIDTH, {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( result.current ).toBe( false );
	} );
} );
