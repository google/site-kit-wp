/**
 * InviteOthersToSubscribe tests.
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
import {
	act,
	createTestRegistry,
	fireEvent,
	provideUserCapabilities,
	provideUserInfo,
	render,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { PERMISSION_MANAGE_OPTIONS } from '@/js/googlesitekit/datastore/user/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import InviteOthersToSubscribe from '.';

describe( 'InviteOthersToSubscribe', () => {
	let registry;

	const eligibleSubscribersEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting-eligible-subscribers'
	);

	function createSubscribersResponse( users, { total, totalPages } = {} ) {
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

	it( 'initial render fetches eligible subscribers with empty search', async () => {
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createSubscribersResponse( [
				{
					id: 2,
					displayName: 'Eligible User',
					email: 'eligible@example.com',
					role: 'editor',
					subscribed: false,
					invited: false,
				},
			] ),
			status: 200,
		} );

		const { findByText } = render( <InviteOthersToSubscribe />, {
			registry,
		} );

		await findByText( 'Eligible User' );

		expect( fetchMock ).toHaveFetched( eligibleSubscribersEndpoint, {
			queryParams: {
				page: 1,
				search: '',
			},
		} );

		await act( waitForDefaultTimeouts );
	} );

	it( 'shows empty state when no eligible users exist', async () => {
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createSubscribersResponse( [], { total: 0, totalPages: 0 } ),
			status: 200,
		} );

		const { findByText } = render( <InviteOthersToSubscribe />, {
			registry,
		} );

		await findByText( 'No users are eligible to receive invitations.' );
		await act( waitForDefaultTimeouts );
	} );

	it( 'hides search input when 6 or fewer eligible users', async () => {
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createSubscribersResponse(
				[
					{
						id: 2,
						displayName: 'Eligible User',
						email: 'eligible@example.com',
						role: 'editor',
						subscribed: false,
						invited: false,
					},
				],
				{ total: 6, totalPages: 1 }
			),
			status: 200,
		} );

		const { findByText, queryByLabelText } = render(
			<InviteOthersToSubscribe />,
			{
				registry,
			}
		);

		await findByText( 'Eligible User' );
		expect(
			queryByLabelText( /Search user name, role, or email/i )
		).not.toBeInTheDocument();
		await act( waitForDefaultTimeouts );
	} );

	it( 'shows search input when more than 6 eligible users', async () => {
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createSubscribersResponse(
				[
					{
						id: 2,
						displayName: 'Eligible User',
						email: 'eligible@example.com',
						role: 'editor',
						subscribed: false,
						invited: false,
					},
				],
				{ total: 7, totalPages: 1 }
			),
			status: 200,
		} );

		const { findByText, findByLabelText } = render(
			<InviteOthersToSubscribe />,
			{
				registry,
			}
		);

		await findByText( 'Eligible User' );
		expect(
			await findByLabelText( /Search user name, role, or email/i )
		).toBeInTheDocument();
		await act( waitForDefaultTimeouts );
	} );

	it( 'displays the info tooltip with eligibility explanation', async () => {
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createSubscribersResponse( [
				{
					id: 2,
					displayName: 'Eligible User',
					email: 'eligible@example.com',
					role: 'editor',
					subscribed: false,
					invited: false,
				},
			] ),
			status: 200,
		} );

		const { findByText, getByRole } = render( <InviteOthersToSubscribe />, {
			registry,
		} );

		await findByText( 'Eligible User' );

		fireEvent.mouseOver( getByRole( 'tooltip' ) );

		expect(
			await findByText(
				/You can only invite users who have access to the dashboard/i
			)
		).toBeInTheDocument();
		await act( waitForDefaultTimeouts );
	} );

	it( 'clearing search resets to unfiltered results', async () => {
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createSubscribersResponse(
				[
					{
						id: 2,
						displayName: 'Unfiltered User',
						email: 'first@example.com',
						role: 'editor',
						subscribed: false,
						invited: false,
					},
				],
				{ total: 7 }
			),
			status: 200,
		} );
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createSubscribersResponse( [
				{
					id: 3,
					displayName: 'Filtered User',
					email: 'filtered@example.com',
					role: 'editor',
					subscribed: false,
					invited: false,
				},
			] ),
			status: 200,
		} );

		const { findByLabelText, findByText, getByLabelText } = render(
			<InviteOthersToSubscribe />,
			{
				registry,
			}
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
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createSubscribersResponse(
				[
					{
						id: 2,
						displayName: 'Unfiltered User',
						email: 'first@example.com',
						role: 'editor',
						subscribed: false,
						invited: false,
					},
				],
				{ total: 7 }
			),
			status: 200,
		} );
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createSubscribersResponse( [
				{
					id: 3,
					displayName: 'Filtered User',
					email: 'filtered@example.com',
					role: 'editor',
					subscribed: false,
					invited: false,
				},
			] ),
			status: 200,
		} );

		const { findByLabelText, findByText } = render(
			<InviteOthersToSubscribe />,
			{
				registry,
			}
		);

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

		await act( waitForDefaultTimeouts );
	} );

	it( 'renders null when user does not have MANAGE_OPTIONS capability', () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );

		const { container } = render( <InviteOthersToSubscribe />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
