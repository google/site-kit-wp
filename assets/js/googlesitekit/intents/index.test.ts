/**
 * Intents API tests.
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
import { createIntents } from './index';

describe( 'createIntents', () => {
	function TestIntent() {
		return null;
	}

	function OtherTestIntent() {
		return null;
	}

	it( 'should return a registered intent with the component it was registered with', () => {
		const intents = createIntents();

		intents.registerIntent( 'test-intent', { Component: TestIntent } );

		expect( intents.getRegisteredIntent( 'test-intent' ) ).toEqual( {
			Component: TestIntent,
		} );
	} );

	it( 'should return undefined for a slug that was never registered', () => {
		const intents = createIntents();

		expect( intents.getRegisteredIntent( 'never-registered' ) ).toBe(
			undefined
		);
	} );

	it( 'should keep each registry independent of the others', () => {
		const intents = createIntents();
		const otherIntents = createIntents();

		intents.registerIntent( 'test-intent', { Component: TestIntent } );

		expect( otherIntents.getRegisteredIntent( 'test-intent' ) ).toBe(
			undefined
		);
	} );

	it( 'should keep the first registration and warn when a slug is registered twice', () => {
		const intents = createIntents();

		intents.registerIntent( 'duplicate-intent', { Component: TestIntent } );
		intents.registerIntent( 'duplicate-intent', {
			Component: OtherTestIntent,
		} );

		expect( console ).toHaveWarnedWith(
			'Could not register intent with slug "duplicate-intent". Intent "duplicate-intent" is already registered.'
		);
		expect(
			intents.getRegisteredIntent( 'duplicate-intent' )?.Component
		).toBe( TestIntent );
	} );

	it( 'should return undefined for an inherited Object property name', () => {
		const intents = createIntents();

		expect( intents.getRegisteredIntent( 'toString' ) ).toBe( undefined );
	} );

	it( 'should register an intent named after an inherited Object property', () => {
		const intents = createIntents();

		intents.registerIntent( 'toString', { Component: TestIntent } );

		expect( console ).not.toHaveWarned();
		expect( intents.getRegisteredIntent( 'toString' )?.Component ).toBe(
			TestIntent
		);
	} );
} );
