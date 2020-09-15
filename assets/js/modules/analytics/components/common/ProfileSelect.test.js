/* eslint-disable sitekit/camelcase-acronyms */
/**
 * Profile Select component tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
	const { id, webPropertyId, accountId } = fixtures.propertiesProfiles.profiles[ 0 ];
	dispatch( STORE_NAME ).setAccountID( accountId );
	dispatch( STORE_NAME ).setPropertyID( webPropertyId );
	dispatch( STORE_NAME ).setProfileID( id );
	dispatch( STORE_NAME ).receiveGetProfiles( fixtures.propertiesProfiles.profiles, { accountID: accountId, propertyID: webPropertyId } );
};

const setupRegistryWithExistingTag = ( { dispatch } ) => {
	const existingTag = {
		accountID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].accountId,
		propertyID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId,
	};
	const { id } = fixtures.propertiesProfiles.profiles[ 0 ];
	dispatch( STORE_NAME ).setAccountID( existingTag.accountID );
	dispatch( STORE_NAME ).setPropertyID( existingTag.propertyID );
	dispatch( STORE_NAME ).setProfileID( id );
	dispatch( STORE_NAME ).receiveGetProfiles( fixtures.accountsPropertiesProfiles.profiles, { accountID: existingTag.accountID, propertyID: existingTag.propertyID } );
	dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
};

const setupEmptyRegistry = ( { dispatch } ) => {
	const accountID = fixtures.accountsPropertiesProfiles.profiles[ 0 ].accountId;
	const propertyID = fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId;
	dispatch( STORE_NAME ).setSettings( {} );
	dispatch( STORE_NAME ).receiveGetProfiles( [], { accountID, propertyID } );
};

describe( 'ProfileSelect', () => {
	afterEach( () => apiFetchMock.mockClear() );
	afterAll( () => jest.restoreAllMocks() );

	it( 'should render an option for each analytics profile of the currently selected account and property.', async () => {
		const { getAllByRole } = render( <ProfileSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new property".
		expect( listItems ).toHaveLength( fixtures.accountsPropertiesProfiles.profiles.length + 1 );
	} );

	it( 'should display profile options of an existing account when present, and not be disabled.', async () => {
		const { container, getAllByRole, registry } = render( <ProfileSelect />, { setupRegistry: setupRegistryWithExistingTag } );

		const currentPropertyID = registry.select( STORE_NAME ).getPropertyID();
		const existingTagPropertyID = registry.select( STORE_NAME ).getExistingTag();
		expect( existingTagPropertyID ).toEqual( currentPropertyID );

		const existingTagProfiles = fixtures.accountsPropertiesProfiles.profiles
			.filter( ( { webPropertyId } ) => webPropertyId === existingTagPropertyID );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( existingTagProfiles.length + 1 );

		const selectedText = container.querySelector( '.mdc-select__selected-text' );
		expect( selectedText ).toHaveAttribute( 'aria-disabled', 'false' );
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) )
			.not.toHaveClass( 'mdc-select--disabled' );
		expect( apiFetchMock ).not.toHaveBeenCalled();
	} );

	it( 'should be disabled when in the absence of an valid account or property ID.', async () => {
		const { container, registry } = render( <ProfileSelect />, { setupRegistry } );
		const validAccountID = registry.select( STORE_NAME ).getAccountID();

		// A valid accountID is provided, so ensure it is not currently disabled.
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) )
			.not.toHaveClass( 'mdc-select--disabled' );

		await act( () => registry.dispatch( STORE_NAME ).setAccountID( '0' ) );

		// An empty accountID is invalid, so ensure the select IS currently disabled.
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) )
			.toHaveClass( 'mdc-select--disabled' );

		await act( () => registry.dispatch( STORE_NAME ).setAccountID( validAccountID ) );
		await act( () => registry.dispatch( STORE_NAME ).setPropertyID( '0' ) );

		// The accountID is valid, but an empty propertyID is invalid, so ensure the select IS currently disabled.
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) )
			.toHaveClass( 'mdc-select--disabled' );
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
