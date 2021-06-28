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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import { createTestRegistry } from '../../../../../tests/js/utils';

describe( 'core/site errors', () => {
	const internalServerError = {
		id: `module-setup-error`,
		title: __( 'Internal Server Error', 'google-site-kit' ),
		description: 'Test error message',
		format: 'small',
		type: 'win-error',
	};

	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'setInternalServerError', () => {
		test( 'returns undefined if nothing is passed', () => {
			registry.dispatch( STORE_NAME ).setInternalServerError();
			expect( store.getState().internalServerError ).toBeUndefined();
		} );

		test( 'adds error to the state', () => {
			registry.dispatch( STORE_NAME ).setInternalServerError( internalServerError );
			expect( store.getState() ).toMatchObject( { internalServerError } );
		} );
	} );

	describe( 'clearInternalServerError', () => {
		test( 'clears the error', () => {
			registry.dispatch( STORE_NAME ).setInternalServerError( internalServerError );
			expect( store.getState() ).toMatchObject( { internalServerError } );
			registry.dispatch( STORE_NAME ).clearInternalServerError();
			expect( store.getState().internalServerError ).toBeNull();
		} );
	} );
} );
