/**
 * PropertySelectIncludingGA4 component tests.
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
import PropertySelectIncludingGA4 from './PropertySelectIncludingGA4';
import { MODULES_ANALYTICS, ACCOUNT_CREATE } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import * as analytics4Fixtures from '../../../analytics-4/datastore/__fixtures__';
import { provideSiteInfo } from '../../../../../../tests/js/utils';
import { fireEvent, act, render } from '../../../../../../tests/js/test-utils';
import { enabledFeatures } from '../../../../features';

const {
	createProperty,
	createWebDataStream,
	properties: propertiesGA4,
	webDataStreams,
} = analytics4Fixtures;
const { accounts, properties: propertiesUA, profiles } = fixtures.accountsPropertiesProfiles;
const accountID = createProperty._accountID;
const propertyIDga4 = createWebDataStream._propertyID;
const propertyIDua = propertiesUA[ 0 ].id;

const setupRegistry = ( registry ) => {
	provideSiteInfo( registry );

	const { dispatch } = registry;

	dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

	dispatch( MODULES_ANALYTICS ).receiveGetProperties( propertiesUA, { accountID } );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [ accountID ] );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( propertiesGA4, { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getProperties', [ accountID ] );

	dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, { accountID, propertyID: propertyIDua } );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProfiles', [ accountID, propertyIDua ] );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams( webDataStreams, { propertyID: propertyIDga4 } );
	dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'receiveGetWebDataStreams', { propertyID: propertyIDga4 } );
};

const setupEmptyRegistry = ( { dispatch } ) => {
	dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

	dispatch( MODULES_ANALYTICS ).receiveGetProperties( [], { accountID } );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [ accountID ] );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getProperties', [ accountID ] );
};

describe( 'PropertySelectIncludingGA4IncludingGA4', () => {
	beforeEach( () => {
		enabledFeatures.add( 'ga4setup' );
	} );

	it( 'should render an option for each analytics property of the currently selected account.', () => {
		const { getAllByRole } = render( <PropertySelectIncludingGA4 />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new property".
		expect( listItems ).toHaveLength( propertiesUA.length + propertiesGA4.length + 1 );
	} );

	it( 'should not render in the absence of an valid account ID.', () => {
		const { container, registry } = render( <PropertySelectIncludingGA4 />, {
			setupRegistry,
		} );

		// A valid accountID is provided, so ensure it is not currently disabled.
		const selectWrapper = container.querySelector( '.googlesitekit-analytics__select-property' );
		const selectedText = container.querySelector( '.mdc-select__selected-text' );
		expect( selectWrapper ).not.toHaveClass( 'mdc-select--disabled' );
		expect( selectedText ).not.toHaveAttribute( 'aria-disabled', 'true' );

		act( () => {
			registry.dispatch( MODULES_ANALYTICS ).setAccountID( ACCOUNT_CREATE );
			registry.dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [ ACCOUNT_CREATE ] );
			registry.dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getProperties', [ ACCOUNT_CREATE ] );
		} );
		// ACCOUNT_CREATE is an invalid accountID (but valid selection), so ensure the select is not rendered
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render a select box with only an option to create a new property if no properties are available.', () => {
		const { getAllByRole } = render( <PropertySelectIncludingGA4 />, { setupRegistry: setupEmptyRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ 0 ].textContent ).toMatch( /set up a new property/i );
	} );

	it( 'should change between UA and GA4 properties', () => {
		const { getAllByRole, container, registry } = render( <PropertySelectIncludingGA4 />, { setupRegistry } );
		const ga4Properties = registry.select( MODULES_ANALYTICS_4 ).getProperties( accountID );
		// the selector getPropertiesIncludingGA4 sorts so this is rendered second in the select
		const ga4TargetProperty = ga4Properties[ 0 ];

		expect( container.querySelector( '.mdc-select__selected-text' ) ).toHaveTextContent( '' );

		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 1 ] );

		// The selected property is a GA4 property
		expect( registry.select( MODULES_ANALYTICS ).getPrimaryPropertyType() ).toBe( 'ga4' );
		const newGA4PropertyID = registry.select( MODULES_ANALYTICS_4 ).getPropertyID();
		expect( ga4TargetProperty._id ).toEqual( newGA4PropertyID );

		expect( container.querySelector( '.mdc-select__selected-text' ) )
			.toHaveTextContent( `${ ga4TargetProperty.displayName } (${ ga4TargetProperty._id })` );
		expect( container.querySelector( '.mdc-select__selected-text' ) )
			.toHaveTextContent( 'Test GA4 Property (1000)' );

		// the modules/analytics store's getPropertyID action should be reset
		expect( registry.select( MODULES_ANALYTICS ).getPropertyID() ).toBe( '' );

		// Select a UA property
		const uaProperties = registry.select( MODULES_ANALYTICS ).getProperties( accountID );

		const uaTargetProperty = uaProperties[ 0 ];

		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 7 ] );

		expect( registry.select( MODULES_ANALYTICS ).getPrimaryPropertyType() ).toBe( 'ua' );

		const newUAPropertyID = registry.select( MODULES_ANALYTICS ).getPropertyID();

		expect( uaTargetProperty.id ).toEqual( newUAPropertyID );

		expect( container.querySelector( '.mdc-select__selected-text' ) )
			.toHaveTextContent( `${ uaTargetProperty.name } (${ uaTargetProperty.id })` );
		expect( container.querySelector( '.mdc-select__selected-text' ) ).toHaveTextContent( 'wegweg (UA-152925174-1)' );

		expect( registry.select( MODULES_ANALYTICS_4 ).getPropertyID() ).toBe( '' );

		// Select a GA4 property again
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 1 ] );

		expect( container.querySelector( '.mdc-select__selected-text' ) )
			.toHaveTextContent( `${ ga4TargetProperty.displayName } (${ ga4TargetProperty._id })` );
		expect( container.querySelector( '.mdc-select__selected-text' ) )
			.toHaveTextContent( 'Test GA4 Property (1000)' );

		expect( registry.select( MODULES_ANALYTICS ).getPropertyID() ).toBe( '' );
	} );
} );
