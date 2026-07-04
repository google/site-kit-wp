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
import { combineStores } from 'googlesitekit-data';
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
		describe( 'setErrorForSelector', () => {
			it( 'requires the error param', () => {
				expect( () => {
					dispatch.setErrorForSelector();
				} ).toThrow( 'error is required.' );
			} );

			it( 'requires the selectorName param', () => {
				expect( () => {
					dispatch.setErrorForSelector( errorNotFound );
				} ).toThrow( 'selectorName is required.' );
			} );

			it( 'receives and sets value for an error with `baseName` only', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName, [] );
				expect(
					store.getState().selectorErrors[
						generateErrorKey( baseName, [] )
					]
				).toEqual( errorNotFound );
			} );

			it( 'receives and sets value for an error with `baseName` and `args`', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName, args );

				expect( store.getState().selectorErrors ).toHaveProperty(
					generateErrorKey( baseName, args ),
					errorNotFound
				);
			} );
		} );

		describe( 'setErrorForAction', () => {
			it( 'requires the error param', () => {
				expect( () => {
					dispatch.setErrorForAction();
				} ).toThrow( 'error is required.' );
			} );

			it( 'requires the actionName param', () => {
				expect( () => {
					dispatch.setErrorForAction( errorNotFound );
				} ).toThrow( 'actionName is required.' );
			} );

			it( 'receives and sets value for an error with `baseName` only', () => {
				dispatch.setErrorForAction( errorNotFound, baseName, [] );
				expect(
					store.getState().actionErrors[
						generateErrorKey( baseName, [] )
					]
				).toEqual( errorNotFound );
			} );

			it( 'receives and sets value for an error with `baseName` and `args`', () => {
				dispatch.setErrorForAction( errorNotFound, baseName, args );

				expect( store.getState().actionErrors ).toHaveProperty(
					generateErrorKey( baseName, args ),
					errorNotFound
				);
			} );
		} );

		describe( 'clearSelectorError', () => {
			it( 'requires the selectorName param', () => {
				dispatch.setErrorForSelector( errorForbidden, baseName, args );

				expect( () => {
					dispatch.clearSelectorError();
				} ).toThrow( 'selectorName is required.' );
			} );

			it( 'requires the args param to be an array', () => {
				dispatch.setErrorForSelector( errorForbidden, baseName, args );

				expect( () => {
					dispatch.clearSelectorError( baseName, null );
				} ).toThrow( 'args must be an array.' );
			} );

			it( 'does not clear the error when called without selectorName param', () => {
				dispatch.setErrorForSelector( errorForbidden, baseName, args );
				const selectorErrorsBefore = store.getState().selectorErrors;

				expect( () => {
					dispatch.clearSelectorError();
				} ).toThrow();

				expect( store.getState().selectorErrors ).toEqual(
					selectorErrorsBefore
				);
			} );

			it( 'requires the same `baseName` and `args` an error was received with to clear it', () => {
				dispatch.setErrorForSelector( errorForbidden, baseName, args );

				dispatch.clearSelectorError( baseName, [] );

				expect( store.getState().selectorErrors ).toHaveProperty(
					generateErrorKey( baseName, args ),
					errorForbidden
				);

				dispatch.clearSelectorError( baseName, args );

				expect( store.getState().selectorErrors ).not.toHaveProperty(
					generateErrorKey( baseName, args )
				);
			} );

			it( 'only clears from the selector slice, not the action slice', () => {
				dispatch.setErrorForSelector( errorForbidden, baseName, args );
				dispatch.setErrorForAction( errorNotFound, baseName, args );

				dispatch.clearSelectorError( baseName, args );

				expect( store.getState().selectorErrors ).not.toHaveProperty(
					generateErrorKey( baseName, args )
				);
				expect( store.getState().actionErrors ).toHaveProperty(
					generateErrorKey( baseName, args ),
					errorNotFound
				);
			} );
		} );

		describe( 'clearActionError', () => {
			it( 'requires the actionName param', () => {
				dispatch.setErrorForAction( errorForbidden, baseName, args );

				expect( () => {
					dispatch.clearActionError();
				} ).toThrow( 'actionName is required.' );
			} );

			it( 'requires the args param to be an array', () => {
				dispatch.setErrorForAction( errorForbidden, baseName, args );

				expect( () => {
					dispatch.clearActionError( baseName, null );
				} ).toThrow( 'args must be an array.' );
			} );

			it( 'requires the same `baseName` and `args` an error was received with to clear it', () => {
				dispatch.setErrorForAction( errorForbidden, baseName, args );

				dispatch.clearActionError( baseName, [] );

				expect( store.getState().actionErrors ).toHaveProperty(
					generateErrorKey( baseName, args ),
					errorForbidden
				);

				dispatch.clearActionError( baseName, args );

				expect( store.getState().actionErrors ).not.toHaveProperty(
					generateErrorKey( baseName, args )
				);
			} );

			it( 'only clears from the action slice, not the selector slice', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName, args );
				dispatch.setErrorForAction( errorForbidden, baseName, args );

				dispatch.clearActionError( baseName, args );

				expect( store.getState().actionErrors ).not.toHaveProperty(
					generateErrorKey( baseName, args )
				);
				expect( store.getState().selectorErrors ).toHaveProperty(
					generateErrorKey( baseName, args ),
					errorNotFound
				);
			} );
		} );

		describe( 'clearSelectorErrors', () => {
			it( 'clears all selector errors when called with no arguments', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName );
				dispatch.setErrorForSelector( errorForbidden, baseName, [] );
				dispatch.setErrorForSelector( errorForbidden, baseName, args );

				dispatch.clearSelectorErrors();

				expect(
					Object.values( store.getState().selectorErrors )
				).toEqual( [] );
			} );

			it( 'clears all selector errors for a given `baseName`', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName );
				dispatch.setErrorForSelector( errorForbidden, baseName, [] );
				dispatch.setErrorForSelector( errorForbidden, baseName, args );
				dispatch.setErrorForSelector(
					errorNotFound,
					'otherBaseName',
					args
				);

				dispatch.clearSelectorErrors( baseName );

				expect( store.getState().selectorErrors ).toHaveProperty(
					generateErrorKey( 'otherBaseName', args ),
					errorNotFound
				);
				expect(
					Object.values( store.getState().selectorErrors )
				).not.toContain( errorForbidden );
			} );

			it( 'does not affect the action error slice', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName, [] );
				dispatch.setErrorForAction( errorForbidden, baseName, args );

				dispatch.clearSelectorErrors();

				expect(
					Object.values( store.getState().selectorErrors )
				).toEqual( [] );
				expect(
					Object.values( store.getState().actionErrors )
				).toContain( errorForbidden );
			} );
		} );

		describe( 'clearActionErrors', () => {
			it( 'clears all action errors when called with no arguments', () => {
				dispatch.setErrorForAction( errorNotFound, baseName );
				dispatch.setErrorForAction( errorForbidden, baseName, args );

				dispatch.clearActionErrors();

				expect(
					Object.values( store.getState().actionErrors )
				).toEqual( [] );
			} );

			it( 'clears all action errors for a given `baseName`', () => {
				dispatch.setErrorForAction( errorNotFound, baseName );
				dispatch.setErrorForAction( errorForbidden, baseName, args );
				dispatch.setErrorForAction(
					errorNotFound,
					'otherBaseName',
					args
				);

				dispatch.clearActionErrors( baseName );

				expect( store.getState().actionErrors ).toHaveProperty(
					generateErrorKey( 'otherBaseName', args ),
					errorNotFound
				);
				expect(
					Object.values( store.getState().actionErrors )
				).not.toContain( errorForbidden );
			} );

			it( 'does not affect the selector error slice', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName, [] );
				dispatch.setErrorForAction( errorForbidden, baseName, args );

				dispatch.clearActionErrors();

				expect(
					Object.values( store.getState().actionErrors )
				).toEqual( [] );
				expect(
					Object.values( store.getState().selectorErrors )
				).toContain( errorNotFound );
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
				dispatch.setErrorForSelector( errorForbidden, baseName, [] );

				expect( select.getErrorForSelector( baseName ) ).toEqual(
					errorForbidden
				);
				expect( select.getErrorForSelector( baseName, [] ) ).toEqual(
					errorForbidden
				);
			} );

			it( 'returns the error received for the given `selectorName` and `args`', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName, [] );
				dispatch.setErrorForSelector( errorForbidden, baseName, args );

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
				dispatch.setErrorForAction( errorForbidden, baseName, [] );

				expect( select.getErrorForAction( baseName ) ).toEqual(
					errorForbidden
				);
				expect( select.getErrorForAction( baseName, [] ) ).toEqual(
					errorForbidden
				);
			} );

			it( 'returns the error received for the given `actionName` and `args`', () => {
				dispatch.setErrorForAction( errorNotFound, baseName, [] );
				dispatch.setErrorForAction( errorForbidden, baseName, args );

				expect( select.getErrorForAction( baseName, args ) ).toEqual(
					errorForbidden
				);
			} );
		} );

		describe( 'getErrors', () => {
			it( 'returns an empty array when there are no errors', () => {
				expect( select.getErrors() ).toEqual( [] );
			} );

			it( 'returns an array of all errors', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName, [
					'foo',
				] );
				dispatch.setErrorForSelector( errorForbidden, baseName, [
					'bar',
				] );

				expect( select.getErrors() ).toEqual(
					expect.arrayContaining( [ errorForbidden, errorNotFound ] )
				);
			} );

			it( 'returns a list of unique errors, regardless of `args`', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName );
				dispatch.setErrorForSelector( errorNotFound, baseName, [] );
				dispatch.setErrorForSelector(
					errorNotFound,
					'otherBaseName',
					[]
				);
				dispatch.setErrorForSelector( errorNotFound, baseName, [
					'foo',
				] );
				dispatch.setErrorForSelector( errorNotFound, baseName, [
					'bar',
				] );

				expect( select.getErrors() ).toEqual( [ errorNotFound ] );
			} );

			it( 'merges errors from both selector and action slices', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName, [
					'foo',
				] );
				dispatch.setErrorForAction( errorForbidden, 'doBar', [
					'baz',
				] );

				expect( select.getErrors() ).toEqual(
					expect.arrayContaining( [ errorNotFound, errorForbidden ] )
				);
			} );
		} );

		describe( 'getMetaDataForSelectorError', () => {
			it( 'returns null when there is no meta-data found for the error', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName, args );

				expect(
					select.getMetaDataForSelectorError( errorForbidden )
				).toEqual( null );
			} );

			it( 'returns null when the error is an action error, not a selector error', () => {
				dispatch.setErrorForAction( errorForbidden, baseName, args );

				expect(
					select.getMetaDataForSelectorError( errorForbidden )
				).toEqual( null );
			} );

			it( 'returns the meta-data for a selector error object', () => {
				// Populate multiple errors to verify we're correctly looking up the error.
				dispatch.setErrorForSelector( errorNotFound, baseName, [
					'foo',
				] );
				dispatch.setErrorForSelector( errorForbidden, 'otherBasename', [
					'bar',
				] );

				expect(
					select.getMetaDataForSelectorError( errorNotFound )
				).toEqual( {
					baseName,
					args: [ 'foo' ],
				} );
			} );
		} );

		describe( 'getSelectorDataForError', () => {
			beforeEach( () => {
				registry = createRegistry();

				storeDefinition = combineStores(
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
				dispatch.setErrorForSelector( errorNotFound, baseName, args );

				expect(
					select.getSelectorDataForError( errorForbidden )
				).toEqual( null );
			} );

			it( 'returns null when there is no selector found for the error', () => {
				dispatch.setErrorForSelector( errorNotFound, 'getBar', args );

				expect(
					select.getSelectorDataForError( errorNotFound )
				).toEqual( null );
			} );

			it( 'returns the selector data for an error object', () => {
				// Populate multiple errors to verify the we're correctly looking up the error.
				dispatch.setErrorForSelector( errorNotFound, baseName, [
					'foo',
				] );
				dispatch.setErrorForSelector( errorForbidden, 'getBar', [
					'bar',
				] );

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
				dispatch.setErrorForSelector( errorNotFound, baseName, args );

				expect( select.hasErrors() ).toBe( true );
			} );
		} );

		describe( 'state segregation', () => {
			it( 'a selector error should NOT be visible via getErrorForAction', () => {
				dispatch.setErrorForSelector( errorNotFound, baseName, args );

				expect(
					select.getErrorForAction( baseName, args )
				).toBeUndefined();
			} );

			it( 'an action error should NOT be visible via getErrorForSelector', () => {
				dispatch.setErrorForAction( errorForbidden, baseName, args );

				expect(
					select.getErrorForSelector( baseName, args )
				).toBeUndefined();
			} );
		} );
	} );
} );
