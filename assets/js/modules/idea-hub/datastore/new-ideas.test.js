/**
 * `modules/idea-hub` data store: new-ideas tests.
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
import {
	createTestRegistry,
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import { enabledFeatures } from '../../../features';

describe( 'modules/idea-hub new-ideas', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		enabledFeatures.add( 'ideaHubModule' );
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getNewIdeas', () => {
			const options = {
				offset: 0,
				length: 5,
			};

			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
					{ body: fixtures.newIdeas, status: 200 }
				);

				const pendingNewIdeas = registry.select( STORE_NAME ).getNewIdeas( options );

				expect( pendingNewIdeas ).toEqual( undefined );
				await untilResolved( registry, STORE_NAME ).getNewIdeas( options );

				const newIdeas = registry.select( STORE_NAME ).getNewIdeas( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( newIdeas ).toEqual( fixtures.newIdeas );
			} );

			it( 'uses offset and length parameters to adjust/limit the ideas returned by the selector', async () => {
				const customOptions = {
					offset: 2,
					length: 2,
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
					{ body: fixtures.newIdeas, status: 200 }
				);

				registry.select( STORE_NAME ).getNewIdeas( customOptions );
				await untilResolved( registry, STORE_NAME ).getNewIdeas( customOptions );

				const newIdeas = registry.select( STORE_NAME ).getNewIdeas( customOptions );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( newIdeas ).toEqual( fixtures.newIdeas.slice( 2, 4 ) );
			} );

			it( 'treats all options as optional', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
					{ body: fixtures.newIdeas, status: 200 }
				);

				registry.select( STORE_NAME ).getNewIdeas( {} );
				await untilResolved( registry, STORE_NAME ).getNewIdeas( {} );

				const newIdeas = registry.select( STORE_NAME ).getNewIdeas( {} );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( newIdeas ).toEqual( fixtures.newIdeas );
			} );

			it( 'adjusts idea results when only offset parameter is supplied', async () => {
				const customOptions = {
					offset: 2,
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
					{ body: fixtures.newIdeas, status: 200 }
				);

				registry.select( STORE_NAME ).getNewIdeas( customOptions );
				await untilResolved( registry, STORE_NAME ).getNewIdeas( customOptions );

				const newIdeas = registry.select( STORE_NAME ).getNewIdeas( customOptions );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( newIdeas ).toEqual( fixtures.newIdeas.slice( 2 ) );
			} );

			it( 'adjusts idea results when only limit parameter is supplied', async () => {
				const customOptions = {
					length: 3,
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
					{ body: fixtures.newIdeas, status: 200 }
				);

				registry.select( STORE_NAME ).getNewIdeas( customOptions );
				await untilResolved( registry, STORE_NAME ).getNewIdeas( customOptions );

				const newIdeas = registry.select( STORE_NAME ).getNewIdeas( customOptions );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( newIdeas ).toEqual( fixtures.newIdeas.slice( 0, 3 ) );
			} );

			it( 'only fetches once even with different options are passed', async () => {
				const customOptions = {
					offset: 1,
					length: 1,
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
					{ body: fixtures.newIdeas, status: 200 }
				);

				registry.select( STORE_NAME ).getNewIdeas( customOptions );
				await untilResolved( registry, STORE_NAME ).getNewIdeas( customOptions );

				registry.select( STORE_NAME ).getNewIdeas( customOptions );
				registry.select( STORE_NAME ).getNewIdeas( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveGetNewIdeas( fixtures.newIdeas, { options } );

				const report = registry.select( STORE_NAME ).getNewIdeas( options );

				await untilResolved( registry, STORE_NAME ).getNewIdeas( options );

				expect( fetchMock ).not.toHaveFetched();
				expect( report ).toEqual( fixtures.newIdeas );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
					{ body: response, status: 500 }
				);

				registry.select( STORE_NAME ).getNewIdeas( options );
				await untilResolved( registry, STORE_NAME ).getNewIdeas( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const newIdeas = registry.select( STORE_NAME ).getNewIdeas( options );
				expect( newIdeas ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
