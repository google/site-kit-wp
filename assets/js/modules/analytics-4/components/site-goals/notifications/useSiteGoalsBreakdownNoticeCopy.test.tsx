/**
 * Tests for the useSiteGoalsBreakdownNoticeCopy hook.
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
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { renderHook } from '@tests/js/test-utils';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import { useSiteGoalsBreakdownNoticeCopy } from './useSiteGoalsBreakdownNoticeCopy';

describe( 'useSiteGoalsBreakdownNoticeCopy', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'returns the multi-plugin ecommerce copy when multiple ecommerce providers are active', () => {
		provideSiteInfo( registry, {
			hasMultipleActiveEcommerceEventProviders: true,
		} );

		const { result } = renderHook(
			() => useSiteGoalsBreakdownNoticeCopy( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current.title ).toBe(
			'Using both WooCommerce and Easy Digital Downloads to sell products or services?'
		);
	} );

	it( 'returns the single-plugin ecommerce copy when only one ecommerce provider is active', () => {
		provideSiteInfo( registry, {
			hasMultipleActiveEcommerceEventProviders: false,
		} );

		const { result } = renderHook(
			() => useSiteGoalsBreakdownNoticeCopy( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current.title ).toBe(
			'See exactly which plugins are driving your results'
		);
	} );

	it( 'returns the lead generation copy for the lead goal type', () => {
		const { result } = renderHook(
			() => useSiteGoalsBreakdownNoticeCopy( GOAL_TYPES.LEAD ),
			{ registry }
		);

		expect( result.current.title ).toBe(
			'Want to see results for each form?'
		);
	} );
} );
