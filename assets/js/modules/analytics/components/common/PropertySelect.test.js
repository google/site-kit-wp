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
import { MODULES_ANALYTICS, ACCOUNT_CREATE } from '../../datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import {
	fireEvent,
	muteFetch,
	render,
	act,
} from '../../../../../../tests/js/test-utils';

const setupRegistry = ( { dispatch } ) => {
	const { properties, profiles } = fixtures.accountsPropertiesProfiles;
	const propertyID = properties[ 0 ].id;
	const accountID = properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
	dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
	dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );

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

	dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, {
		accountID,
		propertyID,
	} );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProfiles', [
		accountID,
		propertyID,
	] );
};

const setupRegistryWithExistingTag = ( { dispatch } ) => {
	const accountID =
		fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
	dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	dispatch( MODULES_ANALYTICS ).receiveGetExistingTag(
		fixtures.getTagPermissionsAccess.propertyID
	);
	// Existing tag IDs are set in the resolver so we have to fill those here.
	dispatch( MODULES_ANALYTICS ).setAccountID(
		fixtures.getTagPermissionsAccess.accountID
	);
	dispatch( MODULES_ANALYTICS ).setPropertyID(
		fixtures.getTagPermissionsAccess.propertyID
	);

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
};

const setupEmptyRegistry = ( { dispatch } ) => {
	const { properties } = fixtures.accountsPropertiesProfiles;
	const accountID = properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
	dispatch( MODULES_TAGMANAGER ).setSettings( {} );
	dispatch( MODULES_ANALYTICS ).setSettings( {} );
	dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
	dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts(
		fixtures.accountsPropertiesProfiles.accounts
	);
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

	dispatch( MODULES_ANALYTICS ).receiveGetProperties( [], { accountID } );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [
		accountID,
	] );
};

describe( 'PropertySelect', () => {
	it( 'should render an option for each analytics property of the currently selected account.', () => {
		const { getAllByRole } = render( <PropertySelect />, {
			setupRegistry,
		} );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength(
			fixtures.accountsPropertiesProfiles.properties.length
		);
	} );

	it( 'should pre-select an existing tag when present', () => {
		const { container } = render( <PropertySelect />, {
			setupRegistry: setupRegistryWithExistingTag,
		} );

		const existingTagPropertyID =
			fixtures.getTagPermissionsAccess.propertyID;
		const existingTagProperty =
			fixtures.accountsPropertiesProfiles.properties.find(
				( { id } ) => id === existingTagPropertyID
			);
		const selectedText = container.querySelector(
			'.mdc-select__selected-text'
		);
		expect( selectedText ).toHaveTextContent( existingTagProperty.name );
	} );

	it( 'should disable the property select if the user does not have module access', () => {
		const { container, getAllByRole } = render(
			<PropertySelect hasModuleAccess={ false } />,
			{ setupRegistry: setupRegistryWithExistingTag }
		);

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );

		// Verify that the Property select dropdown is disabled.
		[
			'.googlesitekit-analytics__select-property',
			'.mdc-select--disabled',
		].forEach( ( className ) => {
			expect( container.querySelector( className ) ).toBeInTheDocument();
		} );
	} );

	it( 'should not render if account ID is invalid', () => {
		const { container, registry } = render( <PropertySelect />, {
			setupRegistry( { dispatch } ) {
				setupRegistry( { dispatch } );
				dispatch( MODULES_ANALYTICS ).finishResolution(
					'getProperties',
					[ ACCOUNT_CREATE ]
				);
			},
		} );

		act( () => {
			registry.dispatch( MODULES_ANALYTICS ).setAccountID( 'abcd' );
		} );

		// abcd is an invalid account ID, so ensure the property select dropdown is not rendered.
		expect( container ).toBeEmptyDOMElement();

		act( () => {
			const accountID =
				fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
			registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
		} );

		// A valid account ID was set, so the select should be visible.
		expect(
			container.querySelector(
				'.googlesitekit-analytics__select-property'
			)
		).toBeInTheDocument();
	} );

	it( 'should render a select box with no option if no properties are available.', () => {
		const { queryByRole } = render( <PropertySelect />, {
			setupRegistry: setupEmptyRegistry,
		} );

		const listItem = queryByRole( 'menuitem', { hidden: true } );
		expect( listItem ).toBeNull();
	} );

	it( 'should update propertyID in the store when a new item is selected', () => {
		const { getAllByRole, container, registry } = render(
			<PropertySelect />,
			{ setupRegistry }
		);
		const originalPropertyID = registry
			.select( MODULES_ANALYTICS )
			.getPropertyID();

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/profiles'
			),
			[]
		);
		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 1 ] );

		const newPropertyID = registry
			.select( MODULES_ANALYTICS )
			.getPropertyID();
		expect( originalPropertyID ).not.toEqual( newPropertyID );
		expect( newPropertyID ).toEqual(
			fixtures.accountsPropertiesProfiles.properties[ 1 ].id
		);
	} );

	it( 'should update internalWebPropertyID in the store when an item is selected', () => {
		const { getAllByRole, container, registry } = render(
			<PropertySelect />,
			{ setupRegistry }
		);
		const accountID =
			fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
		const originalID = registry
			.select( MODULES_ANALYTICS )
			.getInternalWebPropertyID();
		const properties = registry
			.select( MODULES_ANALYTICS )
			.getProperties( accountID );
		const targetProperty = properties[ 1 ];

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/profiles'
			),
			[]
		);

		act( () => {
			// Click the label to expose the elements in the menu.
			fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
			// Click this element to select it and fire the onChange event.
			fireEvent.click(
				getAllByRole( 'menuitem', { hidden: true } )[ 1 ]
			);
		} );

		const newPropertyID = registry
			.select( MODULES_ANALYTICS )
			.getPropertyID();
		expect( targetProperty.id ).toEqual( newPropertyID );
		const newID = registry
			.select( MODULES_ANALYTICS )
			.getInternalWebPropertyID();
		expect( originalID ).not.toEqual( newID );
		expect( newID ).toEqual( targetProperty.internalWebPropertyId ); // eslint-disable-line sitekit/acronym-case
	} );
} );
