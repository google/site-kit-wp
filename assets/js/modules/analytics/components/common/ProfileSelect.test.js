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
import { STORE_NAME, PROFILE_CREATE } from '../../datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import { fireEvent, render, act } from '../../../../../../tests/js/test-utils';

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

	dispatch( STORE_NAME ).setAccountID( accountID );
	dispatch( STORE_NAME ).setPropertyID( propertyID );
	dispatch( STORE_NAME ).setProfileID( id );

	dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
	dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

	dispatch( STORE_NAME ).receiveGetProperties( fixtures.accountsPropertiesProfiles.properties, { accountID } );
	dispatch( STORE_NAME ).finishResolution( 'getProperties', [ accountID ] );

	dispatch( STORE_NAME ).receiveGetProfiles( fixtures.propertiesProfiles.profiles, { accountID, propertyID } );
	dispatch( STORE_NAME ).finishResolution( 'getProfiles', [ accountID, propertyID ] );
};

const setupRegistryWithExistingTag = ( { dispatch } ) => {
	const existingTag = {
		accountID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].accountId, // eslint-disable-line sitekit/acronym-case
		propertyID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId, // eslint-disable-line sitekit/acronym-case
	};
	const { id } = fixtures.propertiesProfiles.profiles[ 0 ];

	dispatch( STORE_NAME ).setAccountID( existingTag.accountID );
	dispatch( STORE_NAME ).setPropertyID( existingTag.propertyID );
	dispatch( STORE_NAME ).setProfileID( id );
	dispatch( STORE_NAME ).receiveGetProperties( fixtures.accountsPropertiesProfiles.properties, { accountID: existingTag.accountID } );

	dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
	dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

	dispatch( STORE_NAME ).finishResolution( 'getProperties', [ existingTag.accountID ] );
	dispatch( STORE_NAME ).receiveGetProfiles( fixtures.accountsPropertiesProfiles.profiles, { accountID: existingTag.accountID, propertyID: existingTag.propertyID } );

	dispatch( STORE_NAME ).finishResolution( 'getProfiles', [ existingTag.accountID, existingTag.propertyID ] );
	dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
};

const setupEmptyRegistry = ( { dispatch } ) => {
	const accountID = fixtures.accountsPropertiesProfiles.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
	const propertyID = fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId; // eslint-disable-line sitekit/acronym-case

	dispatch( STORE_NAME ).setSettings( {} );
	dispatch( STORE_NAME ).setAccountID( accountID );
	dispatch( STORE_NAME ).setPropertyID( propertyID );

	dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
	dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

	dispatch( STORE_NAME ).receiveGetProperties( fixtures.accountsPropertiesProfiles.properties, { accountID } );
	dispatch( STORE_NAME ).finishResolution( 'getProperties', [ accountID ] );

	dispatch( STORE_NAME ).receiveGetProfiles( [], { accountID, propertyID } );
	dispatch( STORE_NAME ).finishResolution( 'getProfiles', [ accountID, propertyID ] );
};

describe( 'ProfileSelect', () => {
	afterEach( () => apiFetchMock.mockClear() );
	afterAll( () => jest.restoreAllMocks() );

	it( 'should render an option for each profile of the currently selected account and property.', async () => {
		const { getAllByRole } = render( <ProfileSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new property".
		expect( listItems ).toHaveLength( fixtures.propertiesProfiles.profiles.length + 1 );
	} );

	it( 'should display profile options of an existing account when present, and not be disabled.', async () => {
		const { container, getAllByRole, registry } = render( <ProfileSelect />, { setupRegistry: setupRegistryWithExistingTag } );

		const currentPropertyID = registry.select( STORE_NAME ).getPropertyID();
		const existingTagPropertyID = registry.select( STORE_NAME ).getExistingTag();
		expect( existingTagPropertyID ).toEqual( currentPropertyID );

		const existingTagProfiles = fixtures.accountsPropertiesProfiles.profiles
			.filter( ( { webPropertyId } ) => webPropertyId === existingTagPropertyID ); // eslint-disable-line sitekit/acronym-case

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( existingTagProfiles.length + 1 );

		const selectedText = container.querySelector( '.mdc-select__selected-text' );
		expect( selectedText ).toHaveAttribute( 'aria-disabled', 'false' );
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) )
			.not.toHaveClass( 'mdc-select--disabled' );
		expect( apiFetchMock ).not.toHaveBeenCalled();
	} );

	it( 'should not render if account ID is not valid', async () => {
		const { container, registry } = render( <ProfileSelect />, {
			setupRegistry( { dispatch } ) {
				setupRegistry( { dispatch } );
				dispatch( STORE_NAME ).finishResolution( 'getProperties', [ '0' ] );
			},
		} );

		// A valid accountID is provided, so ensure it is not currently disabled.
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) )
			.not.toHaveClass( 'mdc-select--disabled' );

		await act( () => registry.dispatch( STORE_NAME ).setAccountID( '0' ) );

		// An empty accountID is invalid, so ensure the select is not rendered.
		expect( container ).toBeEmptyDOMElement();

		// eslint-disable-next-line sitekit/acronym-case
		await act( () => registry.dispatch( STORE_NAME ).setAccountID( fixtures.propertiesProfiles.profiles[ 0 ].accountId ) );

		// A valid account ID was set, so the select should be visible.
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) ).toBeInTheDocument();
	} );

	it( 'should not render if account ID or property ID are invalid', async () => {
		const { container, registry } = render( <ProfileSelect />, {
			setupRegistry( { dispatch } ) {
				setupRegistry( { dispatch } );
				dispatch( STORE_NAME ).finishResolution( 'getProperties', [ '0' ] );
			},
		} );

		const validAccountID = registry.select( STORE_NAME ).getAccountID();
		const validPropertyID = registry.select( STORE_NAME ).getPropertyID();

		// A valid accountID is provided, so the select component should not be disabled.
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) )
			.not.toHaveClass( 'mdc-select--disabled' );

		await act( () => registry.dispatch( STORE_NAME ).setAccountID( validAccountID ) );
		await act( () => registry.dispatch( STORE_NAME ).setPropertyID( '0' ) );

		// The accountID is valid, but an empty propertyID is invalid, so ensure the select is not rendered.
		expect( container ).toBeEmptyDOMElement();

		await act( () => registry.dispatch( STORE_NAME ).setPropertyID( validPropertyID ) );

		// After setting a valid property ID, the select should be visible.
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) ).toBeInTheDocument();
	} );

	it( 'should render a select box with only an option to create a new property if no properties are available.', async () => {
		const { getAllByRole } = render( <ProfileSelect />, { setupRegistry: setupEmptyRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ 0 ].textContent ).toMatch( /set up a new view/i );
	} );

	it( 'should update profileID in the store when a new item is selected', async () => {
		const { getByText, container, registry } = render( <ProfileSelect />, { setupRegistry } );
		const originalProfileID = registry.select( STORE_NAME ).getProfileID();

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getByText( /set up a new view/i ) );

		const newProfileID = registry.select( STORE_NAME ).getProfileID();
		expect( originalProfileID ).not.toEqual( newProfileID );
		expect( newProfileID ).toEqual( PROFILE_CREATE );
	} );
} );
