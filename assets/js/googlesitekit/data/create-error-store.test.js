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
		code: 404,
		message: 'Not found',
		data: {
			status: 404,
		},
	};

	const errorForbidden = {
		code: 403,
		message: 'Forbidden',
		data: {
			status: 403,
			reason: 'forbidden',
		},
	};

	beforeEach( () => {
		registry = createRegistry();

		storeDefinition = createErrorStore();
		registry.registerStore( STORE_NAME, storeDefinition );
		dispatch = registry.dispatch( STORE_NAME );
		store = registry.stores[ STORE_NAME ].store;
		select = registry.select( STORE_NAME );
	} );

	// Shared fixtures for various arguments by the same names.
	const baseName = 'getFoo';
	const args = [ 'bar', 'baz' ];

	describe( 'actions', () => {
		describe( 'receiveError', () => {
			it( 'requires the error param', () => {
				expect( () => {
					dispatch.receiveError();
				} ).toThrow( 'error is required.' );
			} );

			it( 'receives and sets value for an error with `baseName` only', () => {
				dispatch.receiveError( errorNotFound, baseName, [] );
				expect( store.getState().errors[ generateErrorKey( baseName, [] ) ] ).toEqual( errorNotFound );
			} );

			it( 'receives and sets value for an error with `baseName` and `args`', () => {
				dispatch.receiveError( errorNotFound, baseName, args );

				expect( store.getState().errors ).toHaveProperty(
					generateErrorKey( baseName, args ),
					errorNotFound
				);
			} );
		} );

		describe( 'clearError', () => {
			it( 'does not clear any error when called without any arguments', () => {
				dispatch.receiveError( errorForbidden, baseName, args );
				const errorsBefore = store.getState().errors;

				dispatch.clearError();

				expect( store.getState().errors ).toEqual( errorsBefore );
			} );

			it( 'requires the same `baseName` and `args` an error was received with to clear it', () => {
				dispatch.receiveError( errorForbidden, baseName, args );

				dispatch.clearError( baseName, [] );

				expect( store.getState().errors ).toHaveProperty(
					generateErrorKey( baseName, args ),
					errorForbidden
				);

				dispatch.clearError( baseName, args );

				expect( store.getState().errors ).not.toHaveProperty(
					generateErrorKey( baseName, args )
				);
			} );
		} );

		describe( 'clearErrors', () => {
			it( 'clears all received errors when called with no arguments', () => {
				dispatch.receiveError( errorNotFound );
				dispatch.receiveError( errorForbidden, baseName, [] );
				dispatch.receiveError( errorForbidden, baseName, args );

				dispatch.clearErrors();

				expect( store.getState().error ).toBeUndefined();
				expect( Object.values( store.getState().errors ) ).toEqual( [] );
			} );

			it( 'clears all received errors for a given `baseName`', () => {
				dispatch.receiveError( errorNotFound );
				dispatch.receiveError( errorForbidden, baseName, [] );
				dispatch.receiveError( errorForbidden, baseName, args );
				dispatch.receiveError( errorNotFound, 'otherBaseName', args );

				dispatch.clearErrors( baseName );

				expect( store.getState().error ).toEqual( errorNotFound );
				expect( store.getState().errors ).toHaveProperty(
					generateErrorKey( 'otherBaseName', args ),
					errorNotFound
				);
				// The store should no longer contain errorForbidden as it was the only
				// error used with the given `baseName`.
				expect( Object.values( store.getState().errors ) ).not.toContain(
					errorForbidden
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe.each( [ 'getErrorForSelector', 'getErrorForAction' ] )( '%s', ( selectorName ) => {
			const baseNameParam = selectorName === 'getErrorForSelector' ? 'selectorName' : 'actionName';

			it( `requires a \`${ baseNameParam }\` param`, () => {
				expect( () => {
					select[ selectorName ]();
				} ).toThrow( `${ baseNameParam } is required.` );
			} );

			it( `returns \`undefined\` when no has been received error for the given \`${ baseNameParam }\``, () => {
				expect( select[ selectorName ]( 'nonExistentBaseName' ) ).toBeUndefined();
			} );

			it( `returns the error for the given \`${ baseNameParam }\` with empty \`args\` or none`, () => {
				dispatch.receiveError( errorForbidden, baseName, [] );

				expect( select[ selectorName ]( baseName ) ).toEqual( errorForbidden );
				expect( select[ selectorName ]( baseName, [] ) ).toEqual( errorForbidden );
			} );

			it( `returns the error received for the given \`${ baseNameParam }\` and \`args\``, () => {
				dispatch.receiveError( errorNotFound, baseName, [] );
				dispatch.receiveError( errorForbidden, baseName, args );

				expect( select[ selectorName ]( baseName, args ) ).toEqual( errorForbidden );
			} );
		}
		);

		describe( 'getError', () => {
			describe( 'legacy argumentless behavior', () => {
				it( 'returns `undefined` if no error exists', () => {
					expect( select.getError() ).toBeUndefined();
				} );

				it( 'returns the error which was received without any `baseName` or `args`', () => {
					dispatch.receiveError( errorNotFound, baseName, [] );

					expect( select.getError() ).toBeUndefined();

					dispatch.receiveError( errorForbidden );

					expect( select.getError() ).toEqual( errorForbidden );
				} );
			} );

			it( 'returns `undefined` if no error exists for the given `baseName` and `args`', () => {
				expect( select.getError( baseName, args ) ).toBeUndefined();
			} );

			it( 'requires a `baseName` param when providing `args`', () => {
				expect( () => {
					select.getError( '', args );
				} ).toThrow( 'baseName is required.' );
			} );

			it( 'returns the error received with the same given `baseName` and `args`', () => {
				dispatch.receiveError( errorNotFound, baseName, [] );
				dispatch.receiveError( errorForbidden, baseName, args );

				expect( select.getError( baseName, [] ) ).toEqual( errorNotFound );
				expect( select.getError( baseName, args ) ).toEqual( errorForbidden );
			} );
		} );

		describe( 'getErrors', () => {
			it( 'returns an empty array when there are no errors', () => {
				expect( select.getErrors() ).toEqual( [] );
			} );

			it( 'returns an array of all errors', () => {
				dispatch.receiveError( errorNotFound, baseName, [ 'foo' ] );
				dispatch.receiveError( errorForbidden, baseName, [ 'bar' ] );

				expect( select.getErrors() ).toEqual(
					expect.arrayContaining( [ errorForbidden, errorNotFound ] )
				);
			} );

			it( 'returns a list of unique errors, regardless of `baseName` or `args`', () => {
				dispatch.receiveError( errorNotFound );
				dispatch.receiveError( errorNotFound, baseName, [] );
				dispatch.receiveError( errorNotFound, 'otherBaseName', [] );
				dispatch.receiveError( errorNotFound, baseName, [ 'foo' ] );
				dispatch.receiveError( errorNotFound, baseName, [ 'bar' ] );

				expect( select.getErrors() ).toEqual( [ errorNotFound ] );
			} );
		} );

		describe( 'hasErrors', () => {
			it( 'returns `false` if there are no errors', () => {
				expect( select.hasErrors() ).toBe( false );
			} );

			it( 'returns `true` if there are any errors', () => {
				dispatch.receiveError( errorNotFound, baseName, args );

				expect( select.hasErrors() ).toBe( true );
			} );

			it( 'returns `true` if an error was received with no arguments', () => {
				dispatch.receiveError( errorNotFound );

				expect( select.hasErrors() ).toBe( true );
			} );
		} );
	} );
} );
