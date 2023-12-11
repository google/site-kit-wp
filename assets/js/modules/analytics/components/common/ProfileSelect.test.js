/**
 * Profile Select component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import apiFetchMock from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import ProfileSelect from './ProfileSelect';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import { render, act } from '../../../../../../tests/js/test-utils';

// Mock apiFetch so we know if it's called.
jest.mock( '@wordpress/api-fetch' );
apiFetchMock.mockImplementation( ( ...args ) => {
	// eslint-disable-next-line no-console
	console.warn( 'apiFetch', ...args );
} );

const setupRegistry = ( { dispatch } ) => {
	const {
		id,
		webPropertyId: propertyID, // eslint-disable-line sitekit/acronym-case
		accountId: accountID, // eslint-disable-line sitekit/acronym-case
	} = fixtures.propertiesProfiles.profiles[ 0 ];

	dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
	dispatch( MODULES_ANALYTICS ).setPropertyID( propertyID );
	dispatch( MODULES_ANALYTICS ).setProfileID( id );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts(
		fixtures.accountsPropertiesProfiles.accounts
	);
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

	dispatch( MODULES_ANALYTICS ).receiveGetProperties(
		fixtures.accountsPropertiesProfiles.properties,
		{ accountID }
	);
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [
		accountID,
	] );

	dispatch( MODULES_ANALYTICS ).receiveGetProfiles(
		fixtures.propertiesProfiles.profiles,
		{ accountID, propertyID }
	);
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProfiles', [
		accountID,
		propertyID,
	] );
};

const setupRegistryWithExistingTag = ( { dispatch } ) => {
	const existingTag = {
		accountID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].accountId, // eslint-disable-line sitekit/acronym-case
		propertyID:
			fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId, // eslint-disable-line sitekit/acronym-case
	};
	const { id } = fixtures.propertiesProfiles.profiles[ 0 ];

	dispatch( MODULES_ANALYTICS ).setAccountID( existingTag.accountID );
	dispatch( MODULES_ANALYTICS ).setPropertyID( existingTag.propertyID );
	dispatch( MODULES_ANALYTICS ).setProfileID( id );
	dispatch( MODULES_ANALYTICS ).receiveGetProperties(
		fixtures.accountsPropertiesProfiles.properties,
		{ accountID: existingTag.accountID }
	);

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts(
		fixtures.accountsPropertiesProfiles.accounts
	);
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [
		existingTag.accountID,
	] );
	dispatch( MODULES_ANALYTICS ).receiveGetProfiles(
		fixtures.accountsPropertiesProfiles.profiles,
		{ accountID: existingTag.accountID, propertyID: existingTag.propertyID }
	);

	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProfiles', [
		existingTag.accountID,
		existingTag.propertyID,
	] );
	dispatch( MODULES_ANALYTICS ).receiveGetExistingTag(
		existingTag.propertyID
	);
};

describe( 'ProfileSelect', () => {
	afterEach( () => apiFetchMock.mockClear() );
	afterAll( () => jest.restoreAllMocks() );

	it( 'should render an option for each profile of the currently selected account and property.', () => {
		const { getAllByRole } = render( <ProfileSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength(
			fixtures.propertiesProfiles.profiles.length
		);
	} );

	it( 'should display profile options of an existing account when present, and not be disabled.', () => {
		const { container, getAllByRole, registry } = render(
			<ProfileSelect />,
			{ setupRegistry: setupRegistryWithExistingTag }
		);

		const currentPropertyID = registry
			.select( MODULES_ANALYTICS )
			.getPropertyID();
		const existingTagPropertyID = registry
			.select( MODULES_ANALYTICS )
			.getExistingTag();
		expect( existingTagPropertyID ).toEqual( currentPropertyID );

		const existingTagProfiles =
			fixtures.accountsPropertiesProfiles.profiles.filter(
				// eslint-disable-next-line sitekit/acronym-case
				( { webPropertyId } ) => webPropertyId === existingTagPropertyID
			);

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( existingTagProfiles.length );

		const selectedText = container.querySelector(
			'.mdc-select__selected-text'
		);
		expect( selectedText ).toHaveAttribute( 'aria-disabled', 'false' );
		expect(
			container.querySelector(
				'.googlesitekit-analytics__select-profile'
			)
		).not.toHaveClass( 'mdc-select--disabled' );
		expect( apiFetchMock ).not.toHaveBeenCalled();
	} );

	it( 'should disable the profile select if the user does not have module access', () => {
		const { container, getAllByRole } = render(
			<ProfileSelect hasModuleAccess={ false } />,
			{ setupRegistry: setupRegistryWithExistingTag }
		);

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );

		// Verify that the Profile select dropdown is disabled.
		[
			'.googlesitekit-analytics__select-profile',
			'.mdc-select--disabled',
		].forEach( ( className ) => {
			expect( container.querySelector( className ) ).toBeInTheDocument();
		} );
	} );

	it( 'should not render if account ID is not valid', async () => {
		const { container, registry } = render( <ProfileSelect />, {
			setupRegistry( { dispatch } ) {
				setupRegistry( { dispatch } );
				dispatch( MODULES_ANALYTICS ).finishResolution(
					'getProperties',
					[ '0' ]
				);
			},
		} );

		// A valid accountID is provided, so ensure it is not currently disabled.
		expect(
			container.querySelector(
				'.googlesitekit-analytics__select-profile'
			)
		).not.toHaveClass( 'mdc-select--disabled' );

		await act( () =>
			registry.dispatch( MODULES_ANALYTICS ).setAccountID( '0' )
		);

		// An empty accountID is invalid, so ensure the select is not rendered.
		expect( container ).toBeEmptyDOMElement();

		await act( () =>
			registry.dispatch( MODULES_ANALYTICS ).setAccountID(
				// eslint-disable-next-line sitekit/acronym-case
				fixtures.propertiesProfiles.profiles[ 0 ].accountId
			)
		);

		// A valid account ID was set, so the select should be visible.
		expect(
			container.querySelector(
				'.googlesitekit-analytics__select-profile'
			)
		).toBeInTheDocument();
	} );

	it( 'should not render if account ID or property ID are invalid', async () => {
		const { container, registry } = render( <ProfileSelect />, {
			setupRegistry( { dispatch } ) {
				setupRegistry( { dispatch } );
				dispatch( MODULES_ANALYTICS ).finishResolution(
					'getProperties',
					[ '0' ]
				);
			},
		} );

		const validAccountID = registry
			.select( MODULES_ANALYTICS )
			.getAccountID();
		const validPropertyID = registry
			.select( MODULES_ANALYTICS )
			.getPropertyID();

		// A valid accountID is provided, so the select component should not be disabled.
		expect(
			container.querySelector(
				'.googlesitekit-analytics__select-profile'
			)
		).not.toHaveClass( 'mdc-select--disabled' );

		await act( () =>
			registry
				.dispatch( MODULES_ANALYTICS )
				.setAccountID( validAccountID )
		);
		await act( () =>
			registry.dispatch( MODULES_ANALYTICS ).setPropertyID( '0' )
		);

		// The accountID is valid, but an empty propertyID is invalid, so ensure the select is not rendered.
		expect( container ).toBeEmptyDOMElement();

		await act( () =>
			registry
				.dispatch( MODULES_ANALYTICS )
				.setPropertyID( validPropertyID )
		);

		// After setting a valid property ID, the select should be visible.
		expect(
			container.querySelector(
				'.googlesitekit-analytics__select-profile'
			)
		).toBeInTheDocument();
	} );
} );
