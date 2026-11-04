/**
 * SettingsPlugin component tests.
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
import { VIEW_CONTEXT_SETTINGS } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import * as tracking from '@/js/util/tracking';
import {
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import { freezeFetch } from '@tests/js/utils';
import SettingsPlugin from './SettingsPlugin';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'SettingsPlugin', () => {
	let registry: WPDataRegistry;

	const adminBarSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/admin-bar-settings'
	);
	const wpDashboardWidgetSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/wp-dashboard-widget-settings'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		mockTrackEvent.mockClear();
	} );

	it( 'should render both checkboxes reflecting the saved settings', () => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetAdminBarSettings( { enabled: true } );
		registry
			.dispatch( CORE_SITE )
			.receiveGetWPDashboardWidgetSettings( { enabled: false } );

		const { getByRole } = render( <SettingsPlugin />, { registry } );

		expect(
			getByRole( 'checkbox', {
				name: 'Display relevant page stats in the Admin bar',
			} )
		).toBeChecked();
		expect(
			getByRole( 'checkbox', {
				name: 'Display the Site Kit summary widget on the WordPress Dashboard',
			} )
		).not.toBeChecked();
	} );

	it( 'should show a loading state for the WordPress dashboard widget checkbox while its setting is loading', () => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetAdminBarSettings( { enabled: true } );
		freezeFetch( wpDashboardWidgetSettingsEndpoint );

		const { getByRole, queryByRole, getByText } = render(
			<SettingsPlugin />,
			{ registry }
		);

		expect(
			getByRole( 'checkbox', {
				name: 'Display relevant page stats in the Admin bar',
			} )
		).toBeInTheDocument();
		expect(
			queryByRole( 'checkbox', {
				name: 'Display the Site Kit summary widget on the WordPress Dashboard',
			} )
		).not.toBeInTheDocument();
		expect(
			getByText(
				'Display the Site Kit summary widget on the WordPress Dashboard'
			)
		).toBeInTheDocument();
	} );

	it.each( [
		[ 'off', true, false, 'disable_wp_dashboard_widget' ],
		[ 'on', false, true, 'enable_wp_dashboard_widget' ],
	] )(
		'should save and track the WordPress dashboard widget setting when "Display the Site Kit summary widget on the WordPress Dashboard" is toggled %s',
		async ( _, initial, expected, action ) => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetAdminBarSettings( { enabled: true } );
			registry
				.dispatch( CORE_SITE )
				.receiveGetWPDashboardWidgetSettings( { enabled: initial } );

			fetchMock.postOnce( wpDashboardWidgetSettingsEndpoint, {
				body: { enabled: expected },
			} );

			const { getByRole } = render( <SettingsPlugin />, {
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			} );

			const checkbox = getByRole( 'checkbox', {
				name: 'Display the Site Kit summary widget on the WordPress Dashboard',
			} );

			fireEvent.click( checkbox );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched(
					wpDashboardWidgetSettingsEndpoint,
					{ body: { data: { enabled: expected } } }
				)
			);
			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith( 'settings', action );

			await waitFor( () =>
				expect( checkbox ).toHaveProperty( 'checked', expected )
			);
		}
	);

	it.each( [
		[ 'off', true, false, 'disable_admin_bar_menu' ],
		[ 'on', false, true, 'enable_admin_bar_menu' ],
	] )(
		'should save and track the admin bar setting when "Display relevant page stats in the Admin bar" is toggled %s',
		async ( _, initial, expected, action ) => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetAdminBarSettings( { enabled: initial } );
			registry
				.dispatch( CORE_SITE )
				.receiveGetWPDashboardWidgetSettings( { enabled: true } );

			fetchMock.postOnce( adminBarSettingsEndpoint, {
				body: { enabled: expected },
			} );

			const { getByRole } = render( <SettingsPlugin />, {
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			} );

			fireEvent.click(
				getByRole( 'checkbox', {
					name: 'Display relevant page stats in the Admin bar',
				} )
			);

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched( adminBarSettingsEndpoint, {
					body: { data: { enabled: expected } },
				} )
			);
			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith( 'settings', action );
		}
	);
} );
