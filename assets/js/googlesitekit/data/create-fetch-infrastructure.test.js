/**
 * API function to create fetch infrastructure tests.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import { createFetchInfrastructure } from './create-fetch-infrastructure';

const STORE_NAME = 'test/some-data';
const STORE_PARAMS = {
	baseName: 'getSomeData',
	controlCallback: ( params ) => {
		const { aParam, objParam } = params;
		return API.get( 'core', 'test', 'some-data', {
			aParam,
			objParam,
		} );
	},
	reducerCallback: ( state, response, params ) => {
		const { aParam } = params;
		return {
			...state,
			data: {
				...( state.data || {} ),
				[ aParam ]: response,
			},
		};
	},
	keyParams: {
		objParam: ( value ) => 'object' === typeof value,
		aParam: ( value ) => 'undefined' !== typeof value,
	},
};

describe( 'createFetchInfrastructure store', () => {
	let apiFetchSpy;
	let dispatch;
	let registry;
	let select;
	let storeDefinition;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createRegistry();

		storeDefinition = createFetchInfrastructure( STORE_PARAMS );
		registry.registerStore( STORE_NAME, storeDefinition );
		dispatch = registry.dispatch( STORE_NAME );
		store = registry.stores[ STORE_NAME ].store;
		select = registry.select( STORE_NAME );

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
		it( 'includes the expected actions', () => {
			const fetchStoreDefinition = createFetchInfrastructure( {
				baseName: 'SaveSomeData',
				controlCallback: async () => true,
				reducerCallback: ( state ) => state,
			} );

			expect( Object.keys( fetchStoreDefinition.actions ) ).toEqual( [
				'fetchSaveSomeData',
				'receiveSaveSomeData',
			] );
		} );

		describe( 'fetch', () => {
			it( 'validates parameters based on keyParams', () => {
				const consoleErrorSpy = jest.spyOn( global.console, 'error' );

				dispatch.fetchGetSomeData();
				expect( consoleErrorSpy ).toHaveBeenCalledWith( 'objParam is required.' );

				dispatch.fetchGetSomeData( 123 );
				expect( consoleErrorSpy ).toHaveBeenCalledWith( 'objParam is required.' );

				dispatch.fetchGetSomeData( {} );
				expect( consoleErrorSpy ).toHaveBeenCalledWith( 'aParam is required.' );

				consoleErrorSpy.mockClear();
			} );

			it( 'yields the expected actions for an arguments error', () => {
				const fetchStoreDefinition = createFetchInfrastructure( {
					baseName: 'SaveSomeData',
					controlCallback: async () => true,
					reducerCallback: ( state ) => state,
					keyParams: { requiredParam: ( value ) => value },
				} );

				const action = fetchStoreDefinition.actions.fetchSaveSomeData();

				// Catch invariant to get exactly the error we expect.
				let error;
				try {
					invariant( false, 'requiredParam is required.' );
				} catch ( err ) {
					error = err;
				}

				expect( action.next().value ).toEqual( {
					response: undefined,
					error,
				} );
			} );

			it( 'yields the expected actions for a success request', () => {
				const fetchStoreDefinition = createFetchInfrastructure( {
					baseName: 'SaveSomeData',
					controlCallback: async () => true,
					reducerCallback: ( state ) => state,
				} );

				const action = fetchStoreDefinition.actions.fetchSaveSomeData();

				expect( action.next().value.type ).toEqual( 'START_FETCH_SAVE_SOME_DATA' );
				expect( action.next().value.type ).toEqual( 'FETCH_SAVE_SOME_DATA' );
				expect( action.next( 42 ).value.type ).toEqual( 'RECEIVE_SAVE_SOME_DATA' );
				expect( action.next().value.type ).toEqual( 'FINISH_FETCH_SAVE_SOME_DATA' );
				expect( action.next().value ).toEqual( {
					response: 42,
					error: undefined,
				} );
			} );

			it( 'yields the expected actions for an error request', () => {
				const fetchStoreDefinition = createFetchInfrastructure( {
					baseName: 'SaveSomeData',
					controlCallback: async () => true,
					reducerCallback: ( state ) => state,
				} );

				const action = fetchStoreDefinition.actions.fetchSaveSomeData();

				const error = {
					code: 'this-went-wrong',
					message: 'This went wrong.',
				};

				expect( action.next().value.type ).toEqual( 'START_FETCH_SAVE_SOME_DATA' );
				expect( action.next().value.type ).toEqual( 'FETCH_SAVE_SOME_DATA' );
				expect( action.throw( error ).value.type ).toEqual( 'CATCH_FETCH_SAVE_SOME_DATA' );
				expect( action.next().value ).toEqual( {
					response: undefined,
					error,
				} );
			} );

			it( 'makes a network request based on controlCallback', async () => {
				const expectedResponse = 'response-value';
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/test\/data\/some-data/
					)
					.mockResponseOnce(
						JSON.stringify( expectedResponse ),
						{ status: 200 }
					);

				const { response, error } = await dispatch.fetchGetSomeData( {}, 'value-to-key-response-by' );

				expect( error ).toEqual( undefined );
				expect( response ).toEqual( expectedResponse );
				expect( store.getState().data ).toEqual( {
					'value-to-key-response-by': expectedResponse,
				} );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/test\/data\/some-data/
					)
					.mockResponseOnce(
						JSON.stringify( errorResponse ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				const { response, error } = await dispatch.fetchGetSomeData( {}, 'value-to-key-response-by' );

				expect( error ).toEqual( errorResponse );
				expect( response ).toEqual( undefined );
				expect( store.getState().data ).toEqual( undefined );
			} );

			it( 'sets flag for request being in progress', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/test\/data\/some-data/
					)
					.mockResponseOnce(
						JSON.stringify( { someValue: 42 } ),
						{ status: 200 }
					);

				const requestArgs = [ {}, 'aValue' ];

				// Initially the request is not in progress..
				expect( select.isFetchingGetSomeData( ...requestArgs ) ).toEqual( false );

				dispatch.fetchGetSomeData( ...requestArgs );

				// Now it should be in progress.
				expect( select.isFetchingGetSomeData( ...requestArgs ) ).toEqual( true );

				// A request for other arguments however is not in progress.
				expect( select.isFetchingGetSomeData( {}, 'anotherValue' ) ).toEqual( false );

				await subscribeUntil( registry,
					() => store.getState().data !== undefined,
				);

				// As the data has been received, the request is now no longer in progress.
				expect( select.isFetchingGetSomeData( ...requestArgs ) ).toEqual( false );
			} );
		} );
	} );

	describe( 'selectors', () => {
		it( 'includes the expected selectors', () => {
			const fetchStoreDefinition = createFetchInfrastructure( {
				baseName: 'SaveSomeData',
				controlCallback: async () => true,
				reducerCallback: ( state ) => state,
			} );

			expect( Object.keys( fetchStoreDefinition.selectors ) ).toEqual( [
				'isFetchingSaveSomeData',
			] );
		} );
	} );
} );
