/**
 * `modules/adsense` data store: accounts tests.
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
import { setUsingCache } from 'googlesitekit-api';
import { MODULES_ADSENSE } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/adsense accounts', () => {
	let registry;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {} );

	describe( 'selectors', () => {
		describe( 'getAccounts', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/accounts'
					),
					{ body: fixtures.accounts, status: 200 }
				);

				const initialAccounts = registry
					.select( MODULES_ADSENSE )
					.getAccounts();
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialAccounts ).toEqual( undefined );
				await subscribeUntil(
					registry,
					() =>
						registry.select( MODULES_ADSENSE ).getAccounts() !==
						undefined
				);

				const accounts = registry
					.select( MODULES_ADSENSE )
					.getAccounts();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( accounts ).toEqual( fixtures.accounts );
			} );

			it( 'does not make a network request if accounts are already present', async () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetAccounts( fixtures.accounts );

				const accounts = registry
					.select( MODULES_ADSENSE )
					.getAccounts();

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ADSENSE )
						.hasFinishedResolution( 'getAccounts' )
				);

				expect( accounts ).toEqual( fixtures.accounts );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.get(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/accounts'
					),
					{ body: response, status: 500 }
				);

				registry.select( MODULES_ADSENSE ).getAccounts();
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.isFetchingGetAccounts() === false
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const accounts = registry
					.select( MODULES_ADSENSE )
					.getAccounts();
				expect( accounts ).toEqual( undefined );

				await untilResolved( registry, MODULES_ADSENSE ).getAccounts();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
