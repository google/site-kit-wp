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
import {
	createTestRegistry,
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { enabledFeatures } from '../../../features';
import { MODULES_IDEA_HUB } from './constants';
import * as fixtures from './__fixtures__';

describe( 'modules/idea-hub new-ideas', () => {
	let registry;
	const ideaHubGlobal = '_googlesitekitIdeaHub';
	const ideaHubData = {
		lastIdeaPostUpdatedAt: '123',
	};

	const newIdeasEndpoint =
		/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		global[ ideaHubGlobal ] = ideaHubData;
		enabledFeatures.add( 'ideaHubModule' );
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ ideaHubGlobal ];
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getNewIdeas', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.getOnce( newIdeasEndpoint, {
					body: fixtures.newIdeas,
				} );

				expect(
					registry.select( MODULES_IDEA_HUB ).getNewIdeas()
				).toBeUndefined();
				await untilResolved( registry, MODULES_IDEA_HUB ).getNewIdeas();
				expect(
					registry.select( MODULES_IDEA_HUB ).getNewIdeas()
				).toEqual( fixtures.newIdeas );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not make a network request if report for given options is already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_IDEA_HUB )
					.receiveGetNewIdeas( fixtures.newIdeas, {
						timestamp: ideaHubData.lastIdeaPostUpdatedAt,
					} );

				const report = registry
					.select( MODULES_IDEA_HUB )
					.getNewIdeas();
				await untilResolved( registry, MODULES_IDEA_HUB ).getNewIdeas();
				expect( report ).toEqual( fixtures.newIdeas );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( newIdeasEndpoint, {
					body: response,
					status: 500,
				} );

				registry.select( MODULES_IDEA_HUB ).getNewIdeas();
				await untilResolved( registry, MODULES_IDEA_HUB ).getNewIdeas();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect(
					registry.select( MODULES_IDEA_HUB ).getNewIdeas()
				).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getNewIdeasSlice', () => {
			beforeEach( () => {
				registry
					.dispatch( MODULES_IDEA_HUB )
					.receiveGetNewIdeas( fixtures.newIdeas, {} );
			} );

			it( 'should use offset and length parameters to adjust/limit the ideas returned by the selector', () => {
				const newIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getNewIdeasSlice( { offset: 2, length: 2 } );
				expect( newIdeas ).toEqual( fixtures.newIdeas.slice( 2, 4 ) );
			} );

			it( 'should treat all options as optional', () => {
				const newIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getNewIdeasSlice( {} );
				expect( newIdeas ).toEqual( fixtures.newIdeas );
			} );

			it( 'should adjust idea results when only offset parameter is supplied', () => {
				const newIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getNewIdeasSlice( { offset: 2 } );
				expect( newIdeas ).toEqual( fixtures.newIdeas.slice( 2 ) );
			} );

			it( 'should adjust idea results when only length parameter is supplied', async () => {
				const newIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getNewIdeasSlice( { length: 3 } );
				expect( newIdeas ).toEqual( fixtures.newIdeas.slice( 0, 3 ) );
			} );
		} );
	} );
} );
