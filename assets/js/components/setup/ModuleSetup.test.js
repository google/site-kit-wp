/**
 * ModuleSetup component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { render } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import ModuleSetup from './ModuleSetup';

jest.mock( '@/js/components/notifications/Notifications', () => () => null );

describe( 'ModuleSetup', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry.dispatch( CORE_USER ).receiveGetCapabilities( {} );

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideModuleRegistrations( registry );
	} );

	it( 'renders all elements correctly', () => {
		provideModules( registry );

		registry.dispatch( CORE_MODULES ).registerModule( 'test-module', {
			storeName: 'modules/test-module',
			SetupComponent: () => <div>Test module setup component</div>,
		} );

		const { container, getByText } = render(
			<ModuleSetup moduleSlug="test-module" />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			}
		);

		expect(
			getByText( 'Test module setup component' )
		).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-header' )
		).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-help-menu__button' )
		).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-setup__footer' )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the registered SetupLayout when provided', () => {
		function CustomSetupLayout( { moduleSlug } ) {
			return <div>Custom setup layout for { moduleSlug }</div>;
		}

		provideModules( registry, [
			{ slug: 'custom-module', name: 'Custom Module' },
		] );

		registry.dispatch( CORE_MODULES ).registerModule( 'custom-module', {
			storeName: 'modules/custom-module',
			SetupLayout: CustomSetupLayout,
		} );

		const { getByText } = render(
			<ModuleSetup moduleSlug="custom-module" />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			}
		);

		expect(
			getByText( 'Custom setup layout for custom-module' )
		).toBeInTheDocument();
	} );
} );
