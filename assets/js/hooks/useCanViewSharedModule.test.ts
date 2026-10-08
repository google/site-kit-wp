/**
 * `useCanViewSharedModule` hook tests.
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
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { PERMISSION_READ_SHARED_MODULE_DATA } from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import { provideModules, provideUserCapabilities } from '@tests/js/utils';
import useCanViewSharedModule from './useCanViewSharedModule';

describe( 'useCanViewSharedModule', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
	} );

	/**
	 * Sets whether the user can view the shared Search Console data.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}  options         Options.
	 * @param {boolean} options.canView Whether the user can view the data.
	 * @return {void}
	 */
	function provideSharedModuleCapability( {
		canView,
	}: {
		canView: boolean;
	} ) {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: canView,
		} );
	}

	it( 'should return true outside a view-only dashboard, whatever the shared module capabilities', () => {
		provideSharedModuleCapability( { canView: false } );

		const { result } = renderHook(
			() => useCanViewSharedModule( MODULE_SLUG_SEARCH_CONSOLE ),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'should return true on a view-only dashboard when the module is shared with the user', () => {
		provideSharedModuleCapability( { canView: true } );

		const { result } = renderHook(
			() => useCanViewSharedModule( MODULE_SLUG_SEARCH_CONSOLE ),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'should return false on a view-only dashboard when the module is not shared with the user', () => {
		provideSharedModuleCapability( { canView: false } );

		const { result } = renderHook(
			() => useCanViewSharedModule( MODULE_SLUG_SEARCH_CONSOLE ),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		expect( result.current ).toBe( false );
	} );
} );
