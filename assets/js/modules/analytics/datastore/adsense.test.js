/**
 * `modules/analytics` data store: adsense tests.
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
import API from 'googlesitekit-api';
import { MODULES_ANALYTICS } from './constants';
import {
	createTestRegistry,
	// muteConsole,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import fetchMock from 'fetch-mock';

describe( 'modules/analytics adsense', () => {
	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ MODULES_ANALYTICS ].store;
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'setAdsenseLinked', () => {
			it.each( [
				[ true, true ],
				[ 1, true ],
				[ '', false ],
				[ null, false ],
				[ false, false ],
				[ undefined, false ],
			] )( 'receives %j as %s', ( input, expected ) => {
				expect( store.getState().adsenseLinked ).toBeUndefined();

				registry
					.dispatch( MODULES_ANALYTICS )
					.setAdsenseLinked( input );

				expect( store.getState().adsenseLinked ).toBe( expected );
			} );

			it( 'is independent of the adsenseLinked setting', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetSettings( { adsenseLinked: false } );

				registry.dispatch( MODULES_ANALYTICS ).setAdsenseLinked( true );

				expect( store.getState().adsenseLinked ).toBe( true );
				expect( store.getState().settings.adsenseLinked ).toBe( false );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAdsenseLinked', () => {
			it( 'resolves the initial value from the adsenseLinked setting', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/settings'
					),
					{ body: { adsenseLinked: true }, status: 200 }
				);

				expect(
					registry.select( MODULES_ANALYTICS ).getAdsenseLinked()
				).toBeUndefined();

				const adsenseLinked = await registry
					.resolveSelect( MODULES_ANALYTICS )
					.getAdsenseLinked();

				expect( adsenseLinked ).toBe( true );
			} );

			it( 'supports asynchronous settings resolution', async () => {
				let resolveResponse;
				const responsePromise = new Promise( ( resolve ) => {
					resolveResponse = () => resolve( { adsenseLinked: true } );
				} );
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/settings'
					),
					responsePromise
				);
				// Select getAdsenseLinked once, using resolve select.
				const selectPromise = registry
					.resolveSelect( MODULES_ANALYTICS )
					.getAdsenseLinked();
				// A regular synchronous select shows the value is currently in its initial state.
				expect(
					registry.select( MODULES_ANALYTICS ).getAdsenseLinked()
				).toBeUndefined();
				// Resolve settings request response.
				resolveResponse();

				await expect( selectPromise ).resolves.toBe( true );
			} );
		} );
	} );
} );
