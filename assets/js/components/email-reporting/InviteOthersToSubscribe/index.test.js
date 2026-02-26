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
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	provideUserInfo,
	render,
	waitFor,
} from '../../../../../tests/js/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { PERMISSION_MANAGE_OPTIONS } from '@/js/googlesitekit/datastore/user/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import InviteOthersToSubscribe from '.';

describe( 'InviteOthersToSubscribe', () => {
	const eligibleSubscribersEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting-eligible-subscribers'
	);
	const inviteUserEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting-invite-user'
	);

	const defaultEligibleUsers = [
		{
			id: 2,
			displayName: 'MainAdminName',
			name: 'MainAdminName',
			email: 'mainadmin@example.com',
			role: 'administrator',
			subscribed: false,
			invited: false,
		},
	];

	const searchEligibleUsers = [
		{
			id: 3,
			displayName: 'BetaUser',
			name: 'BetaUser',
			email: 'beta@example.com',
			role: 'editor',
			subscribed: false,
			invited: false,
		},
	];

	function createEligibleSubscribersResponse(
		users,
		{ total = users.length, totalPages = 1 } = {}
	) {
		return {
			users,
			total,
			totalPages,
		};
	}

	function setupRegistry() {
		const registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserInfo( registry, { id: 1 } );
		provideUserCapabilities( registry );

		registry
			.dispatch( CORE_UI )
			.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );

		return registry;
	}

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'renders null when user does not have MANAGE_OPTIONS capability', () => {
		const registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserInfo( registry, { id: 1 } );

		fetchMock.get( eligibleSubscribersEndpoint, {
			body: {
				users: [],
				total: 0,
				totalPages: 1,
			},
			status: 200,
		} );

		provideUserInfo( registry, { id: 1 } );
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );

		const { container } = render( <InviteOthersToSubscribe />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'fetches eligible subscribers with empty search term on initial render', async () => {
		const registry = setupRegistry();

		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createEligibleSubscribersResponse( defaultEligibleUsers, {
				total: 7,
			} ),
			status: 200,
		} );

		const { getByText } = render( <InviteOthersToSubscribe />, {
			registry,
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( eligibleSubscribersEndpoint, {
				queryParams: {
					page: 1,
					search: '',
				},
			} )
		);

		expect( getByText( 'MainAdminName' ) ).toBeInTheDocument();
	} );

	it( 'does not fetch eligible subscribers until panel is opened', async () => {
		const registry = setupRegistry();

		registry
			.dispatch( CORE_UI )
			.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, false );

		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createEligibleSubscribersResponse( defaultEligibleUsers, {
				total: 7,
			} ),
			status: 200,
		} );

		render( <InviteOthersToSubscribe />, {
			registry,
		} );

		expect( fetchMock ).toHaveFetchedTimes( 0 );

		act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( eligibleSubscribersEndpoint, {
				queryParams: {
					page: 1,
					search: '',
				},
			} )
		);
	} );

	it( 'triggers server search after 300ms debounce when typing', async () => {
		const registry = setupRegistry();

		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createEligibleSubscribersResponse( defaultEligibleUsers, {
				total: 7,
			} ),
			status: 200,
		} );
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createEligibleSubscribersResponse( searchEligibleUsers, {
				total: 1,
			} ),
			status: 200,
		} );

		const { getByLabelText, getByText, queryByText } = render(
			<InviteOthersToSubscribe />,
			{ registry }
		);

		await waitFor( () =>
			expect(
				getByLabelText( 'Search user name, role or email' )
			).toBeInTheDocument()
		);

		const initialFetchCount = fetchMock.calls(
			eligibleSubscribersEndpoint
		).length;

		fireEvent.change( getByLabelText( 'Search user name, role or email' ), {
			target: { value: 'beta' },
		} );

		expect( fetchMock.calls( eligibleSubscribersEndpoint ).length ).toBe(
			initialFetchCount
		);

		await waitFor( () =>
			expect(
				fetchMock.calls( eligibleSubscribersEndpoint ).length
			).toBe( initialFetchCount + 1 )
		);
		const [ searchRequestURL ] = fetchMock.lastCall(
			eligibleSubscribersEndpoint
		);
		const parsedSearchURL = new URL(
			typeof searchRequestURL === 'string'
				? searchRequestURL
				: searchRequestURL.url,
			'https://example.test'
		);

		expect( parsedSearchURL.searchParams.get( 'page' ) ).toBe( '1' );
		expect( parsedSearchURL.searchParams.get( 'search' ) ).toBe( 'beta' );

		await waitFor( () =>
			expect( getByText( 'BetaUser' ) ).toBeInTheDocument()
		);

		expect( queryByText( 'MainAdminName' ) ).not.toBeInTheDocument();
	} );

	it( 'clearing search restores cached unfiltered results', async () => {
		const registry = setupRegistry();

		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createEligibleSubscribersResponse( defaultEligibleUsers, {
				total: 7,
			} ),
			status: 200,
		} );
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createEligibleSubscribersResponse( searchEligibleUsers ),
			status: 200,
		} );

		const { getByLabelText, getByText, queryByText } = render(
			<InviteOthersToSubscribe />,
			{
				registry,
			}
		);

		await waitFor( () =>
			expect( getByText( 'MainAdminName' ) ).toBeInTheDocument()
		);

		const searchInput = getByLabelText( 'Search user name, role or email' );

		fireEvent.change( searchInput, {
			target: { value: 'beta' },
		} );

		await waitFor( () =>
			expect( getByText( 'BetaUser' ) ).toBeInTheDocument()
		);

		fireEvent.click( getByLabelText( 'Clear search' ) );

		await waitFor( () => expect( searchInput ).toHaveValue( '' ) );
		await waitFor( () =>
			expect( getByText( 'MainAdminName' ) ).toBeInTheDocument()
		);
		expect( queryByText( 'BetaUser' ) ).not.toBeInTheDocument();
		expect( fetchMock ).toHaveFetchedTimes( 2 );
	} );

	it( 'resets search and invite results when panel opens', async () => {
		const registry = setupRegistry();
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createEligibleSubscribersResponse( defaultEligibleUsers, {
				total: 7,
			} ),
			status: 200,
		} );
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createEligibleSubscribersResponse( defaultEligibleUsers, {
				total: 7,
			} ),
			status: 200,
		} );
		fetchMock.getOnce( eligibleSubscribersEndpoint, {
			body: createEligibleSubscribersResponse( defaultEligibleUsers, {
				total: 7,
			} ),
			status: 200,
		} );
		fetchMock.postOnce( inviteUserEndpoint, {
			body: {
				code: 'internal_error',
				message: 'Failed to send invitation',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { getByLabelText, getByRole, getByText, queryByText } = render(
			<InviteOthersToSubscribe />,
			{
				registry,
			}
		);

		await waitFor( () =>
			expect(
				getByLabelText( 'Search user name, role or email' )
			).toBeInTheDocument()
		);
		const searchInput = getByLabelText( 'Search user name, role or email' );

		fireEvent.change( searchInput, {
			target: { value: 'beta' },
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( eligibleSubscribersEndpoint, {
				queryParams: {
					page: 1,
					search: 'beta',
				},
			} )
		);

		fireEvent.click( getByRole( 'button', { name: /send invite/i } ) );

		await waitFor( () =>
			expect( getByText( 'Failed to send invite.' ) ).toBeInTheDocument()
		);

		act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, false );
		} );

		expect( searchInput ).toHaveValue( 'beta' );
		expect( getByText( 'Failed to send invite.' ) ).toBeInTheDocument();

		act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
		} );

		await waitFor( () => expect( searchInput ).toHaveValue( '' ) );
		await waitFor( () =>
			expect(
				queryByText( 'Failed to send invite.' )
			).not.toBeInTheDocument()
		);
		expect(
			getByRole( 'button', { name: /send invite/i } )
		).toBeInTheDocument();

		consoleErrorSpy.mockRestore();
	} );
} );
