/**
 * Error store functions tests.
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
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { createErrorStore, generateErrorKey } from './create-error-store';

const TEST_STORE = 'test/some-data';

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

		storeDefinition = createErrorStore( TEST_STORE );
		registry.registerStore( TEST_STORE, storeDefinition );
		dispatch = registry.dispatch( TEST_STORE );
		store = registry.stores[ TEST_STORE ].store;
		select = registry.select( TEST_STORE );
	} );

	// Shared fixtures for various arguments by the same names.
	const baseName = 'getFoo';
	const args = [ 'bar', 'baz' ];

	describe( 'createErrorStore', () => {
		it( 'requires a storeName argument', () => {
			expect( () => {
				createErrorStore();
			} ).toThrow( 'storeName must be defined.' );
		} );

		it( 'does not error when storeName is provided', () => {
			expect( () => {
				createErrorStore( TEST_STORE );
			} ).not.toThrow();
		} );
	} );

	describe( 'actions', () => {
		describe( 'receiveError', () => {
			it( 'requires the error param', () => {
				expect( () => {
					dispatch.receiveError();
				} ).toThrow( 'error is required.' );
			} );

			it( 'receives and sets value for an error with `baseName` only', () => {
				dispatch.receiveError( errorNotFound, baseName, [] );
				expect(
					store.getState().errors[ generateErrorKey( baseName, [] ) ]
				).toEqual( errorNotFound );
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
				dispatch.receiveError( errorNotFound, baseName );
				dispatch.receiveError( errorForbidden, baseName, [] );
				dispatch.receiveError( errorForbidden, baseName, args );

				dispatch.clearErrors();

				expect( store.getState().error ).toBeUndefined();
				expect( Object.values( store.getState().errors ) ).toEqual(
					[]
				);
			} );

			it( 'clears all received errors for a given `baseName`', () => {
				dispatch.receiveError( errorNotFound, baseName );
				dispatch.receiveError( errorForbidden, baseName, [] );
				dispatch.receiveError( errorForbidden, baseName, args );
				dispatch.receiveError( errorNotFound, 'otherBaseName', args );

				dispatch.clearErrors( baseName );

				expect( store.getState().errors ).toHaveProperty(
					generateErrorKey( 'otherBaseName', args ),
					errorNotFound
				);
				// The store should no longer contain errorForbidden as it was the only
				// error used with the given `baseName`.
				expect(
					Object.values( store.getState().errors )
				).not.toContain( errorForbidden );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getErrorForSelector', () => {
			it( 'requires a `selectorName` param', () => {
				expect( () => {
					select.getErrorForSelector();
				} ).toThrow( 'selectorName is required.' );
			} );

			it( 'returns `undefined` when no has been received error for the given `selectorName`', () => {
				expect(
					select.getErrorForSelector( 'nonExistentBaseName' )
				).toBeUndefined();
			} );

			it( 'returns the error for the given `selectorName` with empty `args` or none', () => {
				dispatch.receiveError( errorForbidden, baseName, [] );

				expect( select.getErrorForSelector( baseName ) ).toEqual(
					errorForbidden
				);
				expect( select.getErrorForSelector( baseName, [] ) ).toEqual(
					errorForbidden
				);
			} );

			it( 'returns the error received for the given `selectorName` and `args`', () => {
				dispatch.receiveError( errorNotFound, baseName, [] );
				dispatch.receiveError( errorForbidden, baseName, args );

				expect( select.getErrorForSelector( baseName, args ) ).toEqual(
					errorForbidden
				);
			} );
		} );

		describe( 'getErrorForAction', () => {
			it( 'requires a `actionName` param', () => {
				expect( () => {
					select.getErrorForAction();
				} ).toThrow( 'actionName is required.' );
			} );

			it( 'returns `undefined` when no has been received error for the given `actionName`', () => {
				expect(
					select.getErrorForAction( 'nonExistentBaseName' )
				).toBeUndefined();
			} );

			it( 'returns the error for the given `actionName` with empty `args` or none', () => {
				dispatch.receiveError( errorForbidden, baseName, [] );

				expect( select.getErrorForAction( baseName ) ).toEqual(
					errorForbidden
				);
				expect( select.getErrorForAction( baseName, [] ) ).toEqual(
					errorForbidden
				);
			} );

			it( 'returns the error received for the given `actionName` and `args`', () => {
				dispatch.receiveError( errorNotFound, baseName, [] );
				dispatch.receiveError( errorForbidden, baseName, args );

				expect( select.getErrorForAction( baseName, args ) ).toEqual(
					errorForbidden
				);
			} );
		} );

		describe( 'getError', () => {
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

				expect( select.getError( baseName, [] ) ).toEqual(
					errorNotFound
				);
				expect( select.getError( baseName, args ) ).toEqual(
					errorForbidden
				);
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

			it( 'returns a list of unique errors, regardless of `args`', () => {
				dispatch.receiveError( errorNotFound, baseName );
				dispatch.receiveError( errorNotFound, baseName, [] );
				dispatch.receiveError( errorNotFound, 'otherBaseName', [] );
				dispatch.receiveError( errorNotFound, baseName, [ 'foo' ] );
				dispatch.receiveError( errorNotFound, baseName, [ 'bar' ] );

				expect( select.getErrors() ).toEqual( [ errorNotFound ] );
			} );
		} );

		describe( 'getMetaDataForError', () => {
			it( 'returns null when there is no meta-data found for the error', () => {
				dispatch.receiveError( errorNotFound, baseName, args );

				expect( select.getMetaDataForError( errorForbidden ) ).toEqual(
					null
				);
			} );

			it( 'returns the meta-data for an error object', () => {
				// Populate multiple errors to verify the we're correctly looking up the error.
				dispatch.receiveError( errorNotFound, baseName, [ 'foo' ] );
				dispatch.receiveError( errorForbidden, 'otherBasename', [
					'bar',
				] );

				expect( select.getMetaDataForError( errorNotFound ) ).toEqual( {
					baseName,
					args: [ 'foo' ],
				} );
			} );
		} );

		describe( 'getSelectorDataForError', () => {
			beforeEach( () => {
				registry = createRegistry();

				storeDefinition = Data.combineStores(
					{
						selectors: {
							getFoo: () => 'some-data',
						},
					},
					createErrorStore( TEST_STORE )
				);
				registry.registerStore( TEST_STORE, storeDefinition );
				dispatch = registry.dispatch( TEST_STORE );
				store = registry.stores[ TEST_STORE ].store;
				select = registry.select( TEST_STORE );
			} );

			it( 'returns null when there is no meta-data found for the error', () => {
				dispatch.receiveError( errorNotFound, baseName, args );

				expect(
					select.getSelectorDataForError( errorForbidden )
				).toEqual( null );
			} );

			it( 'returns null when there is no selector found for the error', () => {
				dispatch.receiveError( errorNotFound, 'getBar', args );

				expect(
					select.getSelectorDataForError( errorNotFound )
				).toEqual( null );
			} );

			it( 'returns the selector data for an error object', () => {
				// Populate multiple errors to verify the we're correctly looking up the error.
				dispatch.receiveError( errorNotFound, baseName, [ 'foo' ] );
				dispatch.receiveError( errorForbidden, 'getBar', [ 'bar' ] );

				expect(
					select.getSelectorDataForError( errorNotFound )
				).toEqual( {
					storeName: TEST_STORE,
					name: baseName,
					args: [ 'foo' ],
				} );
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
		} );
	} );
} );
