/**
 * Module createSubmitChangesStore function tests.
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
 * Internal dependencies.
 */
import Data from 'googlesitekit-data';
import { createErrorStore } from '../data/create-error-store';
import { createSubmitChangesStore } from './create-submit-changes-store';

describe( 'createSubmitChangesStore', () => {
	const storeName = 'test/store';

	describe( 'actions', () => {
		it( 'should be available in the returned object', () => {
			const { actions } = createSubmitChangesStore();
			expect( actions ).not.toBeUndefined();
		} );

		test.each( [ [ 'submitChanges' ] ] )(
			'should have %s action',
			( selector ) => {
				const { actions } = createSubmitChangesStore();
				expect( typeof actions[ selector ] ).toBe( 'function' );
			}
		);

		describe( 'submitChanges', () => {
			it( 'should use provided submitChanges function', async () => {
				const submitChanges = jest.fn();
				submitChanges.mockResolvedValueOnce( {} );

				const registry = createRegistry();
				registry.registerStore(
					storeName,
					Data.combineStores(
						Data.commonStore,
						createSubmitChangesStore( { submitChanges } ),
						createErrorStore( storeName )
					)
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
						createSubmitChangesStore( {
							submitChanges: () => ( { error } ),
						} ),
						createErrorStore( storeName )
					)
				);

				expect(
					registry
						.select( storeName )
						.getErrorForAction( 'submitChanges' )
				).toBeUndefined();
				await registry.dispatch( storeName ).submitChanges();
				expect(
					registry
						.select( storeName )
						.getErrorForAction( 'submitChanges' )
				).toEqual( error );
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
						createSubmitChangesStore( {
							submitChanges: () => ( { error } ),
						} ),
						createErrorStore( storeName )
					)
				);

				expect(
					registry
						.select( storeName )
						.getErrorForAction( 'submitChanges' )
				).toBeUndefined();
				await registry.dispatch( storeName ).submitChanges();
				expect(
					registry
						.select( storeName )
						.getErrorForAction( 'submitChanges' )
				).toEqual( error );

				error = undefined;
				await registry.dispatch( storeName ).submitChanges();
				expect(
					registry
						.select( storeName )
						.getErrorForAction( 'submitChanges' )
				).toBeUndefined();
			} );
		} );
	} );

	describe( 'selectors', () => {
		it( 'should be available in the returned object', () => {
			const { selectors } = createSubmitChangesStore();
			expect( selectors ).not.toBeUndefined();
		} );

		test.each( [
			[ 'canSubmitChanges' ],
			[ '__dangerousCanSubmitChanges' ],
			[ 'isDoingSubmitChanges' ],
		] )( 'should have %s selector', ( selector ) => {
			const { selectors } = createSubmitChangesStore();
			expect( typeof selectors[ selector ] ).toBe( 'function' );
		} );

		describe.each( [
			[ 'canSubmitChanges' ],
			[ '__dangerousCanSubmitChanges' ],
		] )( '%s', ( selector ) => {
			it( 'should use provided validateCanSubmitChanges function', () => {
				const validateCanSubmitChanges = jest.fn();
				const store = createSubmitChangesStore( {
					validateCanSubmitChanges,
				} );

				const registry = createRegistry();
				registry.registerStore( storeName, store );

				store.selectors[ selector ]();

				expect( validateCanSubmitChanges ).toHaveBeenCalled();
			} );
		} );

		describe( 'isDoingSubmitChanges', () => {
			it( 'should be set to FALSE by default', () => {
				const registry = createRegistry();
				registry.registerStore( storeName, createSubmitChangesStore() );
				expect(
					registry.select( storeName ).isDoingSubmitChanges()
				).toBe( false );
			} );

			it( 'should be set to TRUE after starting submiting changes', async () => {
				const registry = createRegistry();

				registry.registerStore(
					storeName,
					Data.combineStores(
						Data.commonStore,
						createErrorStore( storeName ),
						createSubmitChangesStore( {
							submitChanges: () => {
								expect(
									registry
										.select( storeName )
										.isDoingSubmitChanges()
								).toBe( true );
								return {};
							},
						} )
					)
				);

				await registry.dispatch( storeName ).submitChanges();
			} );

			it( 'should be set to FALSE after finishing submitting changes', async () => {
				const registry = createRegistry();

				registry.registerStore(
					storeName,
					Data.combineStores(
						Data.commonStore,
						createSubmitChangesStore( {
							submitChanges: () => ( {} ),
						} ),
						createErrorStore( storeName )
					)
				);

				await registry.dispatch( storeName ).submitChanges();
				expect(
					registry.select( storeName ).isDoingSubmitChanges()
				).toBe( false );
			} );
		} );
	} );
} );
