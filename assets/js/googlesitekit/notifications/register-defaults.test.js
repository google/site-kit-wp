/**
 * Default notifications tests.
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
import { WELCOME_MODAL_NOTIFICATION } from '@/js/components/WelcomeModal';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
	WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
} from '@tests/js/test-utils';
import { DEFAULT_NOTIFICATIONS } from './register-defaults';

describe( 'DEFAULT_NOTIFICATIONS checkRequirements', () => {
	let registry;
	let oldLocation;

	/**
	 * Marks the given module's datastore as having resolved its sample report
	 * with the given rows, which is what the zero data state is derived from.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} datastoreSlug Datastore slug.
	 * @param {Array}  report        Sample report rows.
	 */
	function provideSampleReport( datastoreSlug, report ) {
		const options = registry.select( datastoreSlug ).getSampleReportArgs();

		registry
			.dispatch( datastoreSlug )
			.receiveGetReport( report, { options } );
		registry
			.dispatch( datastoreSlug )
			.finishResolution( 'getReport', [ options ] );
	}

	function provideGatheringData( datastoreSlug, isGatheringData ) {
		registry
			.dispatch( datastoreSlug )
			.receiveIsGatheringData( isGatheringData );
	}

	/**
	 * Shares the given modules with a view-only user.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array.<string>} slugs Module slugs the view-only user can view.
	 */
	function provideSharedModules( slugs ) {
		provideUserCapabilities(
			registry,
			slugs.reduce(
				( capabilities, slug ) => ( {
					...capabilities,
					[ getMetaCapabilityPropertyName(
						PERMISSION_READ_SHARED_MODULE_DATA,
						slug
					) ]: true,
				} ),
				{}
			)
		);
	}

	beforeAll( () => {
		oldLocation = global.location;
		delete global.location;
		global.location = { href: 'http://example.com/wp-admin/admin.php' };
	} );

	afterAll( () => {
		global.location = oldLocation;
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		global.location.href = 'http://example.com/wp-admin/admin.php';

		provideSiteInfo( registry );
	} );

	describe( 'auth-error', () => {
		const { checkRequirements } = DEFAULT_NOTIFICATIONS[ 'auth-error' ];

		it( 'should be active when there is an authentication error', async () => {
			registry.dispatch( CORE_USER ).setAuthError( {
				code: 'test-error',
				message: 'Test error',
				data: {},
			} );

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active when there is no authentication error', async () => {
			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );

	describe( 'module-recovery-alert', () => {
		const { checkRequirements } =
			DEFAULT_NOTIFICATIONS[ 'module-recovery-alert' ];

		it( 'should be active when there is a recoverable module', async () => {
			provideModules( registry, [
				{ slug: MODULE_SLUG_ANALYTICS_4, recoverable: true },
			] );

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active when there are no recoverable modules', async () => {
			provideModules( registry );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );

	describe( 'gathering-data-notification', () => {
		const { checkRequirements } =
			DEFAULT_NOTIFICATIONS[ 'gathering-data-notification' ];

		beforeEach( () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
					shareable: true,
				},
				{
					slug: MODULE_SLUG_SEARCH_CONSOLE,
					active: true,
					connected: true,
					shareable: true,
				},
			] );
		} );

		it( 'should be active when Analytics is gathering data', async () => {
			provideGatheringData( MODULES_ANALYTICS_4, true );
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );

			expect(
				await checkRequirements( registry, VIEW_CONTEXT_MAIN_DASHBOARD )
			).toBe( true );
		} );

		it( 'should be active when Search Console is gathering data', async () => {
			provideGatheringData( MODULES_ANALYTICS_4, false );
			provideGatheringData( MODULES_SEARCH_CONSOLE, true );

			expect(
				await checkRequirements( registry, VIEW_CONTEXT_MAIN_DASHBOARD )
			).toBe( true );
		} );

		it( 'should not be active when neither module is gathering data', async () => {
			provideGatheringData( MODULES_ANALYTICS_4, false );
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );

			expect(
				await checkRequirements( registry, VIEW_CONTEXT_MAIN_DASHBOARD )
			).toBe( false );
		} );

		it( 'should not be active when the gathering module is disconnected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: false,
					connected: false,
				},
			] );
			provideGatheringData( MODULES_ANALYTICS_4, true );
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );

			expect(
				await checkRequirements( registry, VIEW_CONTEXT_MAIN_DASHBOARD )
			).toBe( false );
		} );

		it( 'should be active in a view-only context when the gathering module is shared', async () => {
			provideSharedModules( [ MODULE_SLUG_ANALYTICS_4 ] );
			provideGatheringData( MODULES_ANALYTICS_4, true );
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );

			expect(
				await checkRequirements(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				)
			).toBe( true );
		} );

		it( 'should not be active in a view-only context when the gathering module is not shared', async () => {
			provideSharedModules( [] );
			provideGatheringData( MODULES_ANALYTICS_4, true );
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );

			expect(
				await checkRequirements(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				)
			).toBe( false );
		} );

		it( 'should not be active in a view-only context when the gathering module is recoverable', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
					shareable: true,
					recoverable: true,
				},
				{
					slug: MODULE_SLUG_SEARCH_CONSOLE,
					active: true,
					connected: true,
					shareable: true,
				},
			] );
			provideSharedModules( [ MODULE_SLUG_ANALYTICS_4 ] );
			provideGatheringData( MODULES_ANALYTICS_4, true );
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );

			expect(
				await checkRequirements(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				)
			).toBe( false );
		} );
	} );

	describe( 'zero-data-notification', () => {
		const { checkRequirements } =
			DEFAULT_NOTIFICATIONS[ 'zero-data-notification' ];

		const searchConsoleReport = [
			{
				clicks: 100,
				ctr: 0.5,
				impressions: 200,
				keys: [ '2024-01-01' ],
				position: 1,
			},
		];

		beforeEach( () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: false,
					connected: false,
				},
				{
					slug: MODULE_SLUG_SEARCH_CONSOLE,
					active: true,
					connected: true,
					shareable: true,
				},
			] );
		} );

		it( 'should be active when a module has zero data', async () => {
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );
			provideSampleReport( MODULES_SEARCH_CONSOLE, [] );

			expect(
				await checkRequirements( registry, VIEW_CONTEXT_MAIN_DASHBOARD )
			).toBe( true );
		} );

		it( 'should not be active when the module has data', async () => {
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );
			provideSampleReport( MODULES_SEARCH_CONSOLE, searchConsoleReport );

			expect(
				await checkRequirements( registry, VIEW_CONTEXT_MAIN_DASHBOARD )
			).toBe( false );
		} );

		it( 'should not be active when a module is still gathering data', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
					shareable: true,
				},
				{
					slug: MODULE_SLUG_SEARCH_CONSOLE,
					active: true,
					connected: true,
					shareable: true,
				},
			] );
			provideGatheringData( MODULES_ANALYTICS_4, true );
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );
			provideSampleReport( MODULES_SEARCH_CONSOLE, [] );

			expect(
				await checkRequirements( registry, VIEW_CONTEXT_MAIN_DASHBOARD )
			).toBe( false );
		} );

		it( 'should be active in a view-only context when the zero data module is shared', async () => {
			provideSharedModules( [ MODULE_SLUG_SEARCH_CONSOLE ] );
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );
			provideSampleReport( MODULES_SEARCH_CONSOLE, [] );

			expect(
				await checkRequirements(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				)
			).toBe( true );
		} );

		it( 'should not be active in a view-only context when the zero data module is not shared', async () => {
			provideSharedModules( [] );
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );
			provideSampleReport( MODULES_SEARCH_CONSOLE, [] );

			expect(
				await checkRequirements(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				)
			).toBe( false );
		} );

		it( 'should not be active in a view-only context when the zero data module is recoverable', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: false,
					connected: false,
				},
				{
					slug: MODULE_SLUG_SEARCH_CONSOLE,
					active: true,
					connected: true,
					shareable: true,
					recoverable: true,
				},
			] );
			provideSharedModules( [ MODULE_SLUG_SEARCH_CONSOLE ] );
			provideGatheringData( MODULES_SEARCH_CONSOLE, false );
			provideSampleReport( MODULES_SEARCH_CONSOLE, [] );

			expect(
				await checkRequirements(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				)
			).toBe( false );
		} );
	} );

	describe( 'setup-success-notification-module', () => {
		const { checkRequirements } =
			DEFAULT_NOTIFICATIONS[ 'setup-success-notification-module' ];

		beforeEach( () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
					overrideSetupSuccessNotification: false,
				},
			] );
		} );

		it( 'should be active for a module that has just been set up', async () => {
			global.location.href = `http://example.com/wp-admin/admin.php?notification=authentication_success&slug=${ MODULE_SLUG_ANALYTICS_4 }`;

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active when the `notification` query arg is not set to `authentication_success`', async () => {
			global.location.href = `http://example.com/wp-admin/admin.php?notification=other&slug=${ MODULE_SLUG_ANALYTICS_4 }`;

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the module overrides the setup success notification', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
					overrideSetupSuccessNotification: true,
				},
			] );

			global.location.href = `http://example.com/wp-admin/admin.php?notification=authentication_success&slug=${ MODULE_SLUG_ANALYTICS_4 }`;

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the module is not active', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: false,
					connected: false,
					overrideSetupSuccessNotification: false,
				},
			] );

			global.location.href = `http://example.com/wp-admin/admin.php?notification=authentication_success&slug=${ MODULE_SLUG_ANALYTICS_4 }`;

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the `slug` query arg is missing', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success';

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );

	describe( 'welcome-modal', () => {
		const { checkRequirements } =
			DEFAULT_NOTIFICATIONS[ WELCOME_MODAL_NOTIFICATION ];

		beforeEach( () => {
			provideModules( registry );
			provideUserAuthentication( registry );
			provideUserCapabilities( registry );
		} );

		it( 'should be active when the data gathering complete modal is active', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
				] );

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should be active directly after the initial setup', async () => {
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=initial_setup_success';

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active when neither modal variant applies', async () => {
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active for a view-only user without access to a shared module', async () => {
			provideUserAuthentication( registry, { authenticated: false } );
			provideSharedModules( [] );
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
				] );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should be active for a view-only user with access to a shared module', async () => {
			provideModules( registry, [
				{ slug: MODULE_SLUG_SEARCH_CONSOLE, shareable: true },
			] );
			provideUserAuthentication( registry, { authenticated: false } );
			provideSharedModules( [ MODULE_SLUG_SEARCH_CONSOLE ] );
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
				] );

			expect( await checkRequirements( registry ) ).toBe( true );
		} );
	} );
} );
