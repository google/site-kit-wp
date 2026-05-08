/**
 * ManageEmailReports tests.
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
import { render, createTestRegistry } from '../../../../tests/js/test-utils';
import ManageEmailReports from './ManageEmailReports';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

describe( 'ManageEmailReports', () => {
	const shareableModules = [
		{
			slug: 'analytics-4',
			name: 'Analytics',
			shareable: true,
		},
		{
			slug: 'search-console',
			name: 'Search Console',
			shareable: true,
		},
	];

	function setupViewableModules( registry, viewableModuleSlugs = [] ) {
		// Set up shareable modules.
		registry.dispatch( CORE_MODULES ).receiveGetModules( shareableModules );

		// Set up capabilities for view-only user.
		const capabilities = {
			googlesitekit_view_dashboard: true,
			'googlesitekit_read_shared_module_data::["analytics-4"]':
				viewableModuleSlugs.includes( 'analytics-4' ),
			'googlesitekit_read_shared_module_data::["search-console"]':
				viewableModuleSlugs.includes( 'search-console' ),
		};
		registry.dispatch( CORE_USER ).receiveGetCapabilities( capabilities );
	}

	it( 'should render when user can view Analytics', () => {
		const registry = createTestRegistry();
		setupViewableModules( registry, [ 'analytics-4' ] );

		const { container } = render( <ManageEmailReports />, { registry } );

		expect(
			container.querySelector(
				'.googlesitekit-view-only-menu__email-reporting'
			)
		).toBeInTheDocument();
	} );

	it( 'should render when user can view Search Console', () => {
		const registry = createTestRegistry();
		setupViewableModules( registry, [ 'search-console' ] );

		const { container } = render( <ManageEmailReports />, { registry } );

		expect(
			container.querySelector(
				'.googlesitekit-view-only-menu__email-reporting'
			)
		).toBeInTheDocument();
	} );

	it( 'should not render when user cannot view Analytics or Search Console', () => {
		const registry = createTestRegistry();
		setupViewableModules( registry, [] );

		const { container } = render( <ManageEmailReports />, { registry } );

		expect(
			container.querySelector(
				'.googlesitekit-view-only-menu__email-reporting'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should not render while viewable modules are still loading', () => {
		const registry = createTestRegistry();
		// Do not set up modules - they remain undefined.

		const { container } = render( <ManageEmailReports />, { registry } );

		expect(
			container.querySelector(
				'.googlesitekit-view-only-menu__email-reporting'
			)
		).not.toBeInTheDocument();
	} );
} );
