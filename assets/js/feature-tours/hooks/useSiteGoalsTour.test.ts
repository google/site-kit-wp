/**
 * `useSiteGoalsTour` hook tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	renderHook,
} from '../../../../tests/js/test-utils';
import { useSiteGoalsTour } from './useSiteGoalsTour';

describe( 'useSiteGoalsTour', () => {
	it( 'should return the leads variant when only lead events are detected', async () => {
		const registry = createTestRegistry();
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM ] );

		const { result } = await renderHook( () => useSiteGoalsTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( result.current.slug ).toBe( 'site-goals-feature-tour' );
		expect( result.current.steps[ 1 ].content ).toContain( 'form' );
	} );

	it( 'should return the sales variant when only ecommerce events are detected', async () => {
		const registry = createTestRegistry();
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const { result } = await renderHook( () => useSiteGoalsTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( result.current.slug ).toBe( 'site-goals-feature-tour' );
		expect( result.current.steps[ 1 ].content ).toContain( 'WooCommerce' );
	} );

	it( 'should return the leads variant when both event types are detected', async () => {
		const registry = createTestRegistry();
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			] );

		const { result } = await renderHook( () => useSiteGoalsTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( result.current.steps[ 1 ].content ).toContain( 'form' );
	} );
} );
