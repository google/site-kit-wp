/**
 * Tests for the useEventProviderDeactivatedNoticeCopy hook.
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
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { render, renderHook } from '@tests/js/test-utils';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import { useEventProviderDeactivatedNoticeCopy } from './useEventProviderDeactivatedNoticeCopy';

describe( 'useEventProviderDeactivatedNoticeCopy', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it.each( [
		{
			goalType: GOAL_TYPES.ECOMMERCE,
			expectedTitle: 'Online store plugin no longer found',
		},
		{
			goalType: GOAL_TYPES.LEAD,
			expectedTitle: 'Form plugin no longer found',
		},
	] )(
		'titles the notice "$expectedTitle" for the $goalType goal type',
		( { goalType, expectedTitle } ) => {
			const { result } = renderHook(
				() => useEventProviderDeactivatedNoticeCopy( goalType ),
				{ registry }
			);

			expect( result.current.title ).toBe( expectedTitle );
		}
	);

	it( 'gives the description a Learn more link to the conversion tracking page', () => {
		const { result } = renderHook(
			() => useEventProviderDeactivatedNoticeCopy( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		const { getByRole } = render( <p>{ result.current.description }</p>, {
			registry,
		} );

		expect( getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
			'href',
			registry
				.select( CORE_SITE )
				.getDocumentationLinkURL( 'plugin-conversion-tracking' )
		);
	} );
} );
