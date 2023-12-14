/**
 * `useWidgetStateEffect` hook tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { CORE_WIDGETS } from '../datastore/constants';
import { renderHook, actHook as act } from '../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../tests/js/utils';
import useWidgetStateEffect from './useWidgetStateEffect';

describe( 'useWidgetStateEffect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should set and unset widget state data', () => {
		const widgetSlug = 'testWidget';
		function Component() {
			return null;
		}
		let metadata = { importantProp: 'testPropValue' };

		// Initially widget state should be `null`.
		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toBe( null );

		const hookResult = renderHook(
			() => useWidgetStateEffect( widgetSlug, Component, metadata ),
			{ registry }
		);

		// After rendering widget state should be set correctly.
		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toMatchObject( {
			Component,
			metadata,
		} );

		metadata = { importantProp: 'otherTestPropValue' };
		hookResult.rerender();

		// After re-rendering with different data widget state should be modified correctly.
		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toMatchObject( {
			Component,
			metadata,
		} );

		act( () => {
			hookResult.unmount();
		} );

		// After unmounting widget state should be `null` again.
		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toBe( null );
	} );
} );
