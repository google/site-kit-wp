/**
 * `modules/idea-hub` data store: idea-state tests.
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
import { enabledFeatures } from '../../../features';

describe( 'modules/idea-hub idea-state', () => {
	let registry;

	const ideaStateFixture = {
		name: 'ideas/7612031899179595408',
		saved: false,
		dismissed: false,
	};

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
		describe( 'updateIdeaState', () => {
			it( "updates a given idea's state", async () => {
				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/update-idea-state/,
					{ body: ideaStateFixture }
				);
				const { response } = await registry.dispatch( STORE_NAME ).updateIdeaState( ideaStateFixture );

				expect( response ).toEqual( ideaStateFixture );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/update-idea-state/,
					{ body: errorResponse, status: 500 }
				);

				const { response, error } = await registry.dispatch( STORE_NAME ).updateIdeaState( ideaStateFixture );
				expect( console ).toHaveErrored();
				expect( error ).toEqual( errorResponse );
				expect( response ).toEqual( undefined );
			} );
		} );

		describe( 'saveIdea', () => {
			it( "updates a given idea's `saved` state to true", async () => {
				const updatedIdeaState = {
					...ideaStateFixture,
					saved: true,
				};

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/update-idea-state/,
					{ body: updatedIdeaState, status: 200 },
				);

				const { response } = await registry.dispatch( STORE_NAME ).saveIdea( ideaStateFixture.name );

				expect( response.saved ).toEqual( true );
			} );
		} );

		describe( 'unsaveIdea', () => {
			it( "updates a given idea's `saved` state to false", async () => {
				const updatedIdeaState = {
					...ideaStateFixture,
					saved: false,
				};

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/update-idea-state/,
					{ body: updatedIdeaState, status: 200 },
				);

				const { response } = await registry.dispatch( STORE_NAME ).unsaveIdea( ideaStateFixture.name );

				expect( response.saved ).toEqual( false );
			} );
		} );

		describe( 'dismissIdea', () => {
			it( "updates a given idea's `dismissed` state to true", async () => {
				const updatedIdeaState = {
					...ideaStateFixture,
					dismissed: true,
				};

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/update-idea-state/,
					{ body: updatedIdeaState },
				);

				const { response } = await registry.dispatch( STORE_NAME ).dismissIdea( ideaStateFixture.name );

				expect( response.dismissed ).toEqual( true );
			} );
		} );

		describe( 'Activities', () => {
			it( 'sets and removes different values for different activity keys', async () => {
				expect( registry.stores[ STORE_NAME ].store.getState().activities ).toEqual( {} );

				registry.dispatch( STORE_NAME ).setActivity( 'foo', 'bar' );

				expect( registry.stores[ STORE_NAME ].store.getState().activities ).toEqual( { foo: 'bar' } );

				registry.dispatch( STORE_NAME ).setActivity( 'bar', 'baz' );

				expect( registry.stores[ STORE_NAME ].store.getState().activities ).toEqual( { foo: 'bar', bar: 'baz' } );

				registry.dispatch( STORE_NAME ).removeActivity( 'bar' );

				expect( registry.stores[ STORE_NAME ].store.getState().activities ).toEqual( { foo: 'bar' } );

				registry.dispatch( STORE_NAME ).setActivity( 'bar', 'baz' );

				expect( registry.stores[ STORE_NAME ].store.getState().activities ).toEqual( { foo: 'bar', bar: 'baz' } );

				registry.dispatch( STORE_NAME ).removeActivity( 'foo' );

				expect( registry.stores[ STORE_NAME ].store.getState().activities ).toEqual( { bar: 'baz' } );
			} );
		} );
	} );
} );

