/**
 * `modules/idea-hub` data store: draft-ideas tests.
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
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import { enabledFeatures } from '../../../features';

describe( 'modules/idea-hub draft-ideas', () => {
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

	describe( 'actions', () => {
		describe( 'createIdeaDraftPost', () => {
			it( 'creates and returns an idea post as a response', async () => {
				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/create-idea-draft-post/,
					{ body: fixtures.draftIdeas.response, status: 200 },
				);

				expect( registry.stores[ STORE_NAME ].store.getState().draftPostIdeas ).toEqual( undefined );
				expect( registry.stores[ STORE_NAME ].store.getState().newIdeas ).toEqual( undefined );
				expect( registry.stores[ STORE_NAME ].store.getState().savedIdeas ).toEqual( undefined );

				const { response } = await registry.dispatch( STORE_NAME ).createIdeaDraftPost( fixtures.draftIdeas.idea );

				expect( response ).toEqual( fixtures.draftIdeas.response );

				expect( registry.stores[ STORE_NAME ].store.getState().draftPostIdeas ).toEqual( [
					{ name: 'ideas/7612031899179595408', text: 'How to speed up your WordPress site', topics: [ { display_name: 'Websites', mid: '/m/09kqc' } ] },
				] );
				expect( registry.stores[ STORE_NAME ].store.getState().newIdeas ).toEqual( undefined );
				expect( registry.stores[ STORE_NAME ].store.getState().savedIdeas ).toEqual( undefined );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/create-idea-draft-post/,
					{ body: errorResponse, status: 500 }
				);

				const { response, error } = await registry.dispatch( STORE_NAME ).createIdeaDraftPost( fixtures.draftIdeas.idea );

				expect( console ).toHaveErrored();
				expect( error ).toEqual( errorResponse );
				expect( response ).toEqual( undefined );
				expect( registry.stores[ STORE_NAME ].store.getState().data ).toEqual( undefined );
			} );
		} );

		describe( 'removeIdeaFromNewAndSavedIdeas', () => {
			it( 'removes idea from newIdeas if exists', async () => {
				registry.dispatch( STORE_NAME ).receiveGetNewIdeas( fixtures.newIdeas );

				expect( registry.stores[ STORE_NAME ].store.getState().draftPostIdeas ).toEqual( undefined );

				expect( registry.stores[ STORE_NAME ].store.getState().newIdeas ).toEqual( fixtures.newIdeas );
				expect( registry.stores[ STORE_NAME ].store.getState().newIdeas ).toEqual(
					expect.arrayContaining( [
						fixtures.draftIdeas.idea,
					] )
				);
				expect( registry.stores[ STORE_NAME ].store.getState().savedIdeas ).toEqual( undefined );

				registry.dispatch( STORE_NAME ).removeIdeaFromNewAndSavedIdeas( fixtures.draftIdeas.idea.name );

				expect( registry.stores[ STORE_NAME ].store.getState().newIdeas ).not.toEqual(
					expect.arrayContaining( [
						fixtures.draftIdeas.idea,
					] )
				);
				expect( registry.stores[ STORE_NAME ].store.getState().savedIdeas ).toEqual( [] );
			} );

			it( 'removes idea from savedIdeas if exists', async () => {
				registry.dispatch( STORE_NAME ).receiveGetSavedIdeas( fixtures.savedIdeas );

				expect( registry.stores[ STORE_NAME ].store.getState().draftPostIdeas ).toEqual( undefined );

				expect( registry.stores[ STORE_NAME ].store.getState().newIdeas ).toEqual( undefined );

				expect( registry.stores[ STORE_NAME ].store.getState().savedIdeas ).toEqual( fixtures.savedIdeas );
				expect( registry.stores[ STORE_NAME ].store.getState().savedIdeas ).toEqual(
					expect.arrayContaining( [
						fixtures.draftIdeas.idea,
					] )
				);

				registry.dispatch( STORE_NAME ).removeIdeaFromNewAndSavedIdeas( fixtures.draftIdeas.idea.name );

				expect( registry.stores[ STORE_NAME ].store.getState().savedIdeas ).not.toEqual(
					expect.arrayContaining( [
						fixtures.draftIdeas.idea,
					] )
				);
				expect( registry.stores[ STORE_NAME ].store.getState().newIdeas ).toEqual( [] );
			} );
		} );
	} );
} );
