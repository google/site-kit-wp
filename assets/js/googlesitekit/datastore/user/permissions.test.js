/**
 * User info data store: Authentication info tests.
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
 * Internal dependencies
 */
import {
	createTestRegistry,
} from '../../../../../tests/js/utils';
import { STORE_NAME } from './constants';

describe( 'core/user authentication', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'setPermissionScopeError', () => {
			it( 'requires the error param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setPermissionScopeError();
				} ).toThrow( 'permissionError is required.' );
			} );

			it( 'sets the error', () => {
				const someError = { status: 500, message: 'Bad' };
				registry.dispatch( STORE_NAME ).setPermissionScopeError( someError );

				expect( registry.select( STORE_NAME ).getPermissionScopeError() ).toEqual( someError );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getPermissionScopeError', () => {
			it( 'returns null when no error is set', async () => {
				expect( registry.select( STORE_NAME ).getPermissionScopeError() ).toEqual( null );
			} );

			it( 'returns the error once set', async () => {
				const someError = { status: 500, message: 'Bad' };
				registry.dispatch( STORE_NAME ).setPermissionScopeError( someError );

				expect( registry.select( STORE_NAME ).getPermissionScopeError() ).toEqual( someError );
			} );
		} );
	} );
} );
