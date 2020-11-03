/**
 * Module createSubmitChangesStore function tests.
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
 * Internal dependencies.
 */
import Data from 'googlesitekit-data';
import { createErrorStore } from '../data/create-error-store';
import { createSubmitChangesStore } from './create-submit-changes-store';

describe( 'createSubmitChangesStore', () => {
	const storeName = 'test store';

	it( 'should throw an error if storeName isnt provided', () => {
		expect( () => createSubmitChangesStore() ).toThrow( 'storeName is required.' );
	} );

	describe( 'actions', () => {
		it( 'should be available in the returned object', () => {
			const { actions } = createSubmitChangesStore( { storeName } );
			expect( actions ).not.toBeUndefined();
		} );

		test.each( [
			[ 'submitChanges' ],
		] )( 'should have %s action', ( selector ) => {
			const { actions } = createSubmitChangesStore( { storeName } );
			expect( typeof actions[ selector ] ).toBe( 'function' );
		} );

		describe( 'submitChanges', () => {
			it( 'should use provided submitChanges function', async () => {
				const submitChanges = jest.fn();
				submitChanges.mockResolvedValueOnce( {} );

				const registry = createRegistry();
				registry.registerStore(
					storeName,
					Data.combineStores(
						Data.commonStore,
						createSubmitChangesStore( { storeName, submitChanges } ),
						createErrorStore(),
					),
				);

				await registry.dispatch( storeName ).submitChanges();
				expect( submitChanges ).toHaveBeenCalled();
			} );

			it( 'should set error if it has been returned from the submitChanges function', async () => {
				const error = {
					message: 'test error',
				};

				const registry = createRegistry();
				registry.registerStore(
					storeName,
					Data.combineStores(
						Data.commonStore,
						createSubmitChangesStore( { storeName, submitChanges: async () => ( { error } ) } ),
						createErrorStore(),
					),
				);

				expect( registry.select( storeName ).getErrorForAction( 'submitChanges' ) ).toBeUndefined();
				await registry.dispatch( storeName ).submitChanges();
				expect( registry.select( storeName ).getErrorForAction( 'submitChanges' ) ).toEqual( error );
			} );

			it( 'should reset error on subsequent dispatching', async () => {
				let error = {
					message: 'test error',
				};

				const registry = createRegistry();
				registry.registerStore(
					storeName,
					Data.combineStores(
						Data.commonStore,
						createSubmitChangesStore( { storeName, submitChanges: async () => ( { error } ) } ),
						createErrorStore(),
					),
				);

				expect( registry.select( storeName ).getErrorForAction( 'submitChanges' ) ).toBeUndefined();
				await registry.dispatch( storeName ).submitChanges();
				expect( registry.select( storeName ).getErrorForAction( 'submitChanges' ) ).toEqual( error );

				error = undefined;
				await registry.dispatch( storeName ).submitChanges();
				expect( registry.select( storeName ).getErrorForAction( 'submitChanges' ) ).toBeUndefined();
			} );
		} );
	} );

	describe( 'selectors', () => {
		it( 'should be available in the returned object', () => {
			const { selectors } = createSubmitChangesStore( { storeName } );
			expect( selectors ).not.toBeUndefined();
		} );

		test.each( [
			[ 'canSubmitChanges' ],
			[ '__dangerousCanSubmitChanges' ],
			[ 'hasStartedSubmittingChanges' ],
			[ 'hasFinishedSubmittingChanges' ],
			[ 'isDoingSubmitChanges' ],
		] )( 'should have %s selector', ( selector ) => {
			const { selectors } = createSubmitChangesStore( { storeName } );
			expect( typeof selectors[ selector ] ).toBe( 'function' );
		} );

		describe.each( [
			[ 'canSubmitChanges' ],
			[ '__dangerousCanSubmitChanges' ],
		] )( '%s', ( selector ) => {
			it( 'should use provided validateCanSubmitChanges function', () => {
				const validateCanSubmitChanges = jest.fn();
				const { selectors } = createSubmitChangesStore( { storeName, validateCanSubmitChanges } );

				selectors[ selector ]();
				expect( validateCanSubmitChanges ).toHaveBeenCalled();
			} );
		} );

		describe.each( [
			[ 'hasStartedSubmittingChanges', true ],
			[ 'hasFinishedSubmittingChanges', false ],
			[ 'isDoingSubmitChanges', true ],
		] )( '%s', ( selector, valueDuringLoading ) => {
			it( 'should be set to FALSE by default', () => {
				const registry = createRegistry();
				registry.registerStore( storeName, createSubmitChangesStore( { storeName } ) );
				expect( registry.select( storeName )[ selector ]() ).toBe( false );
			} );

			it( `should be set to ${ valueDuringLoading ? 'TRUE' : 'FALSE' } after starting submiting changes`, async () => {
				const registry = createRegistry();

				registry.registerStore(
					storeName,
					Data.combineStores(
						Data.commonStore,
						createErrorStore(),
						createSubmitChangesStore( { storeName, submitChanges: async () => {
							expect( registry.select( storeName )[ selector ]() ).toBe( valueDuringLoading );
							return {};
						} } ),
					),
				);

				await registry.dispatch( storeName ).submitChanges();
			} );

			it( `should be set to ${ ! valueDuringLoading ? 'TRUE' : 'FALSE' } after finishing submiting changes`, async () => {
				const registry = createRegistry();

				registry.registerStore(
					storeName,
					Data.combineStores(
						Data.commonStore,
						createSubmitChangesStore( { storeName, submitChanges: async () => ( {} ) } ),
						createErrorStore(),
					),
				);

				await registry.dispatch( storeName ).submitChanges();
				expect( registry.select( storeName )[ selector ]() ).toBe( ! valueDuringLoading );
			} );
		} );
	} );
} );
