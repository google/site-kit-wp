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
import {
	MODULES_ANALYTICS,
	ACCOUNT_CREATE,
} from '../../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import * as fixtures from '../../datastore/__fixtures__';
import {
	fireEvent,
	act,
	render,
	provideUserAuthentication,
} from '../../../../../../tests/js/test-utils';

const accountID = fixtures.accountSummaries[ 1 ]._id;
const properties = fixtures.accountSummaries[ 1 ].propertySummaries;
const propertyIDs = properties.map( ( { _id } ) => _id );

const setupRegistry = ( registry ) => {
	const { dispatch } = registry;

	dispatch( CORE_SITE ).receiveSiteInfo( {
		referenceSiteURL: 'http://example.com',
	} );
	provideUserAuthentication( registry );
	dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
		propertyID: properties[ 0 ]._id,
	} );
	dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries(
		fixtures.accountSummaries
	);
	dispatch( MODULES_ANALYTICS_4 ).finishResolution(
		'getAccountSummaries',
		[]
	);

	dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( properties, {
		accountID,
	} );
	dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getProperties', [
		accountID,
	] );

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetWebDataStreamsBatch( fixtures.webDataStreamsBatch, {
			propertyIDs,
		} );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getWebDataStreamsBatch', [ properties[ 0 ]._id ] );
};

const setupEmptyRegistry = ( registry ) => {
	const { dispatch } = registry;

	provideUserAuthentication( registry );
	dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries(
		fixtures.accountSummaries.map( ( account ) => ( {
			...account,
			propertySummaries: [],
		} ) )
	);
	dispatch( MODULES_ANALYTICS_4 ).finishResolution(
		'getAccountSummaries',
		[]
	);
};

describe( 'PropertySelect', () => {
	it( 'should render a select box with only an option to create a new property if no properties are available.', () => {
		const { getAllByRole } = render( <PropertySelect />, {
			setupRegistry: setupEmptyRegistry,
		} );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ 0 ].textContent ).toMatch(
			/set up a new property/i
		);
	} );

	it( 'should render an option for each analytics property of the currently selected account.', () => {
		const { getAllByRole } = render( <PropertySelect />, {
			setupRegistry,
		} );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new property".
		expect( listItems ).toHaveLength( properties.length + 1 );
	} );

	it( 'should disable the property select if the user does not have module access', () => {
		const { container, getAllByRole } = render(
			<PropertySelect hasModuleAccess={ false } />,
			{ setupRegistry }
		);

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );

		// Verify that the Property select dropdown is disabled.
		[
			'.googlesitekit-analytics-4__select-property',
			'.mdc-select--disabled',
		].forEach( ( className ) => {
			expect( container.querySelector( className ) ).toBeInTheDocument();
		} );
	} );

	it( 'should not render if account ID is not valid', () => {
		const { container, registry } = render( <PropertySelect />, {
			setupRegistry,
		} );

		// A valid accountID is provided, so ensure it is not currently disabled.
		const selectWrapper = container.querySelector(
			'.googlesitekit-analytics-4__select-property'
		);
		const selectedText = container.querySelector(
			'.mdc-select__selected-text'
		);
		expect( selectWrapper ).not.toHaveClass( 'mdc-select--disabled' );
		expect( selectedText ).not.toHaveAttribute( 'aria-disabled', 'true' );

		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.setAccountID( ACCOUNT_CREATE );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getProperties', [ ACCOUNT_CREATE ] );
		} );

		// ACCOUNT_CREATE is an invalid account ID (but valid selection), so ensure the property select dropdown is not rendered.
		expect( container ).toBeEmptyDOMElement();

		act( () => {
			registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
		} );

		// After we set a valid account ID, the property select should be visible.
		expect(
			container.querySelector(
				'.googlesitekit-analytics-4__select-property'
			)
		).toBeInTheDocument();
		expect(
			container.querySelector( '.mdc-select__selected-text' )
		).toBeInTheDocument();
	} );

	it( 'should update propertyID in the store when a new item is selected', () => {
		const { getAllByRole, container, registry } = render(
			<PropertySelect />,
			{ setupRegistry }
		);
		const allProperties = registry
			.select( MODULES_ANALYTICS_4 )
			.getProperties( accountID );
		const targetProperty = allProperties[ 0 ];

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 0 ] );

		const newPropertyID = registry
			.select( MODULES_ANALYTICS_4 )
			.getPropertyID();
		expect( targetProperty._id ).toEqual( newPropertyID );
	} );
} );
