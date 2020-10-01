/**
 * Adsense module data store: adblocker tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { STORE_NAME } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';

describe( 'modules/adsense adblocker', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveIsAdBlockerActive', () => {
			it( 'requires the isAdBlockerActive param to be boolean', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive();
				} ).toThrow( 'isAdBlockerActive must be boolean.' );
			} );

			it( 'receives and sets isAdBlockerActive', () => {
				registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( true );

				expect( registry.select( STORE_NAME ).isAdBlockerActive() ).toBe( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isAdBlockerActive', () => {
			it( 'uses a resolver to load status from a global variable by default', async () => {
				if ( ! global._googlesitekitLegacyData ) {
					global._googlesitekitLegacyData = {};
				}
				global._googlesitekitLegacyData.canAdsRun = true;

				registry.select( STORE_NAME ).isAdBlockerActive();
				await subscribeUntil( registry, () => registry.select( STORE_NAME ).hasFinishedResolution( 'isAdBlockerActive' ) );

				// canAdsRun global has opposite value of isAdBlockerActive.
				expect( registry.select( STORE_NAME ).isAdBlockerActive() ).toBe( false );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global._googlesitekitLegacyData.canAdsRun ).not.toEqual( undefined );
			} );

			it( 'resolver does not rely on global if status is already known', async () => {
				if ( ! global._googlesitekitLegacyData ) {
					global._googlesitekitLegacyData = {};
				}
				// Setting `canAdsRun` to `false` means an ad-blocker is enabled;
				// if we can run ads, then we don't have an ad-blocker on.
				global._googlesitekitLegacyData.canAdsRun = false;

				// Set value to false, contrary to the global above which would result in this being true.
				registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );

				expect( registry.select( STORE_NAME ).isAdBlockerActive() ).toBe( false );
				await subscribeUntil( registry, () => registry.select( STORE_NAME ).hasFinishedResolution( 'isAdBlockerActive' ) );

				// Value should still be false because the global with true is not considered.
				expect( registry.select( STORE_NAME ).isAdBlockerActive() ).toBe( false );
			} );

			it( 'returns true if ad blocker is received as active', async () => {
				registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( true );

				expect( registry.select( STORE_NAME ).isAdBlockerActive() ).toBe( true );
				await subscribeUntil( registry, () => registry.select( STORE_NAME ).hasFinishedResolution( 'isAdBlockerActive' ) );

				// Value should still be true since resolver should not have changed anything.
				expect( registry.select( STORE_NAME ).isAdBlockerActive() ).toBe( true );
			} );
		} );
	} );
} );
