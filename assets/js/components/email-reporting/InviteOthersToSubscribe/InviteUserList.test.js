/**
 * InviteUserList tests.
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
import { createTestRegistry, render } from '@tests/js/test-utils';
import InviteUserList from './InviteUserList';

describe( 'InviteUserList', () => {
	let registry;

	const mockUsers = [
		{
			id: 2,
			name: 'MainAdminName',
			email: 'someone@anybusiness.com',
			role: 'administrator',
		},
		{
			id: 3,
			name: 'EditorUser',
			email: 'editor@example.com',
			role: 'editor',
		},
		{
			id: 4,
			name: 'AuthorUser',
			email: 'author@example.com',
			role: 'author',
		},
	];

	const mockOnInviteResult = jest.fn();

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'renders all users when no search term is provided', () => {
		const { getByText } = render(
			<InviteUserList
				users={ mockUsers }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		expect( getByText( 'MainAdminName' ) ).toBeInTheDocument();
		expect( getByText( 'EditorUser' ) ).toBeInTheDocument();
		expect( getByText( 'AuthorUser' ) ).toBeInTheDocument();
	} );

	it( 'shows empty state when users array is empty', () => {
		const { getByText } = render(
			<InviteUserList
				users={ [] }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		expect(
			getByText( 'No users are eligible to receive invitations.' )
		).toBeInTheDocument();
	} );

	it( 'shows no search matches empty state when search term is present', () => {
		const { getByText } = render(
			<InviteUserList
				users={ [] }
				searchTerm="john"
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		expect(
			getByText( 'No users match your search.' )
		).toBeInTheDocument();
	} );

	it( 'shows loading state when isLoading is true', () => {
		const { container } = render(
			<InviteUserList
				users={ [] }
				onInviteResult={ mockOnInviteResult }
				isLoading
			/>,
			{ registry }
		);

		expect(
			container.querySelector( '.googlesitekit-invite-user-row--loading' )
		).toBeInTheDocument();
	} );

	it( 'passes inviteResults to individual rows', () => {
		const inviteResults = {
			2: { status: 'success' },
			3: { status: 'error', message: 'Failed' },
		};

		const { getByText } = render(
			<InviteUserList
				users={ mockUsers }
				inviteResults={ inviteResults }
				onInviteResult={ mockOnInviteResult }
			/>,
			{ registry }
		);

		expect( getByText( 'Invitation sent' ) ).toBeInTheDocument();
		expect( getByText( 'Failed to send invite.' ) ).toBeInTheDocument();
	} );
} );
