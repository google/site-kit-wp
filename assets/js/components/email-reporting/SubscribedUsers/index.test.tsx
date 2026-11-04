/**
 * SubscribedUsers tests.
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
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { PERMISSION_MANAGE_OPTIONS } from '@/js/googlesitekit/datastore/user/constants';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideUserCapabilities,
	provideUserInfo,
	render,
	waitForDefaultTimeouts,
} from '@tests/js/test-utils';
import SubscribedUsers from '.';

describe( 'SubscribedUsers', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	const subscribedUsersEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting-subscribed-users'
	);
	const unsubscribeUserEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting-unsubscribe-user'
	);

	function createSubscribedUsersResponse(
		users: Array< Record< string, unknown > >,
		{ total, totalPages }: { total?: number; totalPages?: number } = {}
	) {
		return {
			users,
			total: total ?? users.length,
			totalPages: totalPages ?? 1,
		};
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry, { id: 1 } );
		provideUserCapabilities( registry );
		registry
			.dispatch( CORE_UI )
			.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
	} );

	it( 'initial render fetches subscribed users with empty search', async () => {
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse( [
				{
					id: 2,
					displayName: 'Subscribed User',
					email: 'subscribed@example.com',
					role: 'editor',
				},
			] ),
			status: 200,
		} );

		const { findByText } = render( <SubscribedUsers />, { registry } );

		await findByText( 'Subscribed User' );

		expect( fetchMock ).toHaveFetched( subscribedUsersEndpoint, {
			query: {
				page: 1,
				search: '',
			},
		} );

		await act( async () => {
			await waitForDefaultTimeouts();
		} );
	} );

	it( 'shows empty state when no users are subscribed', async () => {
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse( [], {
				total: 0,
				totalPages: 0,
			} ),
			status: 200,
		} );

		const { findByText } = render( <SubscribedUsers />, { registry } );

		await findByText( /no subscribed users yet/i );
		await act( async () => {
			await waitForDefaultTimeouts();
		} );
	} );

	it( 'hides search input when 6 or fewer subscribed users', async () => {
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse(
				[
					{
						id: 2,
						displayName: 'Subscribed User',
						email: 'subscribed@example.com',
						role: 'editor',
					},
				],
				{ total: 6, totalPages: 1 }
			),
			status: 200,
		} );

		const { findByText, queryByLabelText } = render( <SubscribedUsers />, {
			registry,
		} );

		await findByText( 'Subscribed User' );
		expect(
			queryByLabelText( /Search user name, role, or email/i )
		).not.toBeInTheDocument();
		await act( async () => {
			await waitForDefaultTimeouts();
		} );
	} );

	it( 'shows search input when more than 6 subscribed users', async () => {
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse(
				[
					{
						id: 2,
						displayName: 'Subscribed User',
						email: 'subscribed@example.com',
						role: 'editor',
					},
				],
				{ total: 7, totalPages: 1 }
			),
			status: 200,
		} );

		const { findByText, findByLabelText } = render( <SubscribedUsers />, {
			registry,
		} );

		await findByText( 'Subscribed User' );
		expect(
			await findByLabelText( /Search user name, role, or email/i )
		).toBeInTheDocument();
		await act( async () => {
			await waitForDefaultTimeouts();
		} );
	} );

	it( 'clearing search resets to unfiltered results', async () => {
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse(
				[
					{
						id: 2,
						displayName: 'Unfiltered User',
						email: 'first@example.com',
						role: 'editor',
					},
				],
				{ total: 7 }
			),
			status: 200,
		} );
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse( [
				{
					id: 3,
					displayName: 'Filtered User',
					email: 'filtered@example.com',
					role: 'editor',
				},
			] ),
			status: 200,
		} );

		const { findByLabelText, findByText, getByLabelText } = render(
			<SubscribedUsers />,
			{ registry }
		);

		await findByText( 'Unfiltered User' );
		const searchInput = await findByLabelText(
			/Search user name, role, or email/i
		);

		fireEvent.change( searchInput, {
			target: { value: 'filtered' },
		} );

		await findByText( 'Filtered User' );

		fireEvent.click( getByLabelText( /Clear search/i ) );

		await findByText( 'Unfiltered User' );
	} );

	it( 'resets search state when panel opens', async () => {
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse(
				[
					{
						id: 2,
						displayName: 'Unfiltered User',
						email: 'first@example.com',
						role: 'editor',
					},
				],
				{ total: 7 }
			),
			status: 200,
		} );
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse( [
				{
					id: 3,
					displayName: 'Filtered User',
					email: 'filtered@example.com',
					role: 'editor',
				},
			] ),
			status: 200,
		} );

		const { findByLabelText, findByText } = render( <SubscribedUsers />, {
			registry,
		} );

		await findByText( 'Unfiltered User' );
		const searchInput = await findByLabelText(
			/Search user name, role, or email/i
		);

		fireEvent.change( searchInput, {
			target: { value: 'filtered' },
		} );

		await findByText( 'Filtered User' );

		await act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, false );
			return Promise.resolve();
		} );

		await act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
			return Promise.resolve();
		} );

		expect( searchInput ).toHaveValue( '' );

		await act( async () => {
			await waitForDefaultTimeouts();
		} );
	} );

	it( 'marks the row as unsubscribed and keeps it until dismissed', async () => {
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse( [
				{
					id: 2,
					displayName: 'Subscribed User',
					email: 'subscribed@example.com',
					role: 'editor',
				},
			] ),
			status: 200,
		} );
		fetchMock.postOnce( unsubscribeUserEndpoint, {
			body: { success: true },
			status: 200,
		} );

		const { findByText, getByRole, queryByText } = render(
			<SubscribedUsers />,
			{ registry }
		);

		await findByText( 'Subscribed User' );

		fireEvent.click( getByRole( 'button', { name: /unsubscribe/i } ) );

		await findByText( /user unsubscribed/i );

		expect( fetchMock ).toHaveFetched( unsubscribeUserEndpoint );
		expect( queryByText( 'Subscribed User' ) ).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /dismiss/i } ) );

		expect( queryByText( 'Subscribed User' ) ).not.toBeInTheDocument();

		await act( async () => {
			await waitForDefaultTimeouts();
		} );
	} );

	it( 'keeps an undismissed row visible across a panel close and reopen', async () => {
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse( [
				{
					id: 2,
					displayName: 'Subscribed User',
					email: 'subscribed@example.com',
					role: 'editor',
				},
			] ),
			status: 200,
		} );
		fetchMock.postOnce( unsubscribeUserEndpoint, {
			body: { success: true },
			status: 200,
		} );

		const { findByText, getByRole, queryByText } = render(
			<SubscribedUsers />,
			{ registry }
		);

		await findByText( 'Subscribed User' );

		fireEvent.click( getByRole( 'button', { name: /unsubscribe/i } ) );

		await findByText( /user unsubscribed/i );

		await act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, false );
			return Promise.resolve();
		} );

		await act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
			return Promise.resolve();
		} );

		expect( queryByText( /user unsubscribed/i ) ).toBeInTheDocument();

		await act( async () => {
			await waitForDefaultTimeouts();
		} );
	} );

	it( 'keeps an undismissed row visible when a search is entered afterwards', async () => {
		// Unsubscribing decrements the real total in place, so it needs to
		// start comfortably above SEARCH_THRESHOLD (6) to still clear it
		// after the one unsubscribe below.
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse(
				[
					{
						id: 2,
						displayName: 'Subscribed User',
						email: 'subscribed@example.com',
						role: 'editor',
					},
				],
				{ total: 8 }
			),
			status: 200,
		} );
		fetchMock.postOnce( unsubscribeUserEndpoint, {
			body: { success: true },
			status: 200,
		} );
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse( [] ),
			status: 200,
		} );

		const { findByText, findByLabelText, getByRole } = render(
			<SubscribedUsers />,
			{ registry }
		);

		await findByText( 'Subscribed User' );

		fireEvent.click( getByRole( 'button', { name: /unsubscribe/i } ) );

		await findByText( /user unsubscribed/i );

		const searchInput = await findByLabelText(
			/Search user name, role, or email/i
		);

		fireEvent.change( searchInput, {
			target: { value: 'anything' },
		} );

		// The search itself matches nobody, but the confirmation row for the
		// user just unsubscribed stays up regardless of the active search,
		// so the admin still gets to see and dismiss it.
		await findByText( /user unsubscribed/i );

		await act( async () => {
			await waitForDefaultTimeouts();
		} );
	} );

	it( 'shows the confirmation row for a user unsubscribed while a search is already active', async () => {
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse(
				[
					{
						id: 2,
						displayName: 'Subscribed User',
						email: 'subscribed@example.com',
						role: 'editor',
					},
				],
				{ total: 8 }
			),
			status: 200,
		} );
		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse( [
				{
					id: 2,
					displayName: 'Subscribed User',
					email: 'subscribed@example.com',
					role: 'editor',
				},
			] ),
			status: 200,
		} );
		fetchMock.postOnce( unsubscribeUserEndpoint, {
			body: { success: true },
			status: 200,
		} );

		const { findByText, findByLabelText, getByRole } = render(
			<SubscribedUsers />,
			{ registry }
		);

		await findByText( 'Subscribed User' );

		const searchInput = await findByLabelText(
			/Search user name, role, or email/i
		);

		fireEvent.change( searchInput, {
			target: { value: 'subscribed' },
		} );

		await findByText( 'Subscribed User' );

		fireEvent.click( getByRole( 'button', { name: /unsubscribe/i } ) );

		await findByText( /user unsubscribed/i );

		await act( async () => {
			await waitForDefaultTimeouts();
		} );
	} );

	it( 'shows an error with retry when unsubscribing fails', async () => {
		// Mock console.error to prevent jest-console from catching the API error.
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		fetchMock.getOnce( subscribedUsersEndpoint, {
			body: createSubscribedUsersResponse( [
				{
					id: 2,
					displayName: 'Subscribed User',
					email: 'subscribed@example.com',
					role: 'editor',
				},
			] ),
			status: 200,
		} );
		fetchMock.postOnce( unsubscribeUserEndpoint, {
			body: {
				code: 'internal_error',
				message: 'Failed to unsubscribe user',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { findByText, getByRole } = render( <SubscribedUsers />, {
			registry,
		} );

		await findByText( 'Subscribed User' );

		fireEvent.click( getByRole( 'button', { name: /unsubscribe/i } ) );

		await findByText( 'Retry' );

		expect( fetchMock ).toHaveFetched( unsubscribeUserEndpoint );

		consoleErrorSpy.mockRestore();
	} );

	it( 'renders null when user does not have MANAGE_OPTIONS capability', () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );

		const { container } = render( <SubscribedUsers />, { registry } );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
