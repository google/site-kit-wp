/**
 * UserSettingsSelectionPanel tests.
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

import {
	createTestRegistry,
	fireEvent,
	provideUserInfo,
	render,
	waitFor,
} from '../../../../../tests/js/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import UserSettingsSelectionPanel from '@/js/components/email-reporting/UserSettingsSelectionPanel';
import SelectionPanelFooter from '@/js/components/email-reporting/UserSettingsSelectionPanel/SelectionPanelFooter';

describe( 'UserSettingsSelectionPanel', () => {
	const features = [ 'proactiveUserEngagement' ];
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserInfo( registry, { wpEmail: 'someone@anybusiness.com' } );

		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: false,
			frequency: 'monthly',
		} );

		registry
			.dispatch( CORE_UI )
			.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'renders header subheading in admin view', () => {
		const { getByText } = render( <UserSettingsSelectionPanel />, {
			registry,
			features,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		const heading = getByText( 'Email reports subscription' );
		expect( heading ).toBeInTheDocument();

		const headerEl = heading.closest( 'header' );
		expect( headerEl ).toBeInTheDocument();

		expect(
			getByText( 'You can always deactivate this feature in', {
				exact: false,
			} )
		).toBeInTheDocument();
	} );

	it( 'does not render header subheading in view-only', () => {
		provideUserInfo( registry, { wpEmail: 'viewer@example.com' } );

		const { getByText, queryByText } = render(
			<UserSettingsSelectionPanel />,
			{
				registry,
				features,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);

		expect( getByText( 'Email reports subscription' ) ).toBeInTheDocument();

		expect(
			queryByText( /you can always deactivate this feature in/i )
		).not.toBeInTheDocument();
	} );

	it( 'displays the user email in the explanatory copy when available', () => {
		const { getByText } = render( <UserSettingsSelectionPanel />, {
			registry,
			features,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect(
			getByText(
				'You’ll receive the report to your WordPress user email',
				{ exact: false }
			)
		).toBeInTheDocument();
		expect( getByText( 'someone@anybusiness.com' ) ).toBeInTheDocument();
	} );

	it( 'opens the side sheet when the UI key is true', () => {
		provideUserInfo( registry, { wpEmail: 'open@example.com' } );

		const { getByRole } = render( <UserSettingsSelectionPanel />, {
			registry,
			features,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		const dialog = getByRole( 'dialog' );
		expect( dialog ).toHaveAttribute( 'aria-hidden', 'false' );
	} );

	it( 'calls saveEmailReportingSettings with subscribed true when subscribing', async () => {
		const coreUserDispatch = registry.dispatch( CORE_USER );
		const saveSpy = jest
			.spyOn( coreUserDispatch, 'saveEmailReportingSettings' )
			.mockResolvedValue( { error: null } );

		const { getByRole } = render( <UserSettingsSelectionPanel />, {
			registry,
			features,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		fireEvent.click( getByRole( 'button', { name: 'Subscribe' } ) );

		await waitFor( () => expect( saveSpy ).toHaveBeenCalledTimes( 1 ) );
		expect( saveSpy ).toHaveBeenCalledWith( { subscribed: true } );
	} );

	it( 'calls saveEmailReportingSettings with subscribed false when unsubscribing', async () => {
		const coreUserDispatch = registry.dispatch( CORE_USER );
		coreUserDispatch.setEmailReportingSettings( {
			subscribed: true,
		} );
		const saveSpy = jest
			.spyOn( coreUserDispatch, 'saveEmailReportingSettings' )
			.mockResolvedValue( { error: null } );

		const { getByRole } = render( <UserSettingsSelectionPanel />, {
			registry,
			features,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		fireEvent.click( getByRole( 'button', { name: 'Unsubscribe' } ) );

		await waitFor( () => expect( saveSpy ).toHaveBeenCalledTimes( 1 ) );
		expect( saveSpy ).toHaveBeenCalledWith( { subscribed: false } );
	} );

	it( 'calls saveEmailReportingSettings without arguments when updating settings', async () => {
		const coreUserDispatch = registry.dispatch( CORE_USER );
		coreUserDispatch.setEmailReportingSettings( {
			subscribed: true,
		} );
		const saveSpy = jest
			.spyOn( coreUserDispatch, 'saveEmailReportingSettings' )
			.mockResolvedValue( { error: null } );

		const { getByRole } = render( <UserSettingsSelectionPanel />, {
			registry,
			features,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		fireEvent.click( getByRole( 'button', { name: 'Update Settings' } ) );

		await waitFor( () => expect( saveSpy ).toHaveBeenCalledTimes( 1 ) );
		expect( saveSpy.mock.calls[ 0 ] ).toHaveLength( 0 );
	} );

	it( 'resets proactive user engagement settings when the panel closes', async () => {
		const coreUserDispatch = registry.dispatch( CORE_USER );
		coreUserDispatch.receiveGetEmailReportingSettings( {
			subscribed: true,
			frequency: 'weekly',
		} );
		coreUserDispatch.setEmailReportingSettings( {
			subscribed: false,
		} );
		expect(
			registry.select( CORE_USER ).haveEmailReportingSettingsChanged()
		).toBe( true );

		const resetSpy = jest.spyOn(
			coreUserDispatch,
			'resetEmailReportingSettings'
		);

		render( <UserSettingsSelectionPanel />, {
			registry,
			features,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitFor( () =>
			expect(
				document.querySelector(
					'.googlesitekit-selection-panel-header__close'
				)
			).toBeInTheDocument()
		);

		const closeButton = document.querySelector(
			'.googlesitekit-selection-panel-header__close'
		);
		fireEvent.click( closeButton );

		await waitFor( () => expect( resetSpy ).toHaveBeenCalledTimes( 1 ) );
		expect(
			registry.select( CORE_USER ).getEmailReportingSettings()
		).toEqual( {
			subscribed: true,
			frequency: 'weekly',
		} );
		expect(
			registry.select( CORE_USER ).haveEmailReportingSettingsChanged()
		).toBe( false );
	} );
} );

describe( 'Footer', () => {
	it( 'renders default description when no notice is provided', () => {
		const { getByText } = render( <SelectionPanelFooter /> );

		expect(
			getByText(
				/This email is generated by Site Kit using data from your dashboard/i
			)
		).toBeInTheDocument();
	} );

	it( 'renders a notice with dismiss button when notice prop is provided', () => {
		const onDismiss = jest.fn();
		const { getByText, getByRole } = render(
			<SelectionPanelFooter
				notice={ { type: 'error', text: 'There was a problem.' } }
				onNoticeDismiss={ onDismiss }
			/>
		);

		expect( getByText( 'There was a problem.' ) ).toBeInTheDocument();

		const dismissButton = getByRole( 'button', { name: 'Got it' } );
		fireEvent.click( dismissButton );

		expect( onDismiss ).toHaveBeenCalled();
	} );
} );
