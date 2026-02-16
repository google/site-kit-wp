/**
 * SettingsEmailReporting component tests.
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
import { render, waitFor } from '../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideUserAuthentication,
	freezeFetch,
	provideUserCapabilities,
	provideModules,
	provideSiteInfo,
} from '../../../../tests/js/utils';
import * as tracking from '@/js/util/tracking';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import SettingsEmailReporting from './SettingsEmailReporting';
import { VIEW_CONTEXT_SETTINGS } from '@/js/googlesitekit/constants';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'SettingsEmailReporting', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry );

		// Prevent network request/resolver from running to avoid console errors.
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry.dispatch( CORE_SITE ).receiveGetEmailReportingErrors( [] );

		mockTrackEvent.mockClear();
	} );

	it( 'should render the toggle with correct label', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: false,
		} );

		const { getByText } = render( <SettingsEmailReporting />, {
			registry,
		} );

		expect( getByText( 'Enable email reports' ) ).toBeInTheDocument();
	} );

	it( 'should render the learn more link with the documentation URL', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: false,
		} );

		const { getByRole } = render( <SettingsEmailReporting />, {
			registry,
		} );

		const link = getByRole( 'link', { name: /learn more/i } );

		expect( link ).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?doc=email-reporting'
		);
	} );

	it( 'should return null when loading prop is true', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );

		const { container } = render( <SettingsEmailReporting loading />, {
			registry,
		} );

		expect( container.firstChild ).toBeNull();
	} );

	it( 'should return null when settings are undefined', () => {
		// Prevent network request/resolver from running to avoid console errors.
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/email-reporting' )
		);

		const { container } = render( <SettingsEmailReporting />, {
			registry,
		} );

		expect( container.firstChild ).toBeNull();
	} );

	it( 'should enable email reporting when switch is clicked while disabled', async () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: false,
		} );

		// Prevent any GET to email-reporting from triggering in the background.
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/email-reporting' )
		);

		const { getAllByRole } = render( <SettingsEmailReporting />, {
			registry,
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		// The interactive control is the wrapper element with role="switch" (first match).
		const [ toggle ] = getAllByRole( 'switch', {
			name: /Enable email reports/i,
		} );
		expect( toggle ).toHaveAttribute( 'aria-checked', 'false' );

		// Mock the save endpoint (will be ignored if freeze intercepts; state still updates via action)
		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/site/data/email-reporting' ),
			{
				body: { enabled: true },
				status: 200,
			}
		);

		toggle.click();

		await waitFor( () => {
			expect( toggle ).toHaveAttribute( 'aria-checked', 'true' );
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_email_reports_settings',
			'activate_periodic_email_reports'
		);
	} );

	it( 'should open disable confirmation modal when enabled toggle is clicked', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: false,
		} );

		const { getAllByRole, getByText } = render(
			<SettingsEmailReporting />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			}
		);

		const [ toggle ] = getAllByRole( 'switch', {
			name: /Enable email reports/i,
		} );

		toggle.click();

		expect(
			getByText( 'Are you sure you want to disable email reports?' )
		).toBeInTheDocument();
	} );

	it( 'should close modal and keep enabled when cancel is clicked', async () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: false,
		} );

		const { getAllByRole, getByText, queryByText } = render(
			<SettingsEmailReporting />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			}
		);

		const [ toggle ] = getAllByRole( 'switch', {
			name: /Enable email reports/i,
		} );

		toggle.click();

		const cancelButton = getByText( 'Cancel' );
		cancelButton.click();

		await waitFor( () => {
			expect(
				queryByText( 'Are you sure you want to disable email reports?' )
			).not.toBeInTheDocument();
		} );

		expect( toggle ).toHaveAttribute( 'aria-checked', 'true' );
	} );

	it( 'should disable and save settings when confirm is clicked', async () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: false,
		} );

		// Prevent any GET to email-reporting from triggering in the background.
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/email-reporting' )
		);

		const { getAllByRole, getByText, queryByText } = render(
			<SettingsEmailReporting />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			}
		);

		const [ toggle ] = getAllByRole( 'switch', {
			name: /Enable email reports/i,
		} );

		toggle.click();

		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/site/data/email-reporting' ),
			{
				body: { enabled: false },
				status: 200,
			}
		);

		const disableButton = getByText( 'Disable' );
		disableButton.click();

		await waitFor( () => {
			expect( toggle ).toHaveAttribute( 'aria-checked', 'false' );
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_email_reports_settings',
			'deactivate_periodic_email_reports'
		);

		await waitFor( () => {
			expect(
				queryByText( 'Are you sure you want to disable email reports?' )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'should open the selection panel from the modal link', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: false,
		} );

		const { getAllByRole, getByRole } = render(
			<SettingsEmailReporting />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			}
		);

		const [ toggle ] = getAllByRole( 'switch', {
			name: /Enable email reports/i,
		} );

		toggle.click();

		const settingsLink = getByRole( 'button', {
			name: /email report settings/i,
		} );
		settingsLink.click();

		expect(
			registry
				.select( CORE_UI )
				.getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
		).toBe( true );
	} );

	it( 'should show "Manage email reports" link when enabled and subscribed', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: true,
		} );

		const { getByText } = render( <SettingsEmailReporting />, {
			registry,
		} );

		expect(
			getByText( 'Manage email reports subscription' )
		).toBeInTheDocument();
	} );

	it( 'should not show "Manage email reports" link when not enabled', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: true,
		} );

		const { queryByText } = render( <SettingsEmailReporting />, {
			registry,
		} );

		expect(
			queryByText( 'Manage email reports subscription' )
		).not.toBeInTheDocument();
	} );

	it( 'should open selection panel when "Manage email reports" link is clicked', () => {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: true,
		} );

		const { getByText } = render( <SettingsEmailReporting />, {
			registry,
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		const manageLink = getByText( 'Manage email reports subscription' );
		manageLink.click();

		expect(
			registry
				.select( CORE_UI )
				.getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
		).toBe( true );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_email_reports_settings',
			'manage_email_reports_subscription'
		);
	} );
} );
