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
	createTestRegistry,
	freezeFetch,
	provideUserCapabilities,
	provideUserInfo,
	render,
} from '../../../../../tests/js/test-utils';
import { PERMISSION_MANAGE_OPTIONS } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import InviteOthersToSubscribe from '.';

describe( 'InviteOthersToSubscribe', () => {
	let registry;

	const eligibleSubscribersEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting-eligible-subscribers'
	);

	const permissionsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/permissions'
	);

	const mockEligibleSubscribers = [
		{
			id: 2,
			displayName: 'MainAdminName',
			name: 'MainAdminName',
			email: 'someone@anybusiness.com',
			role: 'administrator',
			subscribed: false,
		},
		{
			id: 3,
			displayName: 'AdminName2',
			name: 'AdminName2',
			email: 'anotheradminname@anybusiness.com',
			role: 'administrator',
			subscribed: false,
		},
		{
			id: 4,
			displayName: 'AuthorName',
			name: 'AuthorName',
			email: 'admin2business@gmail.com',
			role: 'author',
			subscribed: false,
		},
	];

	beforeEach( () => {
		registry = createTestRegistry();

		freezeFetch( eligibleSubscribersEndpoint );
		freezeFetch( permissionsEndpoint );

		provideUserInfo( registry, { id: 1 } );
		provideUserCapabilities( registry );

		registry.dispatch( CORE_SITE ).receiveGetEligibleSubscribers( [] );
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getEligibleSubscribers', [] );
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

	it( 'shows empty state when no eligible users exist', () => {
		const { getByText } = render( <InviteOthersToSubscribe />, {
			registry,
		} );

		expect(
			getByText( 'No users are eligible to receive invitations.' )
		).toBeInTheDocument();
	} );

	it( 'shows user list when eligible users exist', async () => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetEligibleSubscribers( mockEligibleSubscribers );
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getEligibleSubscribers', [] );

		const { getByText, waitForRegistry } = render(
			<InviteOthersToSubscribe />,
			{
				registry,
			}
		);

		// Wait for async state updates before assertions.
		await waitForRegistry();

		expect( getByText( 'MainAdminName' ) ).toBeInTheDocument();
		expect( getByText( 'AdminName2' ) ).toBeInTheDocument();
		expect( getByText( 'AuthorName' ) ).toBeInTheDocument();
	} );

	it( 'hides search input when 6 or fewer eligible users', async () => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetEligibleSubscribers( mockEligibleSubscribers );
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getEligibleSubscribers', [] );

		const { queryByLabelText, getByText, waitForRegistry } = render(
			<InviteOthersToSubscribe />,
			{
				registry,
			}
		);

		// Wait for async state updates before assertions.
		await waitForRegistry();

		expect( getByText( 'MainAdminName' ) ).toBeInTheDocument();
		expect(
			queryByLabelText( 'Search user name, role, or email' )
		).not.toBeInTheDocument();
	} );

	it( 'shows search input when more than 6 eligible users', async () => {
		const manyUsers = [
			...mockEligibleSubscribers,
			{
				id: 5,
				displayName: 'User5',
				name: 'User5',
				email: 'user5@example.com',
				role: 'editor',
				subscribed: false,
			},
			{
				id: 6,
				displayName: 'User6',
				name: 'User6',
				email: 'user6@example.com',
				role: 'editor',
				subscribed: false,
			},
			{
				id: 7,
				displayName: 'User7',
				name: 'User7',
				email: 'user7@example.com',
				role: 'author',
				subscribed: false,
			},
			{
				id: 8,
				displayName: 'User8',
				name: 'User8',
				email: 'user8@example.com',
				role: 'contributor',
				subscribed: false,
			},
		];

		registry
			.dispatch( CORE_SITE )
			.receiveGetEligibleSubscribers( manyUsers );
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getEligibleSubscribers', [] );

		const { getByLabelText, waitForRegistry } = render(
			<InviteOthersToSubscribe />,
			{
				registry,
			}
		);

		// Wait for async state updates before assertions.
		await waitForRegistry();

		expect(
			getByLabelText( 'Search user name, role, or email' )
		).toBeInTheDocument();
	} );

	it( 'filters out already-subscribed users from the list', async () => {
		const usersWithSubscribed = [
			...mockEligibleSubscribers,
			{
				id: 5,
				displayName: 'SubscribedUser',
				name: 'SubscribedUser',
				email: 'subscribed@example.com',
				role: 'editor',
				subscribed: true,
			},
		];

		registry
			.dispatch( CORE_SITE )
			.receiveGetEligibleSubscribers( usersWithSubscribed );
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getEligibleSubscribers', [] );

		const { queryByText, getByText, waitForRegistry } = render(
			<InviteOthersToSubscribe />,
			{
				registry,
			}
		);

		// Wait for async state updates before assertions.
		await waitForRegistry();

		expect( getByText( 'MainAdminName' ) ).toBeInTheDocument();
		expect( queryByText( 'SubscribedUser' ) ).not.toBeInTheDocument();
	} );

	it( 'displays the info tooltip with eligibility explanation', () => {
		const { getByRole } = render( <InviteOthersToSubscribe />, {
			registry,
		} );

		expect( getByRole( 'tooltip' ) ).toBeInTheDocument();
	} );
} );
