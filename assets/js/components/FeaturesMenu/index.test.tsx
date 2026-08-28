/**
 * FeaturesMenu tests.
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
 * WordPress dependencies
 */
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	modules,
	roles,
	sharingSettings,
} from '@/js/components/dashboard-sharing/DashboardSharingSettings/__fixtures__';
import { SETTINGS_DIALOG } from '@/js/components/dashboard-sharing/DashboardSharingSettings/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-export/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '@/js/modules/pagespeed-insights/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import * as tracking from '@/js/util/tracking';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteConnection,
	provideSiteInfo,
	provideUserInfo,
	render,
} from '@tests/js/test-utils';
import FeaturesMenu from '.';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'FeaturesMenu', () => {
	// The initial setup flow is driven by a query arg, which jsdom will not let
	// tests change without a writable `location`.
	mockLocation();

	const triggerLabel = 'Features';

	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideSiteConnection( registry, {
			hasMultipleAdmins: false,
		} );

		// Reset the query string, as the initial setup flow tests below change it.
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard';
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	describe( 'on the admin dashboard', () => {
		beforeEach( () => {
			// The sharing dialog renders alongside the menu, so its data must
			// be available even while the dialog is closed.
			provideModules( registry, modules );
			provideModuleRegistrations( registry );
			provideUserInfo( registry );

			registry
				.dispatch( CORE_MODULES )
				.receiveGetSharingSettings( sharingSettings );
			registry.dispatch( CORE_MODULES ).receiveShareableRoles( roles );
			registry
				.dispatch( CORE_MODULES )
				.receiveSharedOwnershipModules( [
					MODULE_SLUG_PAGESPEED_INSIGHTS,
				] );
			registry.dispatch( CORE_USER ).receiveCapabilities( {
				'googlesitekit_manage_module_sharing_options::["search-console"]':
					true,
			} );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveGetSettings( { ownerID: 1 } );
		} );

		it( 'renders the menu trigger button', () => {
			const { getByRole } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			expect(
				getByRole( 'button', { name: triggerLabel } )
			).toBeInTheDocument();
		} );

		it( 'tracks an event when the menu is opened', () => {
			const { getByRole } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			fireEvent.click( getByRole( 'button', { name: triggerLabel } ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_headerbar`,
				'open_featuresmenu'
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'renders all feature items when PDF generation is enabled', () => {
			const { getByText } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'pdfGeneration' ],
			} );

			expect( getByText( 'Manage email reports' ) ).toBeInTheDocument();
			expect(
				getByText( 'Dashboard sharing settings' )
			).toBeInTheDocument();
			expect( getByText( 'Download PDF report' ) ).toBeInTheDocument();
		} );

		it( 'does not render the PDF item when the `pdfGeneration` feature is disabled', () => {
			const { queryByText } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			expect(
				queryByText( 'Download PDF report' )
			).not.toBeInTheDocument();
		} );

		it( 'does not render the email reports item during the initial setup flow', () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&showProgress=true';

			const { queryByText } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'setupFlowRefresh' ],
			} );

			expect(
				queryByText( 'Manage email reports' )
			).not.toBeInTheDocument();
		} );

		it( 'opens the user settings selection panel when the email reports item is clicked', () => {
			const { getByText } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			fireEvent.click( getByText( 'Manage email reports' ) );

			expect(
				registry
					.select( CORE_UI )
					.getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );
		} );

		it( 'opens the sharing settings dialog when the sharing item is clicked', () => {
			const { getByText } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			fireEvent.click( getByText( 'Dashboard sharing settings' ) );

			expect(
				registry.select( CORE_UI ).getValue( SETTINGS_DIALOG )
			).toBe( true );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_headerbar`,
				'open_sharing',
				'simple'
			);
		} );

		it( 'opens the PDF download panel when the PDF item is clicked', () => {
			const { getByText } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'pdfGeneration' ],
			} );

			fireEvent.click( getByText( 'Download PDF report' ) );

			expect(
				registry
					.select( CORE_UI )
					.getValue( PDF_DOWNLOAD_PANEL_OPENED_KEY )
			).toBe( true );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_headerbar`,
				'open_pdf_generation_sidebar'
			);
		} );

		it( 'closes the menu when escape is pressed', () => {
			const { container, getByRole } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			fireEvent.click( getByRole( 'button', { name: triggerLabel } ) );

			const menu = container.querySelector(
				'#googlesitekit-features-menu'
			);

			expect( menu ).toHaveAttribute( 'aria-hidden', 'false' );

			fireEvent.keyDown( menu as Element, { keyCode: ESCAPE } );

			expect( menu ).toHaveAttribute( 'aria-hidden', 'true' );
		} );

		it( 'closes the menu when clicking outside', () => {
			const { container, getByRole } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			fireEvent.click( getByRole( 'button', { name: triggerLabel } ) );

			const menu = container.querySelector(
				'#googlesitekit-features-menu'
			);

			expect( menu ).toHaveAttribute( 'aria-hidden', 'false' );

			fireEvent.mouseDown( document.body );

			expect( menu ).toHaveAttribute( 'aria-hidden', 'true' );
		} );
	} );

	describe( 'on the view-only dashboard', () => {
		function provideViewableModules( viewableModuleSlugs: string[] ) {
			registry.dispatch( CORE_MODULES ).receiveGetModules( [
				{ slug: 'analytics-4', name: 'Analytics', shareable: true },
				{
					slug: 'search-console',
					name: 'Search Console',
					shareable: true,
				},
			] );

			registry.dispatch( CORE_USER ).receiveGetCapabilities( {
				googlesitekit_view_dashboard: true,
				'googlesitekit_read_shared_module_data::["analytics-4"]':
					viewableModuleSlugs.includes( 'analytics-4' ),
				'googlesitekit_read_shared_module_data::["search-console"]':
					viewableModuleSlugs.includes( 'search-console' ),
			} );
		}

		it( 'does not render the sharing item', () => {
			provideViewableModules( [ 'analytics-4' ] );

			const { queryByText } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			} );

			expect(
				queryByText( 'Dashboard sharing settings' )
			).not.toBeInTheDocument();
		} );

		it( 'renders the email reports item for a user with email reporting data access', () => {
			provideViewableModules( [ 'search-console' ] );

			const { getByText } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			} );

			expect( getByText( 'Manage email reports' ) ).toBeInTheDocument();
		} );

		it( 'does not render the email reports item for a user without email reporting data access', () => {
			provideViewableModules( [] );

			const { queryByText } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			} );

			expect(
				queryByText( 'Manage email reports' )
			).not.toBeInTheDocument();
		} );

		it( 'does not render the menu at all when no items are available', () => {
			provideViewableModules( [] );

			const { queryByRole } = render( <FeaturesMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			} );

			expect(
				queryByRole( 'button', { name: triggerLabel } )
			).not.toBeInTheDocument();
		} );
	} );
} );
