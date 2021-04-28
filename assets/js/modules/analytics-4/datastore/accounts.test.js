/**
 * `modules/analytics-4` data store: accounts tests.
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
import { STORE_NAME } from './constants';
import { createTestRegistry, unsubscribeFromAll, untilResolved } from 'tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 accounts', () => {
	let registry;

	const accountSummariesEndpoint = /^\/google-site-kit\/v1\/modules\/analytics-4\/data\/account-summaries/;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getAccountSummaries', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( accountSummariesEndpoint, {
					body: fixtures.accountSummaries,
					status: 200,
				} );

				const initialAccountSummaries = registry.select( STORE_NAME ).getAccountSummaries();
				expect( initialAccountSummaries ).toBeUndefined();

				await untilResolved( registry, STORE_NAME ).getAccountSummaries();
				expect( fetchMock ).toHaveFetched( accountSummariesEndpoint );

				const accountSummaries = registry.select( STORE_NAME ).getAccountSummaries();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( accountSummaries ).toEqual( fixtures.accountSummaries );
				expect( accountSummaries ).toHaveLength( fixtures.accountSummaries.length );
			} );

			it( 'should not make a network request if properties for this account are already present', async () => {
				registry.dispatch( STORE_NAME ).receiveGetAccountSummaries( fixtures.accountSummaries );

				const accountSummaries = registry.select( STORE_NAME ).getAccountSummaries();
				await untilResolved( registry, STORE_NAME ).getAccountSummaries();

				expect( fetchMock ).not.toHaveFetched( accountSummariesEndpoint );
				expect( accountSummaries ).toEqual( fixtures.accountSummaries );
				expect( accountSummaries ).toHaveLength( fixtures.accountSummaries.length );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( accountSummariesEndpoint, {
					body: response,
					status: 500,
				} );

				registry.select( STORE_NAME ).getAccountSummaries();
				await untilResolved( registry, STORE_NAME ).getAccountSummaries();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const accountSummaries = registry.select( STORE_NAME ).getAccountSummaries();
				expect( accountSummaries ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
