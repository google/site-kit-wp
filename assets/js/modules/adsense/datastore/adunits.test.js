/**
 * `modules/adsense` data store: Ad Units tests.
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
import { MODULES_ADSENSE } from './constants';
import {
	createTestRegistry,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/adsense Ad Units', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getAdUnits', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/adunits'
					),
					{ body: fixtures.adunits, status: 200 }
				);

				const accountID = '123';
				const clientID = '456';

				const initialAdUnits = registry
					.select( MODULES_ADSENSE )
					.getAdUnits( accountID, clientID );

				expect( initialAdUnits ).toBeUndefined();
				await untilResolved( registry, MODULES_ADSENSE ).getAdUnits(
					accountID,
					clientID
				);

				const adunits = registry
					.select( MODULES_ADSENSE )
					.getAdUnits( accountID, clientID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( adunits ).toEqual( fixtures.adunits );
			} );

			it( 'does not make a network request if adunits for this account + client are already present', async () => {
				const accountID = 'pub-12345';
				const clientID = fixtures.clients[ 0 ]._id;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetAdUnits( fixtures.adunits, {
						accountID,
						clientID,
					} );

				const adunits = registry
					.select( MODULES_ADSENSE )
					.getAdUnits( accountID, clientID );

				await untilResolved( registry, MODULES_ADSENSE ).getAdUnits(
					accountID,
					clientID
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( adunits ).toEqual( fixtures.adunits );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/adunits'
					),
					{ body: response, status: 500 }
				);

				const fakeAccountID = '789';
				const fakeClientID = '012';

				registry
					.select( MODULES_ADSENSE )
					.getAdUnits( fakeAccountID, fakeClientID );
				await untilResolved( registry, MODULES_ADSENSE ).getAdUnits(
					fakeAccountID,
					fakeClientID
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const adunits = registry
					.select( MODULES_ADSENSE )
					.getAdUnits( fakeAccountID, fakeClientID );
				expect( adunits ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
