/**
 * Property Select component tests.
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
 * Internal dependencies
 */
import PropertySelect from './PropertySelect';
import { STORE_NAME, ACCOUNT_CREATE } from '../../datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import { fireEvent, muteFetch, render, act } from '../../../../../../tests/js/test-utils';

const setupRegistry = ( { dispatch } ) => {
	const { properties, profiles } = fixtures.accountsPropertiesProfiles;
	const propertyID = properties[ 0 ].id;
	const accountID = properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
	dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	dispatch( STORE_NAME ).setAccountID( accountID );
	dispatch( STORE_NAME ).receiveGetExistingTag( null );

	dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
	dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

	dispatch( STORE_NAME ).receiveGetProperties( fixtures.accountsPropertiesProfiles.properties, { accountID } );
	dispatch( STORE_NAME ).finishResolution( 'getProperties', [ accountID ] );

	dispatch( STORE_NAME ).receiveGetProfiles( profiles, { accountID, propertyID } );
	dispatch( STORE_NAME ).finishResolution( 'getProfiles', [ accountID, propertyID ] );
};

const setupRegistryWithExistingTag = ( { dispatch } ) => {
	const accountID = fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
	dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	dispatch( STORE_NAME ).receiveGetExistingTag( fixtures.getTagPermissionsAccess.propertyID );
	// Existing tag IDs are set in the resolver so we have to fill those here.
	dispatch( STORE_NAME ).setAccountID( fixtures.getTagPermissionsAccess.accountID );
	dispatch( STORE_NAME ).setPropertyID( fixtures.getTagPermissionsAccess.propertyID );

	dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
	dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

	dispatch( STORE_NAME ).receiveGetProperties( fixtures.accountsPropertiesProfiles.properties, { accountID } );
	dispatch( STORE_NAME ).finishResolution( 'getProperties', [ accountID ] );
};

const setupEmptyRegistry = ( { dispatch } ) => {
	const { properties } = fixtures.accountsPropertiesProfiles;
	const accountID = properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
	dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	dispatch( STORE_NAME ).setSettings( {} );
	dispatch( STORE_NAME ).setAccountID( accountID );
	dispatch( STORE_NAME ).receiveGetExistingTag( null );

	dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
	dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

	dispatch( STORE_NAME ).receiveGetProperties( [], { accountID } );
	dispatch( STORE_NAME ).finishResolution( 'getProperties', [ accountID ] );
};

describe( 'PropertySelect', () => {
	it( 'should render an option for each analytics property of the currently selected account.', async () => {
		const { getAllByRole } = render( <PropertySelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new property".
		expect( listItems ).toHaveLength( fixtures.accountsPropertiesProfiles.properties.length + 1 );
	} );

	it( 'should pre-select an existing tag when present, and be disabled', async () => {
		const { container } = render( <PropertySelect />, { setupRegistry: setupRegistryWithExistingTag } );

		const existingTagPropertyID = fixtures.getTagPermissionsAccess.propertyID;
		const existingTagProperty = fixtures.accountsPropertiesProfiles.properties.find( ( { id } ) => id === existingTagPropertyID );
		const selectedText = container.querySelector( '.mdc-select__selected-text' );
		expect( selectedText ).toHaveTextContent( existingTagProperty.name );
		expect( selectedText ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( container.querySelector( '.googlesitekit-analytics__select-property' ) )
			.toHaveClass( 'mdc-select--disabled' );
	} );

	it( 'should not render if account ID is invalid', () => {
		const { container, registry } = render( <PropertySelect />, {
			setupRegistry( { dispatch } ) {
				setupRegistry( { dispatch } );
				dispatch( STORE_NAME ).finishResolution( 'getProperties', [ ACCOUNT_CREATE ] );
			},
		} );

		// A valid accountID is provided, so ensure it is not currently disabled.
		const selectWrapper = container.querySelector( '.googlesitekit-analytics__select-property' );
		const selectedText = container.querySelector( '.mdc-select__selected-text' );
		expect( selectWrapper ).not.toHaveClass( 'mdc-select--disabled' );
		expect( selectedText ).not.toHaveAttribute( 'aria-disabled', 'true' );

		act( () => {
			registry.dispatch( STORE_NAME ).setAccountID( 'abcd' );
		} );

		// abcd is an invalid account ID, so ensure the property select dropdown is not rendered.
		expect( container ).toBeEmptyDOMElement();

		act( () => {
			const accountID = fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
			registry.dispatch( STORE_NAME ).setAccountID( accountID );
		} );

		// A valid account ID was set, so the select should be visible.
		expect( container.querySelector( '.googlesitekit-analytics__select-property' ) ).toBeInTheDocument();
	} );

	it( 'should render a select box with only an option to create a new property if no properties are available.', async () => {
		const { getAllByRole } = render( <PropertySelect />, { setupRegistry: setupEmptyRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ 0 ].textContent ).toMatch( /set up a new property/i );
	} );

	it( 'should update propertyID in the store when a new item is selected', async () => {
		const { getAllByRole, container, registry } = render( <PropertySelect />, { setupRegistry } );
		const originalPropertyID = registry.select( STORE_NAME ).getPropertyID();

		muteFetch( /^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/, [] );
		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 1 ] );

		const newPropertyID = registry.select( STORE_NAME ).getPropertyID();
		expect( originalPropertyID ).not.toEqual( newPropertyID );
		expect( newPropertyID ).toEqual( fixtures.accountsPropertiesProfiles.properties[ 1 ].id );
	} );

	it( 'should update internalWebPropertyID in the store when an item is selected', () => {
		const { getAllByRole, container, registry } = render( <PropertySelect />, { setupRegistry } );
		const accountID = fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
		const originalID = registry.select( STORE_NAME ).getInternalWebPropertyID();
		const properties = registry.select( STORE_NAME ).getProperties( accountID );
		const targetProperty = properties[ 1 ];

		muteFetch( /^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/, [] );

		act( () => {
			// Click the label to expose the elements in the menu.
			fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
			// Click this element to select it and fire the onChange event.
			fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 1 ] );
		} );

		const newPropertyID = registry.select( STORE_NAME ).getPropertyID();
		expect( targetProperty.id ).toEqual( newPropertyID );
		const newID = registry.select( STORE_NAME ).getInternalWebPropertyID();
		expect( originalID ).not.toEqual( newID );
		expect( newID ).toEqual( targetProperty.internalWebPropertyId ); // eslint-disable-line sitekit/acronym-case
	} );
} );
