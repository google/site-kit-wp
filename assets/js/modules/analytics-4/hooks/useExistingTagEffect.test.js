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
import { MODULES_ANALYTICS_4 } from '../datastore/constants';
import { renderHook, actHook as act } from '../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../tests/js/utils';
import * as fixtures from '../datastore/__fixtures__';
import useExistingTagEffect from './useExistingTagEffect';

describe( 'useExistingTagEffect', () => {
	let registry;

	const measurementID = 'G-2B7M8YQ1K6';
	const secondMeasurementID = 'G-2A2B3C4D5E';
	const thirdMeasurementID = 'G-3A2B3C4D5E';

	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		// Set no existing tag.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );

		const containerMock = fixtures.container[ measurementID ];
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetGoogleTagContainer( containerMock, {
				measurementID,
			} );
	} );

	it( 'should not update the "use snippet" setting if there is no existing tag or measurementID', () => {
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

	it( 'should disable the "use snippet" setting if the existing tag matches the measurementID', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetExistingTag( measurementID );

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getUseSnippet()
		).toBeUndefined();

		// Resolve the measurementID.
		act( () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setMeasurementID( '' );
			rerender();
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getUseSnippet()
		).toBeUndefined();

		// Set the measurementID to the existing tag.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setMeasurementID( measurementID );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			false
		);
	} );

	it( 'should enable the "use snippet" setting if the existing tag does not match the measurementID', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetExistingTag( measurementID );

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getUseSnippet()
		).toBeUndefined();

		// Resolve the measurementID.
		act( () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setMeasurementID( '' );
			rerender();
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getUseSnippet()
		).toBeUndefined();

		// Set the measurementID to a different ID.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setMeasurementID( 'G-1000000000' );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			true
		);
	} );

	it( 'does not change the useSnippet value when there is already a measurement ID on page load (measurement ID is same as existing tag)', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetExistingTag( measurementID );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setMeasurementID( measurementID );

		// Manually set the useSnippet value to true.
		registry.dispatch( MODULES_ANALYTICS_4 ).setUseSnippet( true );

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			true
		);

		// Change the measurement ID.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setMeasurementID( secondMeasurementID );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			true
		);

		// Change the measurement ID back to the existing tag.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setMeasurementID( measurementID );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			false
		);
	} );

	it( 'does not change the useSnippet value when there is already a measurement ID on page load (measurement ID is not the same as existing tag)', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetExistingTag( measurementID );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setMeasurementID( secondMeasurementID );

		// Manually set the useSnippet value to true.
		registry.dispatch( MODULES_ANALYTICS_4 ).setUseSnippet( false );

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			false
		);

		// Change the measurement ID to a different ID.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setMeasurementID( thirdMeasurementID );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			true
		);

		// Change the measurement ID to the existing tag.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setMeasurementID( measurementID );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			false
		);

		// Change the measurement ID back to the initial tag.
		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setMeasurementID( secondMeasurementID );
			rerender();
		} );

		expect( registry.select( MODULES_ANALYTICS_4 ).getUseSnippet() ).toBe(
			true
		);
	} );
} );
