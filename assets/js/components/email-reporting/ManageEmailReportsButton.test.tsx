/**
 * ManageEmailReportsButton tests.
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
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import ManageEmailReportsButton from './ManageEmailReportsButton';

describe( 'ManageEmailReportsButton', () => {
	// The initial setup flow is driven by a query arg, which jsdom will not let
	// tests change without a writable `location`.
	mockLocation();

	const label = 'Manage email reports';

	let registry: ReturnType< typeof createTestRegistry >;

	function provideViewableModules( viewableModuleSlugs: string[] ) {
		registry.dispatch( CORE_MODULES ).receiveGetModules( [
			{ slug: 'analytics-4', name: 'Analytics', shareable: true },
			{ slug: 'search-console', name: 'Search Console', shareable: true },
		] );

		registry.dispatch( CORE_USER ).receiveGetCapabilities( {
			googlesitekit_view_dashboard: true,
			'googlesitekit_read_shared_module_data::["analytics-4"]':
				viewableModuleSlugs.includes( 'analytics-4' ),
			'googlesitekit_read_shared_module_data::["search-console"]':
				viewableModuleSlugs.includes( 'search-console' ),
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		// Reset the query string, as the initial setup flow tests below change it.
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard';
	} );

	it( 'renders the button with the accessible label for an admin', () => {
		const { getByLabelText } = render( <ManageEmailReportsButton />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( getByLabelText( label ) ).toBeInTheDocument();
	} );

	it( 'opens the user settings selection panel on click', () => {
		const { getByLabelText } = render( <ManageEmailReportsButton />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect(
			registry
				.select( CORE_UI )
				.getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
		).toBeUndefined();

		fireEvent.click( getByLabelText( label ) );

		expect(
			registry
				.select( CORE_UI )
				.getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
		).toBe( true );
	} );

	it( 'does not render during the initial setup flow', () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&showProgress=true';

		const { queryByLabelText } = render( <ManageEmailReportsButton />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			features: [ 'setupFlowRefresh' ],
		} );

		expect( queryByLabelText( label ) ).not.toBeInTheDocument();
	} );

	it( 'renders during the initial setup flow when `setupFlowRefresh` is disabled', () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&showProgress=true';

		const { getByLabelText } = render( <ManageEmailReportsButton />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( getByLabelText( label ) ).toBeInTheDocument();
	} );

	it.each( [ [ 'analytics-4' ], [ 'search-console' ] ] )(
		'renders for a view-only user who can view %s',
		( viewableModule ) => {
			provideViewableModules( [ viewableModule ] );

			const { getByLabelText } = render( <ManageEmailReportsButton />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			} );

			expect( getByLabelText( label ) ).toBeInTheDocument();
		}
	);

	it( 'does not render for a view-only user without email reporting data access', () => {
		provideViewableModules( [] );

		const { queryByLabelText } = render( <ManageEmailReportsButton />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( queryByLabelText( label ) ).not.toBeInTheDocument();
	} );

	it( 'does not render for a view-only user while viewable modules are loading', () => {
		const { queryByLabelText } = render( <ManageEmailReportsButton />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( queryByLabelText( label ) ).not.toBeInTheDocument();
	} );
} );
