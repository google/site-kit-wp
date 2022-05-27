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
} from '../../../../../tests/js/test-utils';
import DashboardSharingSettings from '.';
import { MODULES_PAGESPEED_INSIGHTS } from '../../../modules/pagespeed-insights/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../../modules/search-console/datastore/constants';
import { MODULES_ANALYTICS } from '../../../modules/analytics/datastore/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

const settings = {
	'search-console': {
		sharedRoles: [ 'administrator' ],
		management: 'owner',
	},
	analytics: {
		sharedRoles: [ 'editor' ],
		management: 'owner',
	},
	'pagespeed-insights': {
		sharedRoles: [ 'author' ],
		management: 'all_admins',
	},
	adsense: {
		sharedRoles: [],
		management: 'all_admins',
	},
};
const roles = [
	{
		id: 'administrator',
		displayName: 'Administrator',
	},
	{
		id: 'editor',
		displayName: 'Editor',
	},
	{
		id: 'author',
		displayName: 'Author',
	},
	{
		id: 'contributor',
		displayName: 'Contributor',
	},
];

const sharedOwnershipModules = [ 'pagespeed-insights' ];

const modules = [
	{
		slug: 'search-console',
		shareable: true,
		owner: {
			id: 1,
			login: 'Admin 1',
		},
	},
	{
		slug: 'pagespeed-insights',
		shareable: true,
		owner: {
			id: 1,
			login: 'Admin 1',
		},
	},
	{
		slug: 'analytics',
		shareable: true,
		owner: {
			id: 2,
			login: 'Admin 2',
		},
	},
	{
		slug: 'adsense',
		shareable: true,
		owner: {
			id: 2,
			login: 'Admin 2',
		},
	},
];

const dashboardSharingDataBaseVar = '_googlesitekitDashboardSharingData';
const capabilitiesBaseVar = '_googlesitekitUserData';
const dashboardSharingData = {
	settings,
	roles,
	sharedOwnershipModules,
};
const capabilities = {
	permissions: {
		'googlesitekit_manage_module_sharing_options::["search-console"]': true,
		'googlesitekit_manage_module_sharing_options::["analytics"]': false,
	},
};

