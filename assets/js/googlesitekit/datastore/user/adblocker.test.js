/**
 * `modules/adsense` data store: adblocker tests.
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
import {
	createTestRegistry,
	muteFetch,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';

import { detectAnyAdblocker as mockDetectAnyAdblocker } from 'just-detect-adblock';
import { CORE_USER } from './constants';
jest.mock( 'just-detect-adblock' );

function stubIsAdBlockerDetected( detected ) {
	mockDetectAnyAdblocker.mockImplementation(
		() =>
			new Promise( ( resolve ) =>
				setTimeout( () => resolve( !! detected ) )
			)
	);
}

describe( 'core/user adblocker', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		mockDetectAnyAdblocker.mockReset();
	} );

	describe( 'actions', () => {
		describe( 'receiveIsAdBlockerActive', () => {
			it( 'requires the isAdBlockerActive param to be boolean', () => {
				expect( () => {
					registry.dispatch( CORE_USER ).receiveIsAdBlockerActive();
				} ).toThrow( 'isAdBlockerActive must be boolean.' );
			} );

			it( 'receives and sets isAdBlockerActive', () => {
				registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );

				expect( registry.select( CORE_USER ).isAdBlockerActive() ).toBe(
					true
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isAdBlockerActive', () => {
			it( 'uses a resolver to query detection using detectAnyAdblocker', async () => {
				stubIsAdBlockerDetected( false );
				muteFetch( 'path:/favicon.ico' );

				expect(
					registry.select( CORE_USER ).isAdBlockerActive()
				).toBeUndefined();
				await untilResolved( registry, CORE_USER ).isAdBlockerActive();

				expect( registry.select( CORE_USER ).isAdBlockerActive() ).toBe(
					false
				);
				expect( mockDetectAnyAdblocker ).toHaveBeenCalled();
			} );

			it( 'falls back to a test request to a well-known static asset with bait in the query string', async () => {
				stubIsAdBlockerDetected( false );
				fetchMock.getOnce( 'path:/favicon.ico', {
					throws: new TypeError( 'Failed to fetch' ),
				} );

				expect(
					registry.select( CORE_USER ).isAdBlockerActive()
				).toBeUndefined();
				await untilResolved( registry, CORE_USER ).isAdBlockerActive();

				expect( registry.select( CORE_USER ).isAdBlockerActive() ).toBe(
					true
				);
				expect( mockDetectAnyAdblocker ).toHaveBeenCalled();
				expect( fetchMock ).toHaveFetched( 'path:/favicon.ico' );
			} );

			it( 'resolver does not rely on detection if status is already known', async () => {
				stubIsAdBlockerDetected( true );
				// Set value to false, contrary to the detection utility above which would result in this being true.
				registry
					.dispatch( CORE_USER )
					.receiveIsAdBlockerActive( false );

				expect( registry.select( CORE_USER ).isAdBlockerActive() ).toBe(
					false
				);
				await untilResolved( registry, CORE_USER ).isAdBlockerActive();

				// Value should still be false because the global with true is not considered.
				expect( registry.select( CORE_USER ).isAdBlockerActive() ).toBe(
					false
				);
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'returns true if ad blocker is received as active', async () => {
				registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );

				expect( registry.select( CORE_USER ).isAdBlockerActive() ).toBe(
					true
				);
				await untilResolved( registry, CORE_USER ).isAdBlockerActive();

				// Value should still be true since resolver should not have changed anything.
				expect( registry.select( CORE_USER ).isAdBlockerActive() ).toBe(
					true
				);
				expect( fetchMock ).not.toHaveFetched();
			} );
		} );
	} );
} );
