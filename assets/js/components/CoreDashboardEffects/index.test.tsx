/**
 * CoreDashboardEffects component tests.
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
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { render, waitFor } from '@tests/js/test-utils';
import CoreDashboardEffects from './index';

const HAS_SCROLLED_CLASS = 'googlesitekit-plugin--has-scrolled';

describe( 'CoreDashboardEffects', () => {
	beforeEach( () => {
		global.history.replaceState( {}, '', '/' );
	} );

	afterEach( () => {
		document.body.classList.remove( HAS_SCROLLED_CLASS );
		delete ( global as { pageYOffset?: number } ).pageYOffset;
	} );

	it.each( [
		[ 'VIEW_CONTEXT_MAIN_DASHBOARD', VIEW_CONTEXT_MAIN_DASHBOARD ],
		[
			'VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY',
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
	] )(
		'should open the email reporting selection panel and remove the `panel` query arg on the main dashboard (%s)',
		async ( _testName, viewContext ) => {
			global.history.replaceState(
				{},
				'',
				'/wp-admin/admin.php?page=googlesitekit-dashboard&panel=email-reporting'
			);

			const { registry } = render( <CoreDashboardEffects />, {
				viewContext,
			} );

			await waitFor( () =>
				expect(
					registry
						.select( CORE_UI )
						.getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
				).toBe( true )
			);

			expect( global.location.href ).not.toContain(
				'panel=email-reporting'
			);
		}
	);

	it( 'should not open the email reporting selection panel on the entity dashboard', () => {
		global.history.replaceState(
			{},
			'',
			'/wp-admin/admin.php?page=googlesitekit-dashboard&panel=email-reporting'
		);

		const { registry } = render( <CoreDashboardEffects />, {
			viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
		} );

		expect(
			registry
				.select( CORE_UI )
				.getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
		).toBeUndefined();

		expect( global.location.href ).toContain( 'panel=email-reporting' );
	} );

	it.each( [
		[ 'main dashboard', VIEW_CONTEXT_MAIN_DASHBOARD ],
		[ 'entity dashboard', VIEW_CONTEXT_ENTITY_DASHBOARD ],
	] )(
		'should toggle the has-scrolled body class on the %s',
		( _dashboardType, viewContext ) => {
			Object.defineProperty( global, 'pageYOffset', {
				value: 100,
				configurable: true,
			} );

			render( <CoreDashboardEffects />, { viewContext } );

			expect( document.body.classList ).toContain( HAS_SCROLLED_CLASS );
		}
	);

	it.each( [
		[ 'main dashboard', VIEW_CONTEXT_MAIN_DASHBOARD ],
		[ 'entity dashboard', VIEW_CONTEXT_ENTITY_DASHBOARD ],
	] )(
		'should render nothing to the DOM on the %s',
		( _dashboardType, viewContext ) => {
			const { container } = render( <CoreDashboardEffects />, {
				viewContext,
			} );

			expect( container ).toBeEmptyDOMElement();
		}
	);
} );
