/**
 * ViewOnlyMenu tests.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_AUTHENTICATE,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteConnection,
	provideUserCapabilities,
} from '@tests/js/utils';
import ViewOnlyMenu from './index';

describe( 'ViewOnlyMenu', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteConnection( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				shareable: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				shareable: true,
				connected: true,
			},
		] );
		// Registrations carry the module icons the shared services list renders.
		provideModuleRegistrations( registry );
		provideUserCapabilities( registry, {
			[ PERMISSION_AUTHENTICATE ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
		} );
		// The tracking toggle at the bottom of the menu reads this; without it the
		// resolver would fire a request no test has mocked.
		registry.dispatch( CORE_USER ).receiveGetTracking( { enabled: false } );
	} );

	function renderOpenMenu() {
		const result = render( <ViewOnlyMenu />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		fireEvent.click( result.getByRole( 'button', { name: 'View only' } ) );

		return result;
	}

	it( 'should render the shared services section', () => {
		const { getByText } = renderOpenMenu();

		expect( getByText( 'Shared services' ) ).toBeInTheDocument();
	} );

	it( 'should not render the Manage email reports item, which now lives in the header', () => {
		const { queryByText } = renderOpenMenu();

		expect( queryByText( 'Manage email reports' ) ).not.toBeInTheDocument();
	} );
} );
