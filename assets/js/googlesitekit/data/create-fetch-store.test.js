/**
 * API function to create fetch store tests.
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
import isPlainObject from 'lodash/isPlainObject';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../tests/js/utils';
import { createFetchStore } from './create-fetch-store';

const STORE_NAME = 'test/some-data';
const STORE_PARAMS = {
	baseName: 'getSomeData',
	argsToParams: ( objParam, aParam ) => {
		return {
			objParam,
			aParam,
		};
	},
	validateParams: ( { objParam, aParam } = {} ) => {
		invariant( isPlainObject( objParam ), 'objParam is required.' );
		invariant( aParam !== undefined, 'aParam is required.' );
	},
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
};

describe( 'createFetchStore store', () => {
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

		storeDefinition = createFetchStore( STORE_PARAMS );
		registry.registerStore( STORE_NAME, storeDefinition );
		dispatch = registry.dispatch( STORE_NAME );
		store = registry.stores[ STORE_NAME ].store;
		select = registry.select( STORE_NAME );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		it( 'includes the expected actions', () => {
			const fetchStoreDefinition = createFetchStore( {
				baseName: 'SaveSomeData',
				controlCallback: async () => true,
			} );

			expect( Object.keys( fetchStoreDefinition.actions ) ).toEqual( [
				'fetchSaveSomeData',
				'receiveSaveSomeData',
			] );
		} );

		describe( 'fetch', () => {
			it( 'validates parameters based on validateParams', () => {
				expect( () => {
					dispatch.fetchGetSomeData();
				} ).toThrow( 'objParam is required.' );

				expect( () => {
					dispatch.fetchGetSomeData( 123 );
				} ).toThrow( 'objParam is required.' );

				expect( () => {
					dispatch.fetchGetSomeData( {} );
				} ).toThrow( 'aParam is required.' );
			} );

			it( 'yields the expected actions for an arguments error', () => {
				const fetchStoreDefinition = createFetchStore( {
					baseName: 'SaveSomeData',
					controlCallback: async () => true,
					argsToParams: ( requiredParam ) => {
						return {
							requiredParam,
						};
					},
					validateParams: ( { requiredParam } = {} ) => {
						invariant( requiredParam, 'requiredParam is required.' );
					},
				} );

				expect( () => {
					fetchStoreDefinition.actions.fetchSaveSomeData();
				} ).toThrow( 'requiredParam is required.' );
			} );

			it( 'yields the expected actions for a success request', () => {
				const fetchStoreDefinition = createFetchStore( {
					baseName: 'SaveSomeData',
					controlCallback: async () => true,
				} );

				const action = fetchStoreDefinition.actions.fetchSaveSomeData();

				expect( action.next().value.type ).toEqual( 'START_FETCH_SAVE_SOME_DATA' );
				expect( action.next().value.type ).toEqual( 'CLEAR_ERROR' );
				expect( action.next().value.type ).toEqual( 'FETCH_SAVE_SOME_DATA' );
				expect( action.next( 42 ).value.type ).toEqual( 'RECEIVE_SAVE_SOME_DATA' );
				expect( action.next().value.type ).toEqual( 'FINISH_FETCH_SAVE_SOME_DATA' );
				expect( action.next().value ).toEqual( {
					response: 42,
					error: undefined,
				} );
			} );

			it( 'yields the expected actions for an error request', () => {
				const fetchStoreDefinition = createFetchStore( {
					baseName: 'SaveSomeData',
					controlCallback: async () => true,
				} );

				const action = fetchStoreDefinition.actions.fetchSaveSomeData();

				const error = {
					code: 'this-went-wrong',
					message: 'This went wrong.',
				};

				expect( action.next().value.type ).toEqual( 'START_FETCH_SAVE_SOME_DATA' );
				expect( action.next().value.type ).toEqual( 'CLEAR_ERROR' );
				expect( action.next().value.type ).toEqual( 'FETCH_SAVE_SOME_DATA' );
				expect( action.throw( error ).value.type ).toEqual( 'RECEIVE_ERROR' );
				expect( action.next().value.type ).toEqual( 'RECEIVE_ERROR' );
				expect( action.next().value.type ).toEqual( 'CATCH_FETCH_SAVE_SOME_DATA' );
				expect( action.next().value ).toEqual( {
					response: undefined,
					error,
				} );
			} );

			it( 'makes a network request based on controlCallback', async () => {
				const expectedResponse = 'response-value';
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/test\/data\/some-data/,
					{ body: JSON.stringify( expectedResponse ), status: 200 }
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
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/test\/data\/some-data/,
					{ body: errorResponse, status: 500 }
				);

				muteConsole( 'error' );
				const { response, error } = await dispatch.fetchGetSomeData( {}, 'value-to-key-response-by' );

				expect( error ).toEqual( errorResponse );
				expect( response ).toEqual( undefined );
				expect( store.getState().data ).toEqual( undefined );
			} );

			it( 'sets flag for request being in progress', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/test\/data\/some-data/,
					{ body: { someValue: 42 }, status: 200 }
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

		describe( 'receive', () => {
			it( 'requires params if validateParams raises an error with no params', () => {
				const validateParams = jest.fn();
				validateParams.mockImplementationOnce( () => {
					throw new Error( 'anything to require params!' );
				} );
				const fetchStoreDefinition = createFetchStore( {
					baseName: 'SaveSomeData',
					controlCallback: async () => true,
					argsToParams: ( requiredParam ) => {
						return {
							requiredParam,
						};
					},
					validateParams,
				} );
				// validateParams is called once when creating the fetch store to determine if params are required.
				expect( validateParams ).toHaveBeenCalledTimes( 1 );
				// Called with the result of argsToParams with no args.
				expect( validateParams ).toHaveBeenCalledWith( { requiredParam: undefined } );
				validateParams.mockClear();

				// Now that params are known to be required, an error will be thrown if not provided.
				expect( () => {
					const response = {};
					fetchStoreDefinition.actions.receiveSaveSomeData( response );
				} ).toThrow( 'params is required.' );
				expect( validateParams ).not.toHaveBeenCalled();

				// Does not throw `params is required.` when params is provided (other validation still applies);
				expect( () => {
					const response = {};
					const params = {};
					fetchStoreDefinition.actions.receiveSaveSomeData( response, params );
				} ).not.toThrow();
				// It only doesn't throw here because our mock function does not, but normally it would.
				expect( validateParams ).toHaveBeenCalledTimes( 1 );
				expect( validateParams ).toHaveBeenCalledWith( { requiredParam: undefined } );
			} );

			it( 'does not require params if validateParams does not throw', () => {
				const validateParams = jest.fn();
				const fetchStoreDefinition = createFetchStore( {
					baseName: 'SaveSomeData',
					controlCallback: async () => true,
					reducerCallback: ( state ) => state,
					argsToParams: () => ( {} ),
					validateParams,
				} );
				expect( validateParams ).toHaveBeenCalledTimes( 1 );
				expect( validateParams ).toHaveBeenCalledWith( {} );

				expect( () => {
					const response = {};
					fetchStoreDefinition.actions.receiveSaveSomeData( response );
				} ).not.toThrow( 'params is required.' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		it( 'includes the expected selectors', () => {
			const fetchStoreDefinition = createFetchStore( {
				baseName: 'SaveSomeData',
				controlCallback: async () => true,
			} );

			expect( Object.keys( fetchStoreDefinition.selectors ) ).toEqual( [
				'isFetchingSaveSomeData',
			] );
		} );
	} );
} );
