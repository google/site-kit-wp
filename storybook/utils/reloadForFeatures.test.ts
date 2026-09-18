/**
 * Feature flag reload utility tests.
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
import { reloadForFeatures } from './reloadForFeatures';

describe( 'reloadForFeatures', () => {
	const reloadMock = jest.fn();
	let oldLocation: Location;

	beforeAll( () => {
		oldLocation = global.location;

		// jsdom gives `location` no setter, so delete it before assigning a fake.
		// @ts-expect-error -- `location` is not optional on the window type.
		delete global.location;

		global.location = Object.defineProperties(
			{},
			{
				reload: {
					configurable: true,
					value: reloadMock,
				},
			}
		) as Location;
	} );

	afterAll( () => {
		global.location = oldLocation;
	} );

	afterEach( () => {
		window.sessionStorage.clear();
		reloadMock.mockClear();
		jest.restoreAllMocks();
	} );

	it( 'does not reload when the page already has the flags the story needs', () => {
		window.sessionStorage.setItem(
			'googlesitekit-storybook-features',
			'["rrmExpressSetup"]'
		);

		expect( reloadForFeatures( [ 'rrmExpressSetup' ] ) ).toBe( false );
		expect( reloadMock ).not.toHaveBeenCalled();
	} );

	it( 'does not reload when the story lists the same flags in a different order', () => {
		window.sessionStorage.setItem(
			'googlesitekit-storybook-features',
			'["setupFlowRefresh","rrmExpressSetup"]'
		);

		expect(
			reloadForFeatures( [ 'rrmExpressSetup', 'setupFlowRefresh' ] )
		).toBe( false );
		expect( reloadMock ).not.toHaveBeenCalled();
	} );

	it( 'stores the flags and reloads when the story needs different flags', () => {
		window.sessionStorage.setItem(
			'googlesitekit-storybook-features',
			'["setupFlowRefresh"]'
		);

		expect( reloadForFeatures( [ 'rrmExpressSetup' ] ) ).toBe( true );
		expect(
			window.sessionStorage.getItem( 'googlesitekit-storybook-features' )
		).toBe( '["rrmExpressSetup"]' );
		expect( reloadMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stores an empty list and reloads when the story needs no flags', () => {
		window.sessionStorage.setItem(
			'googlesitekit-storybook-features',
			'["rrmExpressSetup"]'
		);

		expect( reloadForFeatures() ).toBe( true );
		expect(
			window.sessionStorage.getItem( 'googlesitekit-storybook-features' )
		).toBe( '[]' );
		expect( reloadMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'reloads when session storage has a value that is not JSON', () => {
		window.sessionStorage.setItem(
			'googlesitekit-storybook-features',
			'rrmExpressSetup'
		);

		expect( reloadForFeatures( [ 'rrmExpressSetup' ] ) ).toBe( true );
		expect( reloadMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not reload when session storage cannot store the flags', () => {
		jest.spyOn( window.sessionStorage, 'setItem' ).mockImplementation(
			() => {
				throw new Error( 'Session storage is unavailable.' );
			}
		);

		expect( reloadForFeatures( [ 'rrmExpressSetup' ] ) ).toBe( false );
		expect( reloadMock ).not.toHaveBeenCalled();
	} );
} );
