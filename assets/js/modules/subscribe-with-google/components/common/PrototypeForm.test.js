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
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME } from '../../datastore/constants';

describe( 'PrototypeForm', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Prevent extra fetches during tests.
		registry.dispatch( CORE_MODULES ).receiveGetModules( [] );
		registry.dispatch( STORE_NAME ).setSettings( {} );
	} );

	describe( '"Done" button', () => {
		it( 'hides when not passed a `doneCallback` prop', () => {
			const { queryByRole } = render( <PrototypeForm />, { registry } );
			const doneButton = queryByRole( 'button', { name: /Done/i } );
			expect( doneButton ).toBeNull();
		} );

		it( 'shows when passed a `doneCallback` prop', () => {
			const doneCallbackMock = jest.fn();
			const { getByRole } = render( <PrototypeForm doneCallback={ doneCallbackMock } />, { registry } );
			const doneButton = getByRole( 'button', { name: /Done/i } );
			expect( doneButton ).toBeInTheDocument();
		} );

		it( 'disables when required fields are missing', () => {
			const doneCallbackMock = jest.fn();
			const { getByRole } = render( <PrototypeForm doneCallback={ doneCallbackMock } />, { registry } );
			const doneButton = getByRole( 'button', { name: /Done/i } );
			expect( doneButton ).toBeDisabled();
		} );

		it( 'enables when required fields are present', () => {
			registry.dispatch( STORE_NAME ).setSettings( {
				publicationID: 'hello',
				products: 'hello',
			} );
			const doneCallbackMock = jest.fn();
			const { getByRole } = render( <PrototypeForm doneCallback={ doneCallbackMock } />, { registry } );
			const doneButton = getByRole( 'button', { name: /Done/i } );
			expect( doneButton ).toBeEnabled();
		} );
	} );
} );
