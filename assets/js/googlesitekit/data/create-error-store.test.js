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
import { createErrorStore, generateErrorKey } from './create-error-store';

const STORE_NAME = 'test/some-data';

describe( 'createErrorStore store', () => {
	let registry;
	let dispatch;
	let select;
	let store;
	let storeDefinition;
	const errorNotFound = {
		error: {
			code: 404,
			message: 'Not found',
			data: {
				status: 404,
				reason: 'not-found',
			},
		},
		baseName: 'getMock',
		args: [
			{
				foo: 'bar',
			},
		],
	};
	const errorForbidden = {
		error: {
			code: 403,
			message: 'Forbidden',
			data: {
				status: 403,
				reason: 'forbidden',
			},
		},
		baseName: 'getAccess',
		args: [
			{
				foo: 'bar',
			},
		],
	};

	beforeEach( () => {
		registry = createRegistry();

		storeDefinition = createErrorStore();
		registry.registerStore( STORE_NAME, storeDefinition );
		dispatch = registry.dispatch( STORE_NAME );
		store = registry.stores[ STORE_NAME ].store;
		select = registry.select( STORE_NAME );
	} );

	describe( 'actions', () => {
		describe( 'receiveError', () => {
			it( 'requires the error param', () => {
				expect( () => {
					dispatch.receiveError();
				} ).toThrow( 'error is required.' );
			} );

			it( 'receives and sets value for an error with baseName only', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName );
				expect( store.getState().errors[ errorNotFound.baseName ] ).toEqual( errorNotFound.error );
			} );

			it( 'receives and sets value for an error with baseName and args', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName, errorNotFound.args );
				const errorKey = generateErrorKey( errorNotFound.baseName, errorNotFound.args );

				expect( store.getState().errors ).toHaveProperty( errorKey );
			} );
		} );

		describe( 'clearError', () => {
			it( 'does not clear an error if baseName and args are missing', () => {
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, errorForbidden.args );
				dispatch.clearError();

				const errorObj = {
					[ generateErrorKey( errorForbidden.baseName, errorForbidden.args ) ]: errorForbidden.error,
				};
				expect( store.getState().errors ).toEqual( errorObj );
			} );

			it( 'does not clear an error if args is missing when error has been created with args', () => {
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, errorForbidden.args );
				const errorsState = store.getState().errors;
				dispatch.clearError( errorForbidden.baseName );

				expect( store.getState().errors ).toEqual( errorsState );
			} );

			it( 'removes an error', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName, errorNotFound.args );
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, errorForbidden.args );
				dispatch.clearError( errorNotFound.baseName, errorNotFound.args );

				const errorObj = {
					[ generateErrorKey( errorForbidden.baseName, errorForbidden.args ) ]: errorForbidden.error,
				};
				expect( store.getState().errors ).toEqual( errorObj );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe.each( [ 'getErrorForSelector', 'getErrorForAction' ] )( '%s', ( selectorName ) => {
			const baseNameParam = selectorName === 'getErrorForSelector' ? 'selectorName' : 'actionName';

			it( `requires a ${ baseNameParam } param`, () => {
				expect( () => {
					select[ selectorName ]();
				} ).toThrow( `${ baseNameParam } is required.` );
			} );

			it( 'returns undefined when error does not exist', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName );
				const selectedError = select[ selectorName ]( 'nonExistentBaseName' );
				expect( selectedError ).toBeUndefined();
			} );

			it( 'returns the error for the given selector name with empty args', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName, errorNotFound.args );
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, [] );
				const selectedError = select[ selectorName ]( errorForbidden.baseName );

				expect( selectedError ).toEqual( errorForbidden.error );
			} );

			it( 'returns the error for the given selector name with args', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName, errorNotFound.args );
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, errorForbidden.args );
				const selectedError = select[ selectorName ]( errorForbidden.baseName, errorForbidden.args );

				expect( selectedError ).toEqual( errorForbidden.error );
			} );
		} );

		describe( 'getError', () => {
			it( 'requires a baseName and args param', () => {
				select.getError();

				expect( store.getState().error ).toBeUndefined();
			} );

			it( 'requires an baseName param', () => {
				expect( () => {
					select.getError( false, [ { foo: 'bar' } ] );
				} ).toThrow( 'baseName is required.' );
			} );

			it( 'requires an args param', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName, errorNotFound.args );
				select.getError( 'nonExistentBaseName' );

				expect( store.getState().error ).toBeUndefined();
			} );

			it( 'returns the appropriate error with baseName and args', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName, errorNotFound.args );
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, errorForbidden.args );

				const error = select.getError( errorForbidden.baseName, errorForbidden.args );
				expect( error ).toEqual( errorForbidden.error );
			} );
		} );

		describe( 'getErrors', () => {
			it( 'returns an empty array if there are no errors', () => {
				const errors = select.getErrors();
				expect( errors ).toEqual( [] );
			} );

			it( 'checks if we have only 1 error', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName, errorNotFound.args );
				const errors = select.getErrors();

				expect( errors ).toEqual( [ errorNotFound.error ] );
			} );

			it( 'checks if we have more than 1 error', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName, errorNotFound.args );
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, errorForbidden.args );
				const errors = select.getErrors();
				expect( errors ).toEqual( expect.arrayContaining( [ errorNotFound.error, errorForbidden.error ] ) );
			} );

			it( 'checks if duplicate errors are removed', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName, errorNotFound.args );
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, [ { foo: 'bar' } ] );
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, [ { waldo: 'fred' } ] );
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, [ { quux: 'quuz' } ] );
				const errors = select.getErrors();

				expect( errors ).toEqual( [ errorNotFound.error, errorForbidden.error ] );
			} );
		} );

		describe( 'hasErrors', () => {
			it( 'returns false if there are no errors', () => {
				expect( select.hasErrors() ).toBe( false );
			} );

			it( 'returns true if there are any errors', () => {
				dispatch.receiveError( errorNotFound.error, errorNotFound.baseName, errorNotFound.args );
				dispatch.receiveError( errorForbidden.error, errorForbidden.baseName, errorForbidden.args );
				expect( select.hasErrors() ).toBe( true );
			} );
		} );
	} );
} );
