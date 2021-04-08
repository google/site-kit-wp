/**
 * Prototype Form component tests.
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
import PrototypeForm from './PrototypeForm';
import { render, createTestRegistry } from '../../../../../../tests/js/test-utils';
import { STORE_NAME } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

describe( 'PrototypeForm', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( STORE_NAME ).setSettings( {} );
		// Set user info.
		registry.dispatch( CORE_USER ).receiveUserInfo( { email: 'user@example.com' } );
		registry.dispatch( CORE_USER ).finishResolution( 'getUser', [] );
		// Prevent error when loading site info.
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
		// Receive empty modules to prevent unexpected fetch by resolver.
		registry.dispatch( CORE_MODULES ).receiveGetModules( [] );
	} );

	describe( '"Done" button', () => {
		it( 'hides when not passed a `doneCallback` prop', () => {
			const { queryByRole } = render( <PrototypeForm />, { registry } );
			const doneButton = queryByRole( 'button', { name: /Done/i } );
			expect( doneButton ).toBeNull();
		} );

		it( 'shows when passed a `doneCallback` prop', () => {
			const doneCallbackMock = jest.fn();
			const { queryByRole } = render( <PrototypeForm doneCallback={ doneCallbackMock } />, { registry } );
			const doneButton = queryByRole( 'button', { name: /Done/i } );
			expect( doneButton ).toBeInTheDocument();
		} );

		it( 'disables when required fields are missing', () => {
			const doneCallbackMock = jest.fn();
			const { queryByRole } = render( <PrototypeForm doneCallback={ doneCallbackMock } />, { registry } );
			const doneButton = queryByRole( 'button', { name: /Done/i } );
			expect( doneButton ).toBeDisabled();
		} );

		it( 'enables when required fields are present', () => {
			registry.dispatch( STORE_NAME ).setSettings( {
				publicationID: 'hello',
				products: 'hello',
			} );
			const doneCallbackMock = jest.fn();
			const { queryByRole } = render( <PrototypeForm doneCallback={ doneCallbackMock } />, { registry } );
			const doneButton = queryByRole( 'button', { name: /Done/i } );
			expect( doneButton ).toBeEnabled();
		} );
	} );
} );
