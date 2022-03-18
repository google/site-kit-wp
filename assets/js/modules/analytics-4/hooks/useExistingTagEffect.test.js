/**
 * Analytics useExistingTagEffect hook tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { MODULES_ANALYTICS } from '../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../datastore/constants';
import { renderHook, actHook as act } from '../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../tests/js/utils';
import useExistingTagEffect from './useExistingTagEffect';

describe( 'useExistingTagEffect', () => {
	let registry;

	const measurementID = 'G-1A2B3C4D5E';

	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		// Set no existing tag.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );
	} );

	it( 'should not update the "use snippet" setting if there is no existing tag or measurementID', async () => {
		act( () => {
			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getUseSnippet()
		).toBeUndefined();

		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetExistingTag( measurementID );

			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getUseSnippet()
		).toBeUndefined();

		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetExistingTag( null );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setMeasurementID( measurementID );

			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getUseSnippet()
		).toBeUndefined();
	} );

	it( 'should disable the "use snippet" setting if the existing tag matches the measurementID', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetExistingTag( measurementID );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setMeasurementID( measurementID );

		act( () => {
			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			false
		);
	} );

	it( 'should enable the "use snippet" setting if the existing tag does not match the measurementID', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetExistingTag( measurementID );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setMeasurementID( 'G-1000000000' );

		act( () => {
			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			true
		);
	} );
} );
