/**
 * Module setup SetupHeader component tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { type Registry } from '@/js/googlesitekit-data';
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';
import SetupHeader from './SetupHeader';

describe( 'SetupHeader', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideUserAuthentication( registry );
		provideModules( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry.dispatch( CORE_USER ).receiveGetCapabilities( {} );
	} );

	it( 'should render the Site Kit header, help menu, and optional children', async () => {
		const { container, getByText, waitForRegistry } = render(
			<SetupHeader>
				<span>Custom header action</span>
			</SetupHeader>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			}
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-header' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-help-menu__button' )
		).toBeInTheDocument();
		expect( getByText( 'Custom header action' ) ).toBeInTheDocument();
	} );
} );
