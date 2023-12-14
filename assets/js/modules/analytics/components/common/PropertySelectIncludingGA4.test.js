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
import {
	MODULES_ANALYTICS,
	ACCOUNT_CREATE,
	PROPERTY_TYPE_UA,
	PROPERTY_TYPE_GA4,
} from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import * as analytics4Fixtures from '../../../analytics-4/datastore/__fixtures__';
import {
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import { fireEvent, act, render } from '../../../../../../tests/js/test-utils';

const {
	createProperty,
	createWebDataStream,
	properties: propertiesGA4,
	webDataStreams,
} = analytics4Fixtures;
const {
	accounts,
	properties: propertiesUA,
	profiles,
} = fixtures.accountsPropertiesProfiles;
const accountID = createProperty._accountID;
const propertyIDga4 = createWebDataStream._propertyID;
const propertyIDua = propertiesUA[ 0 ].id;

const setupRegistry = ( registry ) => {
	provideSiteInfo( registry );
	provideUserAuthentication( registry );

	const { dispatch } = registry;

	dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

	dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

	dispatch( MODULES_ANALYTICS ).receiveGetProperties( propertiesUA, {
		accountID,
	} );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [
		accountID,
	] );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( propertiesGA4, {
		accountID,
	} );
	dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getProperties', [
		accountID,
	] );

	dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, {
		accountID,
		propertyID: propertyIDua,
	} );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProfiles', [
		accountID,
		propertyIDua,
	] );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams( webDataStreams, {
		propertyID: propertyIDga4,
	} );
	dispatch( MODULES_ANALYTICS_4 ).finishResolution(
		'receiveGetWebDataStreams',
		{
			propertyID: propertyIDga4,
		}
	);
};

const setupEmptyRegistry = ( { dispatch } ) => {
	dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

	dispatch( MODULES_ANALYTICS ).receiveGetProperties( [], { accountID } );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [
		accountID,
	] );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getProperties', [
		accountID,
	] );
};

const setupAdvancedRegistry = ( registry ) => {
	const { dispatch } = registry;

	setupRegistry( registry );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts( [
		{
			id: accountID,
			name: 'Example.com',
		},
	] );

	dispatch( MODULES_ANALYTICS ).receiveGetProperties(
		[
			{
				id: propertyIDua,
				name: 'UA Property',
				/* eslint-disable sitekit/acronym-case */
				internalWebPropertyId: '216084974',
				websiteUrl: 'http://example.com',
				defaultProfileId: '67890',
				/* eslint-enable */
			},
		],
		{ accountID }
	);

	dispatch( MODULES_ANALYTICS ).receiveGetProfiles(
		[
			{
				id: '12345',
				name: 'All Web Site Data',
			},
			{
				id: '67890',
				name: 'View 2',
			},
		],
		{ accountID, propertyID: propertyIDua }
	);

	dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries(
		analytics4Fixtures.accountSummaries
	);
	dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getAccounts', [] );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties(
		[
			{
				_id: propertyIDga4,
				displayName: 'GA4 Property',
			},
		],
		{ accountID }
	);

	dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams(
		[
			{
				_id: '2001',
				webStreamData: {
					measurementId: '1A2BCD345E', // eslint-disable-line sitekit/acronym-case
					defaultUri: 'http://example.net', // eslint-disable-line sitekit/acronym-case
				},
			},
			{
				_id: '2002',
				webStreamData: {
					/* eslint-disable sitekit/acronym-case */
					measurementId: 'G-12345ABCDE',
					defaultUri: 'http://example.com',
					/* eslint-enable */
				},
			},
		],
		{ propertyID: propertyIDga4 }
	);
};

describe( 'PropertySelectIncludingGA4IncludingGA4', () => {
	it( 'should render an option for each analytics property of the currently selected account.', () => {
		const { getAllByRole } = render( <PropertySelectIncludingGA4 />, {
			setupRegistry,
		} );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new property".
		expect( listItems ).toHaveLength(
			propertiesUA.length + propertiesGA4.length + 1
		);
	} );

	it( 'should not render in the absence of an valid account ID.', () => {
		const { container, registry } = render(
			<PropertySelectIncludingGA4 />,
			{ setupRegistry }
		);

		// A valid accountID is provided, so ensure it is not currently disabled.
		const selectWrapper = container.querySelector(
			'.googlesitekit-analytics__select-property'
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
				.dispatch( MODULES_ANALYTICS )
				.finishResolution( 'getProperties', [ ACCOUNT_CREATE ] );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getProperties', [ ACCOUNT_CREATE ] );
		} );
		// ACCOUNT_CREATE is an invalid accountID (but valid selection), so ensure the select is not rendered
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render a select box with only an option to create a new property if no properties are available.', () => {
		const { getAllByRole } = render( <PropertySelectIncludingGA4 />, {
			setupRegistry: setupEmptyRegistry,
		} );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ 0 ].textContent ).toMatch(
			/set up a new property/i
		);
	} );

	it( 'should set the primary property type to GA4 when the GA4 property is selected', async () => {
		const { getByText, container, registry, findByText } = render(
			<PropertySelectIncludingGA4 />,
			{
				setupRegistry: setupAdvancedRegistry,
			}
		);

		expect(
			container.querySelector( '.mdc-select__selected-text' )
		).toHaveTextContent( '' );

		await act( async () => {
			fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
			fireEvent.click( getByText( `GA4 Property (${ propertyIDga4 })` ) );
			await findByText( `GA4 Property (${ propertyIDga4 })` );
		} );

		expect(
			registry.select( MODULES_ANALYTICS ).getPrimaryPropertyType()
		).toBe( PROPERTY_TYPE_GA4 );
	} );

	it( 'should set the primary property type to UA when the UA property is selected', async () => {
		const { getByText, container, registry, findByText } = render(
			<PropertySelectIncludingGA4 />,
			{
				setupRegistry: setupAdvancedRegistry,
			}
		);

		expect(
			container.querySelector( '.mdc-select__selected-text' )
		).toHaveTextContent( '' );

		await act( async () => {
			fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
			fireEvent.click( getByText( `UA Property (${ propertyIDua })` ) );
			await findByText( `UA Property (${ propertyIDua })` );
		} );

		expect(
			registry.select( MODULES_ANALYTICS ).getPrimaryPropertyType()
		).toBe( PROPERTY_TYPE_UA );
	} );

	it( 'should correctly set UA settings when the GA4 property is selected', async () => {
		const { getByText, container, registry, findByText } = render(
			<PropertySelectIncludingGA4 />,
			{
				setupRegistry: setupAdvancedRegistry,
			}
		);

		expect(
			container.querySelector( '.mdc-select__selected-text' )
		).toHaveTextContent( '' );

		await act( async () => {
			fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
			fireEvent.click( getByText( `GA4 Property (${ propertyIDga4 })` ) );
			await findByText( `GA4 Property (${ propertyIDga4 })` );
		} );

		expect( registry.select( MODULES_ANALYTICS ).getPropertyID() ).toBe(
			propertyIDua
		);
		expect( registry.select( MODULES_ANALYTICS ).getProfileID() ).toBe(
			'67890'
		);
	} );
} );
