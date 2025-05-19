/**
 * UserRoleSelect component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import {
	render,
	fireEvent,
	createTestRegistry,
} from '../../../../tests/js/test-utils';
import UserRoleSelect from './UserRoleSelect';

const dashboardSharingDataBaseVar = '_googlesitekitDashboardSharingData';
const sharingSettings = {
	'search-console': {
		sharedRoles: [ 'editor', 'administrator' ],
		management: 'all_admins',
	},
};
const shareableRoles = [
	{
		id: 'administrator',
		displayName: 'Administrator',
	},
	{
		id: 'editor',
		displayName: 'Editor',
	},
	{
		id: 'author',
		displayName: 'Author',
	},
	{
		id: 'contributor',
		displayName: 'Contributor',
	},
];
const dashboardSharingData = {
	settings: sharingSettings,
	roles: shareableRoles,
};

describe( 'CurrentSurvey', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ dashboardSharingDataBaseVar ];
	} );

	it( 'should not render anything if there are no shareableRoles', async () => {
		const { container, waitForRegistry } = render(
			<UserRoleSelect moduleSlug="search-console" />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( container.firstChild ).toBeNull();
	} );

	it( 'should render the share icon button if there are shareableRoles', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveShareableRoles( shareableRoles );
		global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

		const { container, waitForRegistry } = render(
			<UserRoleSelect moduleSlug="search-console" />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-user-role-select__button' )
		).toBeInTheDocument();
	} );

	it( 'should render the "Add roles" button if there are no shared roles yet for the module', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveShareableRoles( shareableRoles );
		global[ dashboardSharingDataBaseVar ] = {
			settings: {
				'search-console': {
					sharedRoles: [],
				},
			},
		};

		const { container, waitForRegistry } = render(
			<UserRoleSelect moduleSlug="search-console" />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const addRolesElement = container.querySelector(
			'.googlesitekit-user-role-select__add-roles'
		);
		expect( addRolesElement ).toBeInTheDocument();

		expect( addRolesElement.textContent ).toEqual( 'Add roles' );
	} );

	it( 'should display the selected roles as comma separated roles', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveShareableRoles( shareableRoles );
		global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

		const { container, waitForRegistry } = render(
			<UserRoleSelect moduleSlug="search-console" />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const currentRolesElement = container.querySelector(
			'.googlesitekit-user-role-select__current-roles'
		);
		expect( currentRolesElement ).toBeInTheDocument();

		expect( currentRolesElement.textContent ).toEqual(
			'Administrator, Editor'
		);
	} );

	it( 'should toggle the chips when the share button is clicked', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveShareableRoles( shareableRoles );
		global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

		const { container, waitForRegistry } = render(
			<UserRoleSelect moduleSlug="search-console" />,
			{
				registry,
			}
		);

		await waitForRegistry();

		fireEvent.click(
			container.querySelector( '.googlesitekit-user-role-select__button' )
		);

		expect(
			container.querySelector(
				'.googlesitekit-user-role-select__chipset'
			)
		).toBeInTheDocument();

		fireEvent.click(
			container.querySelector( '.googlesitekit-user-role-select__button' )
		);

		expect(
			container.querySelector(
				'.googlesitekit-user-role-select__chipset'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should display the "All" chip as selected if all the roles are selected', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveShareableRoles( shareableRoles );
		global[ dashboardSharingDataBaseVar ] = {
			settings: {
				'search-console': {
					sharedRoles: [
						'administrator',
						'editor',
						'contributor',
						'author',
					],
				},
			},
		};

		const { container, waitForRegistry } = render(
			<UserRoleSelect moduleSlug="search-console" />,
			{
				registry,
			}
		);

		await waitForRegistry();

		fireEvent.click(
			container.querySelector( '.googlesitekit-user-role-select__button' )
		);

		expect(
			container.querySelector(
				'.googlesitekit-user-role-select__chip--all'
			)
		).toHaveClass( 'mdc-chip--selected' );
	} );

	it( 'should select/deselect all the chips if the "All" chip is clicked', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveShareableRoles( shareableRoles );
		global[ dashboardSharingDataBaseVar ] = {
			settings: {
				'search-console': {
					sharedRoles: [ 'administrator' ],
				},
			},
		};

		const { container, waitForRegistry } = render(
			<UserRoleSelect moduleSlug="search-console" />,
			{
				registry,
			}
		);

		await waitForRegistry();

		fireEvent.click(
			container.querySelector( '.googlesitekit-user-role-select__button' )
		);
		fireEvent.click(
			container.querySelector(
				'.googlesitekit-user-role-select__chip--all'
			)
		);

		expect(
			container.querySelectorAll( '.mdc-chip--selected' )
		).toHaveLength( 5 );

		fireEvent.click(
			container.querySelector(
				'.googlesitekit-user-role-select__chip--all'
			)
		);

		expect(
			container.querySelectorAll( '.mdc-chip--selected' )
		).toHaveLength( 0 );
	} );

	it( 'should deselect the "All" chip if a role is deselected', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveShareableRoles( shareableRoles );
		global[ dashboardSharingDataBaseVar ] = {
			settings: {
				'search-console': {
					sharedRoles: [
						'administrator',
						'editor',
						'contributor',
						'author',
					],
				},
			},
		};

		const { container, waitForRegistry } = render(
			<UserRoleSelect moduleSlug="search-console" />,
			{
				registry,
			}
		);

		await waitForRegistry();

		fireEvent.click(
			container.querySelector( '.googlesitekit-user-role-select__button' )
		);

		const allChipElement = container.querySelector(
			'.googlesitekit-user-role-select__chip--all'
		);
		expect( allChipElement ).toHaveClass( 'mdc-chip--selected' );

		fireEvent.click(
			container.querySelector( '[data-chip-id="contributor"]' )
		);
		expect( allChipElement ).not.toHaveClass( 'mdc-chip--selected' );
	} );

	it( 'should select/deselect a chip upon clicking', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveShareableRoles( shareableRoles );
		global[ dashboardSharingDataBaseVar ] = {
			settings: {
				'search-console': {
					sharedRoles: [
						'administrator',
						'editor',
						'contributor',
						'author',
					],
				},
			},
		};

		const { container, waitForRegistry } = render(
			<UserRoleSelect moduleSlug="search-console" />,
			{
				registry,
			}
		);

		await waitForRegistry();

		fireEvent.click(
			container.querySelector( '.googlesitekit-user-role-select__button' )
		);

		const contributorElement = container.querySelector(
			'[data-chip-id="contributor"]'
		);
		expect( contributorElement ).toHaveClass( 'mdc-chip--selected' );
		fireEvent.click( contributorElement );
		expect( contributorElement ).not.toHaveClass( 'mdc-chip--selected' );
	} );

	it( 'should select/deselect a chip upon pressing the ENTER key', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveShareableRoles( shareableRoles );
		global[ dashboardSharingDataBaseVar ] = {
			settings: {
				'search-console': {
					sharedRoles: [
						'administrator',
						'editor',
						'contributor',
						'author',
					],
				},
			},
		};

		const { container, waitForRegistry } = render(
			<UserRoleSelect moduleSlug="search-console" />,
			{
				registry,
			}
		);

		await waitForRegistry();

		fireEvent.click(
			container.querySelector( '.googlesitekit-user-role-select__button' )
		);

		const contributorElement = container.querySelector(
			'[data-chip-id="contributor"]'
		);
		expect( contributorElement ).toHaveClass( 'mdc-chip--selected' );
		fireEvent.keyDown( contributorElement, { keyCode: ENTER } );
		expect( contributorElement ).not.toHaveClass( 'mdc-chip--selected' );
	} );
} );
