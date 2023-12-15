/**
 * DashboardNavigation component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { render } from '../../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../googlesitekit/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import { CONTEXT_MAIN_DASHBOARD_SPEED } from '../../googlesitekit/widgets/default-contexts';
import DashboardNavigation from './';
import { setupDefaultChips } from './test-utils';

describe( 'Dashboard Navigation', () => {
	let previousSiteKitUserData;

	beforeEach( () => {
		previousSiteKitUserData = global._googlesitekitUserData;
	} );

	afterEach( () => {
		global._googlesitekitUserData = previousSiteKitUserData;
	} );

	it( 'has a chip set', () => {
		const { container } = render( <DashboardNavigation /> );

		expect( container.firstChild ).toHaveClass( 'mdc-chip-set' );
	} );

	it( 'has no default selection', () => {
		const { container } = render( <DashboardNavigation /> );

		expect( container.querySelector( '.mdc-chip--selected' ) ).toBeNull();
	} );

	it( 'always uses `ANCHOR_ID_TRAFFIC` as the default chip when not viewing a shared dashboard', () => {
		const { container } = render( <DashboardNavigation />, {
			setupRegistry: ( registry ) => {
				registry.dispatch( CORE_USER ).receiveGetCapabilities( {
					googlesitekit_view_dashboard: true,
					googlesitekit_manage_options: true,
					'googlesitekit_manage_module_sharing_options::["search-console"]': true,
					'googlesitekit_read_shared_module_data::["search-console"]': true,
					'googlesitekit_read_shared_module_data::["analytics"]': false,
				} );

				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'search-console',
						name: 'Search Console',
						shareable: true,
					},
					{
						slug: 'pagespeed-insights',
						name: 'PageSpeed Insights',
						shareable: true,
					},
				] );

				setupDefaultChips( registry );
			},
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect(
			container.querySelector( '.mdc-chip--selected' )
		).toHaveTextContent( 'Traffic' );
	} );

	it( 'uses `ANCHOR_ID_TRAFFIC` as the chip viewing a shared dashboard with the traffic section enabled', () => {
		const { container } = render( <DashboardNavigation />, {
			setupRegistry: ( registry ) => {
				registry.dispatch( CORE_USER ).receiveGetCapabilities( {
					googlesitekit_view_dashboard: true,
					googlesitekit_manage_options: true,
					'googlesitekit_manage_module_sharing_options::["search-console"]': true,
					'googlesitekit_read_shared_module_data::["search-console"]': true,
					'googlesitekit_read_shared_module_data::["analytics"]': false,
				} );

				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'search-console',
						name: 'Search Console',
						shareable: true,
					},
					{
						slug: 'pagespeed-insights',
						name: 'PageSpeed Insights',
						shareable: true,
					},
				] );

				setupDefaultChips( registry );
			},
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect(
			container.querySelector( '.mdc-chip--selected' )
		).toHaveTextContent( 'Traffic' );
	} );

	it( 'uses `ANCHOR_ID_CONTENT` as the chip viewing a shared dashboard with the traffic sections unavailable', () => {
		const { container } = render( <DashboardNavigation />, {
			setupRegistry: ( registry ) => {
				registry.dispatch( CORE_USER ).receiveGetCapabilities( {
					googlesitekit_view_dashboard: true,
					googlesitekit_manage_options: true,
					'googlesitekit_manage_module_sharing_options::["search-console"]': false,
					'googlesitekit_read_shared_module_data::["search-console"]': false,
					'googlesitekit_read_shared_module_data::["analytics"]': false,
					'googlesitekit_read_shared_module_data::["pagespeed-insights"]': true,
				} );

				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'pagespeed-insights',
						name: 'PageSpeed Insights',
						shareable: true,
					},
				] );

				// Speed
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( 'SpeedArea', {
						title: 'Speed',
						subtitle: 'Speed Widget Area',
						style: 'composite',
					} );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea(
						'SpeedArea',
						CONTEXT_MAIN_DASHBOARD_SPEED
					);
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidget( 'SpeedWidget', {
						Component() {
							return <div>Speed Widget</div>;
						},
					} );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidget( 'SpeedWidget', 'SpeedArea' );
			},
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect(
			container.querySelector( '.mdc-chip--selected' )
		).toHaveTextContent( 'Speed' );
	} );
} );
