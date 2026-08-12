/**
 * InviteUserRow tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import * as tracking from '@/js/util/tracking';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import InviteUserRow from './InviteUserRow';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'InviteUserRow', () => {
	let registry;

	const mockUser = {
		id: 2,
		name: 'MainAdminName',
		email: 'someone@anybusiness.com',
		role: 'Administrator',
	};

	const mockOnInviteResult = jest.fn();

	beforeEach( () => {
		registry = createTestRegistry();
		mockOnInviteResult.mockClear();
	} );

	it( 'renders user name, role, and email', () => {
		const { getByText } = render(
			<InviteUserRow
				user={ mockUser }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		expect( getByText( 'MainAdminName' ) ).toBeInTheDocument();
		expect( getByText( '(Administrator)' ) ).toBeInTheDocument();
		expect( getByText( 'someone@anybusiness.com' ) ).toBeInTheDocument();
	} );

	it( 'renders the role display name', () => {
		const editorUser = { ...mockUser, role: 'Editor' };

		const { getByText } = render(
			<InviteUserRow
				user={ editorUser }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		expect( getByText( '(Editor)' ) ).toBeInTheDocument();
	} );

	it( 'shows "Send invite" button in default state', () => {
		const { getByRole } = render(
			<InviteUserRow
				user={ mockUser }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		expect(
			getByRole( 'button', { name: /send invite/i } )
		).toBeInTheDocument();
	} );

	it( 'shows success state after successful invite', () => {
		const { getByText } = render(
			<InviteUserRow
				user={ mockUser }
				inviteResult={ { status: 'success' } }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		expect( getByText( 'Invitation sent' ) ).toBeInTheDocument();
		expect(
			document.querySelector( '.googlesitekit-invite-user-row__success' )
		).toBeInTheDocument();
	} );

	it( 'shows error state with retry after failed invite', () => {
		const { getByText } = render(
			<InviteUserRow
				user={ mockUser }
				inviteResult={ {
					status: 'error',
					message: 'An error occurred',
				} }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		expect(
			document.querySelector( '.googlesitekit-invite-user-row__error' )
		).toBeInTheDocument();
		expect( getByText( 'Retry' ) ).toBeInTheDocument();
	} );

	it( 'calls inviteUser action and tracks GA event when Send invite is clicked', async () => {
		const inviteUserEndpoint = new RegExp(
			'^/google-site-kit/v1/core/site/data/email-reporting-invite-user'
		);

		fetchMock.postOnce( inviteUserEndpoint, {
			body: { success: true },
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<InviteUserRow
				user={ mockUser }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		fireEvent.click( getByRole( 'button', { name: /send invite/i } ) );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( inviteUserEndpoint );
		expect( mockOnInviteResult ).toHaveBeenCalledWith( mockUser.id, {
			status: 'success',
		} );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenLastCalledWith(
			'mainDashboard_email_reports_user_settings-sidebar',
			'send_invite'
		);
	} );

	it( 'calls onInviteResult with error when invite fails', async () => {
		// Mock console.error to prevent jest-console from catching the API error.
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		const inviteUserEndpoint = new RegExp(
			'^/google-site-kit/v1/core/site/data/email-reporting-invite-user'
		);

		fetchMock.postOnce( inviteUserEndpoint, {
			body: {
				code: 'internal_error',
				message: 'Failed to send invitation',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { getByRole, waitForRegistry } = render(
			<InviteUserRow
				user={ mockUser }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: /send invite/i } ) );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( inviteUserEndpoint );
		expect( mockOnInviteResult ).toHaveBeenCalledWith(
			mockUser.id,
			expect.objectContaining( { status: 'error' } )
		);

		// Verify console.error was called with API error.
		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			'Google Site Kit API Error',
			'method:POST',
			'datapoint:email-reporting-invite-user',
			'type:core',
			'identifier:site',
			expect.stringContaining( 'Failed to send invitation' )
		);

		consoleErrorSpy.mockRestore();
	} );

	it( 'retry button triggers new invite attempt', async () => {
		const inviteUserEndpoint = new RegExp(
			'^/google-site-kit/v1/core/site/data/email-reporting-invite-user'
		);

		fetchMock.postOnce( inviteUserEndpoint, {
			body: { success: true },
			status: 200,
		} );

		const { getByText, waitForRegistry } = render(
			<InviteUserRow
				user={ mockUser }
				inviteResult={ { status: 'error', message: 'Previous error' } }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		fireEvent.click( getByText( 'Retry' ) );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( inviteUserEndpoint );
	} );
} );
