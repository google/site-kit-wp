/**
 * Property Select component tests.
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
import PropertySelect from './property-select';
import { STORE_NAME as modulesAnalyticsStoreName } from '../datastore';
import * as fixtures from '../datastore/__fixtures__';
import { ACCOUNT_CREATE } from '../datastore/constants';
import { fireEvent, render, act } from '../../../../../tests/js/test-utils';

// Mock apiFetch so we know if it's called.
jest.mock( '@wordpress/api-fetch' );
apiFetchMock.mockImplementation( ( ...args ) => {
	// eslint-disable-next-line no-console
	console.warn( 'apiFetch', ...args );
	throw new Error( 'Unexpected apiFetch call' );
} );

const setupRegistry = ( { dispatch } ) => {
	const accountID = fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId;
	dispatch( modulesAnalyticsStoreName ).setAccountID( accountID );
	dispatch( modulesAnalyticsStoreName ).receiveProperties( fixtures.accountsPropertiesProfiles.properties );
};

const setupRegistryWithExistingTag = ( { dispatch } ) => {
	dispatch( modulesAnalyticsStoreName ).receiveProperties( fixtures.accountsPropertiesProfiles.properties );
	dispatch( modulesAnalyticsStoreName ).receiveExistingTag( fixtures.getTagPermissionsAccess );
	// Existing tag IDs are set in the resolver so we have to fill those here.
	dispatch( modulesAnalyticsStoreName ).setAccountID( fixtures.getTagPermissionsAccess.accountID );
	dispatch( modulesAnalyticsStoreName ).setPropertyID( fixtures.getTagPermissionsAccess.propertyID );
};

const setupEmptyRegistry = ( { dispatch } ) => {
	dispatch( modulesAnalyticsStoreName ).setSettings( {} );
	dispatch( modulesAnalyticsStoreName ).receiveProperties( [] );
};

describe( 'PropertySelect', () => {
	afterEach( () => apiFetchMock.mockClear() );
	afterAll( () => jest.restoreAllMocks() );

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
		const existingTagProperty = fixtures.accountsPropertiesProfiles.properties.find( ( p ) => p.id === existingTagPropertyID );
		const selectedText = container.querySelector( '.mdc-select__selected-text' );
		expect( selectedText.textContent ).toEqual( existingTagProperty.name );
		expect( selectedText ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( container.querySelector( '.googlesitekit-analytics__select-property' ) )
			.toHaveClass( 'mdc-select--disabled' );
	} );

	it( 'should be disabled when in the absence of an valid account ID.', async () => {
		const { container, registry } = render( <PropertySelect />, { setupRegistry } );

		// A valid accountID is provided, so ensure it is not currently disabled.
		expect( container.querySelector( '.googlesitekit-analytics__select-property' ) )
			.not.toHaveClass( 'mdc-select--disabled' );

		await act( () => registry.dispatch( modulesAnalyticsStoreName ).setAccountID( ACCOUNT_CREATE ) );

		// An empty accountID is invalid, so ensure the select IS currently disabled.
		expect( container.querySelector( '.googlesitekit-analytics__select-property' ) )
			.toHaveClass( 'mdc-select--disabled' );
	} );

	it( 'should render a select box with only an option to create a new property if no properties are available.', async () => {
		const { getAllByRole } = render( <PropertySelect />, { setupRegistry: setupEmptyRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ 0 ].textContent ).toMatch( /set up a new property/i );
	} );

	it( 'should update propertyID in the store when a new item is selected', async () => {
		const { getAllByRole, container, registry } = render( <PropertySelect />, { setupRegistry } );
		const originalPropertyID = registry.select( modulesAnalyticsStoreName ).getPropertyID();

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 1 ] );

		const newPropertyID = registry.select( modulesAnalyticsStoreName ).getPropertyID();
		expect( originalPropertyID ).not.toEqual( newPropertyID );
		expect( newPropertyID ).toEqual( fixtures.accountsPropertiesProfiles.properties[ 1 ].id );
	} );

	it( 'should update internalWebPropertyID in the store when an item is selected', () => {
		const { getAllByRole, container, registry } = render( <PropertySelect />, { setupRegistry } );
		const accountID = fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId;
		const originalID = registry.select( modulesAnalyticsStoreName ).getInternalWebPropertyID();
		const properties = registry.select( modulesAnalyticsStoreName ).getProperties( accountID );
		const targetProperty = properties[ 1 ];

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 1 ] );

		const newPropertyID = registry.select( modulesAnalyticsStoreName ).getPropertyID();
		expect( targetProperty.id ).toEqual( newPropertyID );
		const newID = registry.select( modulesAnalyticsStoreName ).getInternalWebPropertyID();
		expect( originalID ).not.toEqual( newID );
		expect( newID ).toEqual( targetProperty.internalWebPropertyId );
	} );
} );
