/**
 * GA4 Property Select component tests.
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
import { MODULES_ANALYTICS, ACCOUNT_CREATE } from '../../../analytics/datastore/constants';
import { STORE_NAME } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import * as fixtures from '../../datastore/__fixtures__';
import * as analyticsFixtures from '../../../analytics/datastore/__fixtures__';
import { fireEvent, act, render } from '../../../../../../tests/js/test-utils';

const {
	createProperty,
	createWebDataStream,
	properties,
	webDataStreams,
} = fixtures;
const { accounts } = analyticsFixtures.accountsPropertiesProfiles;
const accountID = createProperty._accountID;
const propertyID = createWebDataStream._propertyID;

const setupRegistry = ( { dispatch } ) => {
	dispatch( CORE_SITE ).receiveSiteInfo( { referenceSiteURL: 'http://example.com' } );
	dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
	dispatch( STORE_NAME ).receiveGetSettings( {} );
	dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

	dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID } );
	dispatch( STORE_NAME ).finishResolution( 'getProperties', [ accountID ] );

	dispatch( STORE_NAME ).receiveGetWebDataStreams( webDataStreams, { propertyID } );
	dispatch( STORE_NAME ).finishResolution( 'receiveGetWebDataStreams', { propertyID } );
};

const setupEmptyRegistry = ( { dispatch } ) => {
	dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
	dispatch( STORE_NAME ).receiveGetSettings( {} );
	dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

	dispatch( STORE_NAME ).receiveGetProperties( [], { accountID } );
	dispatch( STORE_NAME ).finishResolution( 'getProperties', [ accountID ] );
};

describe( 'PropertySelect', () => {
	it( 'should render an option for each analytics property of the currently selected account.', async () => {
		const { getAllByRole } = render( <PropertySelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new property".
		expect( listItems ).toHaveLength( properties.length + 1 );
	} );

	it( 'should not render if account ID is not set.', async () => {
		muteFetch( /^\/google-site-kit\/v1\/modules\/analytics-4\/data\/settings/, [] );

		const { container, registry } = render( <PropertySelect />, {
			setupRegistry: ( { dispatch } ) => {
				dispatch( MODULES_ANALYTICS ).setSettings( {} );

				dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
				dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

				dispatch( STORE_NAME ).receiveGetProperties( [], { accountID } );
				dispatch( STORE_NAME ).finishResolution( 'getProperties', [ accountID ] );
			},
		} );

		expect( container ).toBeEmptyDOMElement();

		// in order to not get act errors need to do something as DOM is empty at the start and end of this test AND wp-data does lots of stuff
		await act( () => registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID ) );
	} );

	it( 'should be disabled when in the absence of an valid account ID.', async () => {
		const { container, registry } = render( <PropertySelect />, {
			setupRegistry,
		} );

		// A valid accountID is provided, so ensure it is not currently disabled.
		const selectWrapper = container.querySelector( '.googlesitekit-analytics__select-property' );
		const selectedText = container.querySelector( '.mdc-select__selected-text' );
		expect( selectWrapper ).not.toHaveClass( 'mdc-select--disabled' );
		expect( selectedText ).not.toHaveAttribute( 'aria-disabled', 'true' );

		act( () => {
			registry.dispatch( MODULES_ANALYTICS ).setAccountID( ACCOUNT_CREATE );
			registry.dispatch( STORE_NAME ).finishResolution( 'getProperties', [ ACCOUNT_CREATE ] );
		} );
		// ACCOUNT_CREATE is an invalid accountID (but valid selection), so ensure the select IS currently disabled.
		expect( selectWrapper ).toHaveClass( 'mdc-select--disabled' );
		expect( selectedText ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'should render a select box with only an option to create a new property if no properties are available.', async () => {
		const { getAllByRole } = render( <PropertySelect />, { setupRegistry: setupEmptyRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ 0 ].textContent ).toMatch( /set up a new property/i );
	} );

	it( 'should update propertyID in the store when a new item is selected', async () => {
		const { getAllByRole, container, registry } = render( <PropertySelect />, { setupRegistry } );
		const allProperties = registry.select( STORE_NAME ).getProperties( accountID );
		const targetProperty = allProperties[ 0 ];

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 0 ] );

		const newPropertyID = registry.select( STORE_NAME ).getPropertyID();
		expect( targetProperty._id ).toEqual( newPropertyID );
	} );
} );
