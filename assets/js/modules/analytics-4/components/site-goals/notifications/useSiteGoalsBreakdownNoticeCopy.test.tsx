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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { BREAKDOWN_SCOPE_BOTH } from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { BreakdownScope } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { render, renderHook } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserCapabilities,
} from '@tests/js/utils';
import { useSiteGoalsBreakdownNoticeCopy } from './useSiteGoalsBreakdownNoticeCopy';

describe( 'useSiteGoalsBreakdownNoticeCopy', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		// The breakdown notice reads this setting; `true` keeps these tests on
		// the existing notice, without the conversion tracking disclosure.
		registry
			.dispatch( CORE_SITE )
			.receiveGetConversionTrackingSettings( { enabled: true } );
		provideSiteInfo( registry );
		// The hook only reads the setting for a user allowed to read it.
		provideUserCapabilities( registry );
	} );

	function getDescriptionText( scope: BreakdownScope ): string {
		const { result } = renderHook(
			() => useSiteGoalsBreakdownNoticeCopy( scope ),
			{ registry }
		);

		const { container } = render(
			<div>{ result.current.description }</div>,
			{
				registry,
			}
		);

		return container.textContent ?? '';
	}

	it( 'returns the multi-plugin ecommerce copy when multiple ecommerce providers are active', () => {
		provideSiteInfo( registry, {
			hasMultipleActiveEcommerceEventProviders: true,
		} );

		const { result } = renderHook(
			() => useSiteGoalsBreakdownNoticeCopy( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current.title ).toBe(
			'See how different plugins contribute to your goals'
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

	it( 'returns the combined multi-plugin copy for the "both" scope', () => {
		provideSiteInfo( registry, {
			hasMultipleActiveEcommerceEventProviders: true,
		} );

		const { result } = renderHook(
			() => useSiteGoalsBreakdownNoticeCopy( BREAKDOWN_SCOPE_BOTH ),
			{ registry }
		);

		expect( result.current.title ).toBe(
			'Have multiple forms, or using both WooCommerce and Easy Digital Downloads for your site?'
		);
	} );

	it( 'returns the combined single-plugin copy for the "both" scope', () => {
		provideSiteInfo( registry, {
			hasMultipleActiveEcommerceEventProviders: false,
		} );

		const { result } = renderHook(
			() => useSiteGoalsBreakdownNoticeCopy( BREAKDOWN_SCOPE_BOTH ),
			{ registry }
		);

		expect( result.current.title ).toBe(
			'Have multiple forms, or selling products or services?'
		);
	} );

	describe( 'on a site that does not track conversions yet', () => {
		beforeEach( () => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetConversionTrackingSettings( { enabled: false } );
		} );

		it.each( [
			[ 'a single ecommerce provider', false ],
			[ 'multiple ecommerce providers', true ],
		] )(
			'warns an online store about its sales, with %s',
			( _label, hasMultipleProviders ) => {
				provideSiteInfo( registry, {
					hasMultipleActiveEcommerceEventProviders:
						hasMultipleProviders,
				} );

				expect( getDescriptionText( GOAL_TYPES.ECOMMERCE ) ).toContain(
					'Enabling this breakdown will also enable conversion tracking for your sales.'
				);
			}
		);

		it( 'warns a lead generation site about its forms', () => {
			expect( getDescriptionText( GOAL_TYPES.LEAD ) ).toContain(
				'Enabling this breakdown will also enable conversion tracking for your forms.'
			);
		} );

		it.each( [
			[ 'a single ecommerce provider', false ],
			[ 'multiple ecommerce providers', true ],
		] )(
			'names both in the side panel notice, with %s',
			( _label, hasMultipleProviders ) => {
				provideSiteInfo( registry, {
					hasMultipleActiveEcommerceEventProviders:
						hasMultipleProviders,
				} );

				expect( getDescriptionText( BREAKDOWN_SCOPE_BOTH ) ).toContain(
					'Enabling this breakdown will also enable conversion tracking for your forms and sales.'
				);
			}
		);

		it( 'puts the disclosure in front of the "Learn more" link', () => {
			const text = getDescriptionText( GOAL_TYPES.ECOMMERCE );

			expect(
				text.indexOf( 'conversion tracking for your sales.' )
			).toBeLessThan( text.indexOf( 'Learn more' ) );
		} );
	} );

	it.each< [ string, BreakdownScope ] >( [
		[ 'online store', GOAL_TYPES.ECOMMERCE ],
		[ 'lead generation', GOAL_TYPES.LEAD ],
		[ 'side panel', BREAKDOWN_SCOPE_BOTH ],
	] )(
		'says nothing about conversion tracking in the %s notice for a site that already tracks it',
		( _label, scope ) => {
			expect( getDescriptionText( scope ) ).not.toContain(
				'conversion tracking'
			);
		}
	);
} );
