/**
 * `core/site` data store: Errors tests.
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
 * Internal dependencies
 */
import { CORE_SITE } from './constants';
import { createTestRegistry } from '../../../../../tests/js/utils';

describe( 'core/site errors', () => {
	const internalServerError = {
		id: 'module-setup-error',
		title: 'Internal Server Error',
		description: 'Test error message',
		format: 'small',
		type: 'win-error',
	};

	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_SITE ].store;
	} );

	describe( 'actions', () => {
		describe( 'setInternalServerError', () => {
			it( 'should throw an exception if the error param is not a plain object', () => {
				expect( () => {
					registry
						.dispatch( CORE_SITE )
						.setInternalServerError( null );
				} ).toThrow( 'internalServerError must be a plain object.' );
			} );

			it( 'should require a plain object to be passed', () => {
				expect( () => {
					registry
						.dispatch( CORE_SITE )
						.setInternalServerError( new Error() );
				} ).toThrow( 'internalServerError must be a plain object.' );
			} );

			it( 'should set the error to the state', () => {
				registry
					.dispatch( CORE_SITE )
					.setInternalServerError( internalServerError );
				expect( store.getState().internalServerError ).toEqual(
					internalServerError
				);
			} );
		} );

		describe( 'clearInternalServerError', () => {
			it( 'should remove the error from the store', () => {
				registry
					.dispatch( CORE_SITE )
					.setInternalServerError( internalServerError );
				expect( store.getState().internalServerError ).toEqual(
					internalServerError
				);

				registry.dispatch( CORE_SITE ).clearInternalServerError();
				expect( store.getState().internalServerError ).toBeUndefined();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getInternalServerError', () => {
			it( 'should return the internal server error once set', () => {
				registry
					.dispatch( CORE_SITE )
					.setInternalServerError( internalServerError );

				const error = registry
					.select( CORE_SITE )
					.getInternalServerError();
				expect( error ).toEqual( internalServerError );
			} );

			it( 'should return undefined when no internal server error is set yet', () => {
				const error = registry
					.select( CORE_SITE )
					.getInternalServerError();
				expect( error ).toBeUndefined();
			} );
		} );
	} );
} );
