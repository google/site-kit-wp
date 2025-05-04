/**
 * DashboardSharingSettings component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
	render,
	fireEvent,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
	provideSiteConnection,
	provideUserInfo,
	waitFor,
} from '../../../../../tests/js/test-utils';
import DashboardSharingSettings from '.';
import { MODULES_SEARCH_CONSOLE } from '../../../modules/search-console/datastore/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { sharingSettings, modules, roles } from './__fixtures__';

describe( 'DashboardSharingSettings', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'Single Admin Environment', () => {
		it( 'should render the modules for dashboard sharing', () => {
			provideModules( registry, modules );
			provideModuleRegistrations( registry );
			provideSiteConnection( registry, {
				hasMultipleAdmins: false,
			} );
			provideUserInfo( registry );

			registry
				.dispatch( CORE_MODULES )
				.receiveGetSharingSettings( sharingSettings );
			registry.dispatch( CORE_MODULES ).receiveShareableRoles( roles );
			registry
				.dispatch( CORE_MODULES )
				.receiveSharedOwnershipModules( [ 'pagespeed-insights' ] );

			registry.dispatch( CORE_USER ).receiveCapabilities( {
				'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			} );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveGetSettings( { ownerID: 1 } );

			const { container } = render( <DashboardSharingSettings />, {
				registry,
			} );

			expect(
				container.querySelector(
					'.googlesitekit-dashboard-sharing-settings__module-name'
				)
			).toBeInTheDocument();
			expect( container ).toHaveTextContent( 'Search Console' );
		} );

		it( 'should render the modules with user role select when the admin owns the modules', async () => {
			provideModules( registry, modules );
			provideModuleRegistrations( registry );
			provideSiteConnection( registry, {
				hasMultipleAdmins: false,
			} );
			provideUserInfo( registry );

			registry
				.dispatch( CORE_MODULES )
				.receiveGetSharingSettings( sharingSettings );
			registry.dispatch( CORE_MODULES ).receiveShareableRoles( roles );
			registry
				.dispatch( CORE_MODULES )
				.receiveSharedOwnershipModules( [ 'pagespeed-insights' ] );

			registry.dispatch( CORE_USER ).receiveCapabilities( {
				'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			} );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveGetSettings( { ownerID: 1 } );

			const { container, waitForRegistry } = render(
				<DashboardSharingSettings />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				container.querySelector(
					'.googlesitekit-user-role-select__button'
				)
			).toBeInTheDocument();
		} );

		it( 'should not render sharing management for a single admin environment', async () => {
			provideModules( registry, modules );
			provideModuleRegistrations( registry );
			provideSiteConnection( registry, {
				hasMultipleAdmins: false,
			} );
			provideUserInfo( registry );

			registry
				.dispatch( CORE_MODULES )
				.receiveGetSharingSettings( sharingSettings );
			registry.dispatch( CORE_MODULES ).receiveShareableRoles( roles );
			registry
				.dispatch( CORE_MODULES )
				.receiveSharedOwnershipModules( [ 'pagespeed-insights' ] );

			registry.dispatch( CORE_USER ).receiveCapabilities( {
				'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			} );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveGetSettings( { ownerID: 1 } );

			const { container, waitForRegistry } = render(
				<DashboardSharingSettings />,
				{
					registry,
				}
			);

			await waitForRegistry();

			await waitFor( () => {
				expect( container ).not.toHaveTextContent(
					'Who can manage view access'
				);
				expect(
					container.querySelector( '.mdc-select__native-control' )
				).not.toBeInTheDocument();
			} );
		} );
	} );

	describe( 'Multi-Admin Environment', () => {
		it( 'should render the sharing management column for a multi-admin environment', async () => {
			provideModules( registry, modules );
			provideModuleRegistrations( registry );
			provideSiteConnection( registry, {
				hasMultipleAdmins: true,
			} );
			provideUserInfo( registry );

			registry
				.dispatch( CORE_MODULES )
				.receiveGetSharingSettings( sharingSettings );
			registry.dispatch( CORE_MODULES ).receiveShareableRoles( roles );
			registry
				.dispatch( CORE_MODULES )
				.receiveSharedOwnershipModules( [ 'pagespeed-insights' ] );

			registry.dispatch( CORE_USER ).receiveCapabilities( {
				'googlesitekit_delegate_module_sharing_management::["search-console"]': true,
				'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			} );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveGetSettings( { ownerID: 1 } );

			const { container, waitForRegistry } = render(
				<DashboardSharingSettings />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( container ).toHaveTextContent(
				'Who can manage view access'
			);
			expect(
				container.querySelector( '.mdc-select__native-control' )
			).toBeInTheDocument();
		} );

		it( 'should disable other modules while editing user roles', () => {
			provideModules( registry, modules );
			provideModuleRegistrations( registry );
			provideSiteConnection( registry, {
				hasMultipleAdmins: true,
			} );
			provideUserInfo( registry );

			registry
				.dispatch( CORE_MODULES )
				.receiveGetSharingSettings( sharingSettings );
			registry.dispatch( CORE_MODULES ).receiveShareableRoles( roles );
			registry
				.dispatch( CORE_MODULES )
				.receiveSharedOwnershipModules( [ 'pagespeed-insights' ] );

			registry.dispatch( CORE_USER ).receiveCapabilities( {
				'googlesitekit_delegate_module_sharing_management::["search-console"]': true,
				'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			} );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveGetSettings( { ownerID: 1 } );

			const { container } = render( <DashboardSharingSettings />, {
				registry,
			} );

			expect( console ).not.toHaveErrored();

			// Check the modules aren't diabled when not editing the roles.
			expect(
				container.querySelector(
					'.googlesitekit-dashboard-sharing-settings__row--disabled'
				)
			).not.toBeInTheDocument();

			fireEvent.click(
				container.querySelector(
					'.googlesitekit-user-role-select__button'
				)
			);

			// Check the modules are diabled when not editing the roles.
			expect(
				container.querySelector(
					'.googlesitekit-dashboard-sharing-settings__row--disabled'
				)
			).toBeInTheDocument();
		} );
	} );
} );
