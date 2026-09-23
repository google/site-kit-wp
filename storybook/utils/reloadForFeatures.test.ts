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
	const pageReloadMock = jest.fn();
	const pageReplaceMock = jest.fn();
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
					value: pageReloadMock,
				},
				replace: {
					configurable: true,
					value: pageReplaceMock,
				},
				href: {
					configurable: true,
					writable: true,
					value: '',
				},
			}
		) as Location;
	} );

	afterAll( () => {
		global.location = oldLocation;
	} );

	afterEach( () => {
		delete global._googlesitekitBaseData.enabledFeatures;
		global.location.href = '';
		window.sessionStorage.clear();
		pageReloadMock.mockClear();
		pageReplaceMock.mockClear();
		jest.restoreAllMocks();
	} );

	it( 'does not reload when the page already has the flags the story needs', () => {
		global._googlesitekitBaseData.enabledFeatures = [ 'rrmExpressSetup' ];

		expect( reloadForFeatures( [ 'rrmExpressSetup' ] ) ).toBe( false );
		expect( pageReloadMock ).not.toHaveBeenCalled();
	} );

	it( 'does not reload when the story lists the same flags in a different order', () => {
		global._googlesitekitBaseData.enabledFeatures = [
			'setupFlowRefresh',
			'rrmExpressSetup',
		];

		expect(
			reloadForFeatures( [ 'rrmExpressSetup', 'setupFlowRefresh' ] )
		).toBe( false );
		expect( pageReloadMock ).not.toHaveBeenCalled();
	} );

	it( 'stores the flags and reloads when the story needs different flags', () => {
		global._googlesitekitBaseData.enabledFeatures = [ 'setupFlowRefresh' ];

		expect( reloadForFeatures( [ 'rrmExpressSetup' ] ) ).toBe( true );
		expect(
			window.sessionStorage.getItem( 'googlesitekit-storybook-features' )
		).toBe( '["rrmExpressSetup"]' );
		expect( pageReloadMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stores an empty list and reloads when the story needs no flags', () => {
		global._googlesitekitBaseData.enabledFeatures = [ 'rrmExpressSetup' ];

		expect( reloadForFeatures() ).toBe( true );
		expect(
			window.sessionStorage.getItem( 'googlesitekit-storybook-features' )
		).toBe( '[]' );
		expect( pageReloadMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stores the flags and reloads when the page loaded with no flags', () => {
		expect( global._googlesitekitBaseData.enabledFeatures ).toBeUndefined();

		expect( reloadForFeatures( [ 'rrmExpressSetup' ] ) ).toBe( true );
		expect(
			window.sessionStorage.getItem( 'googlesitekit-storybook-features' )
		).toBe( '["rrmExpressSetup"]' );
		expect( pageReloadMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not reload when session storage cannot store the flags', () => {
		global._googlesitekitBaseData.enabledFeatures = [ 'setupFlowRefresh' ];

		// `jest-localstorage-mock` already makes `setItem` a mock, so
		// `jest.restoreAllMocks()` does not remove the throw. Without
		// `mockImplementationOnce()`, the throw stays on `setItem` and every
		// later test in this file fails.
		jest.spyOn( window.sessionStorage, 'setItem' ).mockImplementationOnce(
			() => {
				throw new Error( 'Session storage is unavailable.' );
			}
		);

		expect( reloadForFeatures( [ 'rrmExpressSetup' ] ) ).toBe( false );
		expect( pageReloadMock ).not.toHaveBeenCalled();
	} );

	it( 'sets the flags in the page URL and loads it when the URL holds a `features` value', () => {
		global._googlesitekitBaseData.enabledFeatures = [];
		global.location.href =
			'http://localhost/iframe.html?viewMode=story&id=story-id&features=';

		expect( reloadForFeatures( [ 'rrmExpressSetup' ] ) ).toBe( true );
		expect( pageReplaceMock ).toHaveBeenCalledWith(
			'http://localhost/iframe.html?viewMode=story&id=story-id&features=rrmExpressSetup'
		);
		expect( pageReplaceMock ).toHaveBeenCalledTimes( 1 );
		expect( pageReloadMock ).not.toHaveBeenCalled();
	} );

	describe( 'inside the Storybook app', () => {
		const parentReloadMock = jest.fn();
		let oldParent: Window;

		beforeAll( () => {
			oldParent = global.parent;

			// jsdom gives `parent` no setter, so delete it before assigning a fake.
			// @ts-expect-error -- `parent` is not optional on the window type.
			delete global.parent;

			global.parent = {
				location: { reload: parentReloadMock },
			} as unknown as Window;
		} );

		afterAll( () => {
			global.parent = oldParent;
		} );

		it( 'reloads the Storybook app, not only the page', () => {
			global._googlesitekitBaseData.enabledFeatures = [
				'setupFlowRefresh',
			];

			expect( reloadForFeatures( [ 'rrmExpressSetup' ] ) ).toBe( true );
			expect( parentReloadMock ).toHaveBeenCalledTimes( 1 );
			expect( pageReloadMock ).not.toHaveBeenCalled();
		} );
	} );
} );
