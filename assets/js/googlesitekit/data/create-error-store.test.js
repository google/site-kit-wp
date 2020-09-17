/**
 * Error store functions tests.
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
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	unsubscribeFromAll,
} from '../../../../tests/js/utils';
import { createErrorStore } from './create-error-store';

const STORE_NAME = 'test/some-data';
const ERROR_SAMPLE = {
	error: {
		code: 404,
		message: 'Not found',
		data: {
			status: 404,
			reason: 'not-found',
		},
	},
	baseName: 'getMock',
	args: {
		foo: 'bar',
	},
};
const ERROR_SAMPLE_2 = {
	error: {
		code: 403,
		message: 'Forbidden',
		data: {
			status: 403,
			reason: 'forbidden',
		},
	},
	baseName: 'getAccess',
	args: {
		foo: 'bar',
	},
};

describe( 'createErrorStore store', () => {
	let registry;
	let dispatch;
	let select;
	let store;
	let storeDefinition;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createRegistry();

		storeDefinition = createErrorStore();
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
		describe( 'receiveError', () => {
			it( 'requires the error param', () => {
				expect( () => {
					dispatch.receiveError();
				} ).toThrow( 'error is required.' );
			} );

			it( 'receives and sets value', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				expect( store.getState().errors[ ERROR_SAMPLE.baseName ] ).toMatchObject( ERROR_SAMPLE.error );
			} );
		} );

		describe( 'clearError', () => {
			it( 'removes an error', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				dispatch.receiveError( ERROR_SAMPLE_2.error, ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				dispatch.clearError( ERROR_SAMPLE.baseName );

				const errorObj = {};
				errorObj[ ERROR_SAMPLE_2.baseName ] = ERROR_SAMPLE_2.error;
				expect( store.getState().errors ).toMatchObject( errorObj );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getErrorForSelector', () => {
			it( 'requires a selector param', () => {
				expect( () => {
					select.getErrorForSelector();
				} ).toThrow( 'selectorName is required.' );
			} );

			it( 'returns undefined when error does not exist', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				const selectedError = select.getErrorForSelector( ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				expect( selectedError ).toBeUndefined();
			} );

			it( 'returns the required error', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				dispatch.receiveError( ERROR_SAMPLE_2.error, ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				const selectedError = select.getErrorForSelector( ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );

				expect( selectedError ).toMatchObject( ERROR_SAMPLE_2.error );
			} );
		} );

		describe( 'getErrorForAction', () => {
			it( 'requires a selector param', () => {
				expect( () => {
					select.getErrorForAction();
				} ).toThrow( 'actionName is required.' );
			} );

			it( 'returns undefined when error does not exist', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				const selectedError = select.getErrorForAction( ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				expect( selectedError ).toBeUndefined();
			} );

			it( 'returns the specified error', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				dispatch.receiveError( ERROR_SAMPLE_2.error, ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				const selectedError = select.getErrorForAction( ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );

				expect( selectedError ).toMatchObject( ERROR_SAMPLE_2.error );
			} );
		} );

		describe( 'getError', () => {
			it( 'requires a baseName param', () => {
				select.getError();

				expect( store.getState().error ).toBeUndefined();
			} );

			it( 'returns the correct error', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				dispatch.receiveError( ERROR_SAMPLE_2.error, ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );

				const error = select.getError( ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				expect( error ).toMatchObject( ERROR_SAMPLE_2.error );
			} );
		} );

		describe( 'getErrors', () => {
			it( 'returns an empty array if there are no errors', () => {
				const errors = select.getErrors();
				expect( errors ).toEqual( [] );
			} );

			it( 'checks if we have only 1 error', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				const errors = select.getErrors();
				expect( errors ).toHaveLength( 1 );
			} );

			it( 'checks if we have more than 1 error', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				dispatch.receiveError( ERROR_SAMPLE_2.error, ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				const errors = select.getErrors();
				expect( errors ).toHaveLength( 2 );
			} );

			it( 'checks if duplicate errors are removed', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				dispatch.receiveError( ERROR_SAMPLE_2.error, ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				dispatch.receiveError( ERROR_SAMPLE_2.error, ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				dispatch.receiveError( ERROR_SAMPLE_2.error, ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				const errors = select.getErrors();
				expect( errors ).toHaveLength( 2 );
			} );
		} );

		describe( 'hasErrors', () => {
			it( 'returns false if there are no errors', () => {
				expect( select.hasErrors() ).toBeFalsy();
			} );

			it( 'returns true if there are errors', () => {
				dispatch.receiveError( ERROR_SAMPLE.error, ERROR_SAMPLE.baseName, ERROR_SAMPLE.args );
				dispatch.receiveError( ERROR_SAMPLE_2.error, ERROR_SAMPLE_2.baseName, ERROR_SAMPLE_2.args );
				expect( select.hasErrors() ).toBeTruthy();
			} );
		} );
	} );
} );
