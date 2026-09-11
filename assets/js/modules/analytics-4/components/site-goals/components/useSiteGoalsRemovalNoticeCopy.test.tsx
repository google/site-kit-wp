/**
 * Site Goals removal notice copy hook tests.
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
import { render, renderHook } from '@tests/js/test-utils';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import { useSiteGoalsRemovalNoticeCopy } from './useSiteGoalsRemovalNoticeCopy';

describe( 'useSiteGoalsRemovalNoticeCopy', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'returns the title "Online store performance was removed from your dashboard" for the ecommerce goal type', () => {
		const { result } = renderHook(
			() => useSiteGoalsRemovalNoticeCopy( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current.title ).toBe(
			'Online store performance was removed from your dashboard'
		);
	} );

	it( 'returns the title "Lead generation performance was removed from your dashboard" for the lead goal type', () => {
		const { result } = renderHook(
			() => useSiteGoalsRemovalNoticeCopy( GOAL_TYPES.LEAD ),
			{ registry }
		);

		expect( result.current.title ).toBe(
			'Lead generation performance was removed from your dashboard'
		);
	} );

	it( 'returns a description with a "Learn more" link to the conversion tracking support page', () => {
		const { result } = renderHook(
			() => useSiteGoalsRemovalNoticeCopy( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		const { getByRole } = render( <p>{ result.current.description }</p>, {
			registry,
		} );

		expect( getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?doc=plugin-conversion-tracking'
		);
	} );
} );
