/**
 * `modules/idea-hub` data store: draft-post-ideas tests.
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
import { MODULES_IDEA_HUB } from './constants';
import {
	createTestRegistry,
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import { enabledFeatures } from '../../../features';

describe( 'modules/idea-hub draft-ideas', () => {
	const ideaHubGlobal = '_googlesitekitIdeaHub';
	const ideaHubData = {
		lastIdeaPostUpdatedAt: '123',
	};
	let registry;

	const getDraftPostIdeasEndpoint =
		/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/draft-post-ideas/;

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
		describe( 'getDraftPostIdeas', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.getOnce( getDraftPostIdeasEndpoint, {
					body: fixtures.draftPostIdeas,
				} );

				const pendingDraftPostIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getDraftPostIdeas();
				expect( pendingDraftPostIdeas ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_IDEA_HUB
				).getDraftPostIdeas();

				const draftPostIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getDraftPostIdeas();
				expect( draftPostIdeas ).toEqual( fixtures.draftPostIdeas );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not make a network request if report for given options is already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_IDEA_HUB )
					.receiveGetDraftPostIdeas( fixtures.draftPostIdeas, {
						timestamp: ideaHubData.lastIdeaPostUpdatedAt,
					} );

				const report = registry
					.select( MODULES_IDEA_HUB )
					.getDraftPostIdeas();
				await untilResolved(
					registry,
					MODULES_IDEA_HUB
				).getDraftPostIdeas();
				expect( report ).toEqual( fixtures.draftPostIdeas );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( getDraftPostIdeasEndpoint, {
					body: response,
					status: 500,
				} );

				registry.select( MODULES_IDEA_HUB ).getDraftPostIdeas();
				await untilResolved(
					registry,
					MODULES_IDEA_HUB
				).getDraftPostIdeas();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const draftPostIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getDraftPostIdeas();
				expect( draftPostIdeas ).toBeUndefined();

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getDraftPostIdeasSlice', () => {
			beforeEach( () => {
				registry
					.dispatch( MODULES_IDEA_HUB )
					.receiveGetDraftPostIdeas( fixtures.draftPostIdeas, {
						timestamp: ideaHubData.lastIdeaPostUpdatedAt,
					} );
			} );

			it( 'should use offset and length parameters to adjust/limit the ideas returned by the selector', () => {
				const draftPostIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getDraftPostIdeasSlice( { offset: 2, length: 2 } );
				expect( draftPostIdeas ).toEqual(
					fixtures.draftPostIdeas.slice( 2, 4 )
				);
			} );

			it( 'should treat all options as optional', () => {
				const draftPostIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getDraftPostIdeasSlice( {} );
				expect( draftPostIdeas ).toEqual( fixtures.draftPostIdeas );
			} );

			it( 'should adjust idea results when only offset parameter is supplied', () => {
				const draftPostIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getDraftPostIdeasSlice( { offset: 2 } );
				expect( draftPostIdeas ).toEqual(
					fixtures.draftPostIdeas.slice( 2 )
				);
			} );

			it( 'should adjust idea results when only limit parameter is supplied', () => {
				const draftPostIdeas = registry
					.select( MODULES_IDEA_HUB )
					.getDraftPostIdeasSlice( { length: 3 } );
				expect( draftPostIdeas ).toEqual(
					fixtures.draftPostIdeas.slice( 0, 3 )
				);
			} );
		} );
	} );
} );
