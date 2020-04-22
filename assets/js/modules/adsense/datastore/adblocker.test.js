/**
 * modules/adsense data store: adblocker tests.
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
	let select;
	let dispatch;

	beforeEach( () => {
		registry = createTestRegistry();
		select = registry.select( STORE_NAME );
		dispatch = registry.dispatch( STORE_NAME );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveIsAdBlockerActive', () => {
			it( 'requires the isAdBlockerActive param', () => {
				expect( () => {
					dispatch.receiveIsAdBlockerActive();
				} ).toThrow( 'isAdBlockerActive is required.' );
			} );

			it( 'receives and sets isAdBlockerActive', async () => {
				await dispatch.receiveIsAdBlockerActive( true );

				expect( select.isAdBlockerActive() ).toBe( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isAdBlockerActive', () => {
			it( 'uses a resolver to load status from a global variable by default', async () => {
				if ( ! global.googlesitekit ) {
					global.googlesitekit = {};
				}
				global.googlesitekit.canAdsRun = true;

				expect( global.googlesitekit.canAdsRun ).not.toEqual( undefined );

				select.isAdBlockerActive();
				await subscribeUntil( registry,
					() => (
						select.isAdBlockerActive() !== undefined
					),
				);

				// canAdsRun global has opposite value of isAdBlockerActive.
				expect( select.isAdBlockerActive() ).toBe( false );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global.googlesitekit.canAdsRun ).not.toEqual( undefined );
			} );

			it( 'resolver does not rely on global if status is already known', async () => {
				if ( ! global.googlesitekit ) {
					global.googlesitekit = {};
				}
				global.googlesitekit.canAdsRun = false;

				// Set value to false, contrary to the global above which would result in true.
				dispatch.receiveIsAdBlockerActive( false );

				expect( select.isAdBlockerActive() ).toBe( false );
				await subscribeUntil( registry, () => select.hasFinishedResolution( 'isAdBlockerActive' ) );

				// Value should still be false because the global with true is not considered.
				expect( select.isAdBlockerActive() ).toBe( false );
			} );

			it( 'returns true if ad blocker is received as active', async () => {
				dispatch.receiveIsAdBlockerActive( true );

				expect( select.isAdBlockerActive() ).toBe( true );
				await subscribeUntil( registry, () => select.hasFinishedResolution( 'isAdBlockerActive' ) );

				// Value should still be true since resolver should not have changed anything.
				expect( select.isAdBlockerActive() ).toBe( true );
			} );
		} );
	} );
} );