describe( 'DashboardSharingSettings', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ dashboardSharingDataBaseVar ];
		delete global[ capabilitiesBaseVar ];
	} );

	it( 'should not render anything if there are no modules', async () => {
		const { container } = render( <DashboardSharingSettings />, {
			registry,
		} );

		expect( console ).toHaveErrored();
		expect( container.firstChild ).toBeNull();
	} );

	it( 'should render the modules for dashboard sharing', async () => {
		global[ capabilitiesBaseVar ] = capabilities;
		global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

		provideModules( registry, modules );
		provideModuleRegistrations( registry );

		registry.dispatch( CORE_USER ).receiveUserInfo( {
			id: 1,
			email: 'admin@example.com',
			name: 'admin',
			picture: 'https://path/to/image',
		} );

		registry
			.dispatch( MODULES_PAGESPEED_INSIGHTS )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetSettings( { ownerID: 1 } );

		const { container } = render( <DashboardSharingSettings />, {
			registry,
		} );

		expect( console ).not.toHaveErrored();
		expect(
			container.querySelector(
				'.googlesitekit-dashboard-sharing-settings__module-name'
			)
		).toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Search Console' );
	} );

	it( 'should render the modules with user roles dropdown when the admin owns the modules', async () => {
		global[ capabilitiesBaseVar ] = capabilities;
		global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

		provideModules( registry, modules );
		provideModuleRegistrations( registry );

		registry.dispatch( CORE_USER ).receiveUserInfo( {
			id: 1,
			email: 'admin@example.com',
			name: 'admin',
			picture: 'https://path/to/image',
		} );

		registry
			.dispatch( MODULES_PAGESPEED_INSIGHTS )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetSettings( { ownerID: 1 } );

		const { container } = render( <DashboardSharingSettings />, {
			registry,
		} );

		expect( console ).not.toHaveErrored();
		expect(
			container.querySelector( '.googlesitekit-user-role-select__button' )
		).toBeInTheDocument();
	} );

	it( 'should not render sharing management for a single admin environment', async () => {
		global[ capabilitiesBaseVar ] = capabilities;
		global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

		provideModules( registry, modules );
		provideModuleRegistrations( registry );

		registry.dispatch( CORE_USER ).receiveUserInfo( {
			id: 1,
			email: 'admin@example.com',
			name: 'admin',
			picture: 'https://path/to/image',
		} );

		registry
			.dispatch( MODULES_PAGESPEED_INSIGHTS )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetSettings( { ownerID: 1 } );

		const { container } = render( <DashboardSharingSettings />, {
			registry,
		} );

		expect( console ).not.toHaveErrored();
		expect( container ).not.toHaveTextContent(
			'Who can manage view access'
		);
		expect(
			container.querySelector( '.mdc-select__native-control' )
		).not.toBeInTheDocument();
	} );

	it( 'should render sharing management for multi admins environment', async () => {
		global[ capabilitiesBaseVar ] = capabilities;
		global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

		provideModules( registry, modules );
		provideModuleRegistrations( registry );
		provideSiteConnection( registry, {
			hasMultipleAdmins: true,
		} );

		registry.dispatch( CORE_USER ).receiveUserInfo( {
			id: 1,
			email: 'admin@example.com',
			name: 'admin',
			picture: 'https://path/to/image',
		} );

		registry
			.dispatch( MODULES_PAGESPEED_INSIGHTS )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetSettings( { ownerID: 1 } );

		const { container } = render( <DashboardSharingSettings />, {
			registry,
		} );

		expect( console ).not.toHaveErrored();
		expect( container ).toHaveTextContent( 'Who can manage view access' );
		expect(
			container.querySelector( '.mdc-select__native-control' )
		).toBeInTheDocument();
	} );

	it( 'should set sharing management to `All Admins` and disabled if a module has shared ownership', async () => {
		global[ capabilitiesBaseVar ] = capabilities;
		global[ dashboardSharingDataBaseVar ] = {
			...dashboardSharingData,
			sharedOwnershipModules: [
				'search-console',
				'analytics',
				'adsense',
				'pagespeed-insights',
			],
		};

		provideModules( registry, modules );
		provideModuleRegistrations( registry );
		provideSiteConnection( registry, {
			hasMultipleAdmins: true,
		} );

		registry.dispatch( CORE_USER ).receiveUserInfo( {
			id: 1,
			email: 'admin@example.com',
			name: 'admin',
			picture: 'https://path/to/image',
		} );

		registry
			.dispatch( MODULES_PAGESPEED_INSIGHTS )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetSettings( { ownerID: 1 } );

		const { container } = render( <DashboardSharingSettings />, {
			registry,
		} );

		expect( console ).not.toHaveErrored();
		expect(
			container.querySelector( '.mdc-select__native-control' )
		).toBeDisabled();
	} );

	it( 'should disable other modules while editing user roles', async () => {
		global[ capabilitiesBaseVar ] = capabilities;
		global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

		provideModules( registry, modules );
		provideModuleRegistrations( registry );
		provideSiteConnection( registry, {
			hasMultipleAdmins: true,
		} );

		registry.dispatch( CORE_USER ).receiveUserInfo( {
			id: 1,
			email: 'admin@example.com',
			name: 'admin',
			picture: 'https://path/to/image',
		} );

		registry
			.dispatch( MODULES_PAGESPEED_INSIGHTS )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetSettings( { ownerID: 1 } );
		registry
			.dispatch( MODULES_ANALYTICS )
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
			container.querySelector( '.googlesitekit-user-role-select__button' )
		);

		// Check the modules are diabled when not editing the roles.
		expect(
			container.querySelector(
				'.googlesitekit-dashboard-sharing-settings__row--disabled'
			)
		).toBeInTheDocument();
	} );
} );
