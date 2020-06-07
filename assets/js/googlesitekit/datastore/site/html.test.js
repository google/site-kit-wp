/**
 * core/site data store: HTML for URL tests.
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
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import { STORE_NAME } from './constants';

describe( 'core/site html', () => {
	let apiFetchSpy;
	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'actions', () => {
		describe( 'fetchHTMLForURL', () => {
			it( 'sets isFetchingHTML while fetching HTML then sets back to false', async () => {
				const html = '<html><head><title>Example HTML</title></head><body><h1>Example HTML H1</h1></body></html>';
				const url = 'https://example.com';
				// TODO Use fetch-mock-jest with proper matcher once 1477 is merged.
				fetch
					.doMockOnceIf(
						url
					)
					.mockResponseOnce(
						html,
						{ status: 200 }
					);
				registry.dispatch( STORE_NAME ).fetchHTMLForURL( url );
				expect( store.getState().isFetchingHTML[ url ] ).toEqual( true );
				await subscribeUntil( registry,
					// TODO: Add selector for getting these values.
					() => store.getState().isFetchingHTML[ url ] === false,
				);
				const selectedHTML = registry.select( STORE_NAME ).getHTMLForURL( url );
				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( selectedHTML ).toEqual( html );
				expect( store.getState().isFetchingHTML[ url ] ).toEqual( false );
			} );
		} );

		describe( 'invalidateHTMLForURL', () => {
			it( 'invalidates the resolver for getHTMLForURL', async () => {
				const html = '<html><head><title>Example HTML</title></head><body><h1>Example HTML H1</h1></body></html>';
				const url = 'https://example.com';
				registry.dispatch( STORE_NAME ).receiveHTMLForURL( html, url );
				registry.select( STORE_NAME ).getHTMLForURL( url );

				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getHTMLForURL', [ url ] )
				);

				registry.dispatch( STORE_NAME ).invalidateHTMLForURL( url );

				expect( registry.select( STORE_NAME ).hasFinishedResolution( 'getHTMLForURL', [ url ] ) ).toStrictEqual( false );
			} );
		} );

		describe( 'receiveHTMLForURL', () => {
			it( 'requires the htmlForURL param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveHTMLForURL();
				} ).toThrow( 'html for URL is required.' );
			} );

			it( 'receives and sets HTML for a URL ', async () => {
				const html = '<html><head><title>Example HTML</title></head><body><h1>Example HTML H1</h1></body></html>';
				const url = 'https://example.com';
				await registry.dispatch( STORE_NAME ).receiveHTMLForURL( html, url );
				const state = store.getState();
				expect( state.html[ url ] ).toBe( html );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getHTMLForURL', () => {
			it( 'uses a resolver to make a network request', async () => {
				const html = '<html><head><title>Example HTML</title></head><body><h1>Example HTML H1</h1></body></html>';
				const url = 'https://example.com';

				// TODO Use fetch-mock-jest with proper matcher once 1477 is merged.
				fetch
					.doMockOnceIf(
						url
					)
					.mockResponseOnce(
						html,
						{ status: 200 }
					);

				const initialHTML = registry.select( STORE_NAME ).getHTMLForURL( url );
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialHTML ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getHTMLForURL( url ) !== undefined
					),
				);

				const selectedHTML = registry.select( STORE_NAME ).getHTMLForURL( url );

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( selectedHTML ).toEqual( html );
			} );

			it( 'does not make a network request if data is already in state', async () => {
				const html = '<html><head><title>Example HTML</title></head><body><h1>Example HTML H1</h1></body></html>';
				const url = 'https://example.com';
				registry.dispatch( STORE_NAME ).receiveHTMLForURL( html, url );

				const selectedHTML = registry.select( STORE_NAME ).getHTMLForURL( url );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getHTMLForURL', [ url ] )
				);

				expect( fetch ).not.toHaveBeenCalled();
				expect( selectedHTML ).toEqual( html );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const url = 'https://example.com';
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				// TODO Use fetch-mock-jest with proper matcher once 1477 is merged.
				fetch
					.doMockOnceIf(
						url
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				// muteConsole( 'error' );
				registry.select( STORE_NAME ).getHTMLForURL( url );
				await subscribeUntil( registry,
					// TODO: Add selector for getting these values.
					() => store.getState().isFetchingHTML[ url ] === false,
				);

				const selectedHTML = registry.select( STORE_NAME ).getHTMLForURL( url );

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( selectedHTML ).toEqual( undefined );
			} );
		} );
	} );
} );
