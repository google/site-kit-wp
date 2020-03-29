/**
 * WordPress dependencies
 */
import apiFetchMock from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import ProfileSelect from './profile-select';
import { STORE_NAME as modulesAnalyticsStoreName } from '../datastore';
import * as fixtures from '../datastore/__fixtures__';
import { PROFILE_CREATE } from '../datastore/profiles';
import { fireEvent, render, act } from 'test-utils';

// Mock apiFetch so we know if it's called.
jest.mock( '@wordpress/api-fetch' );
apiFetchMock.mockImplementation( ( ...args ) => {
	// eslint-disable-next-line no-console
	console.warn( 'apiFetch', ...args );
	throw new Error( 'Unexpected apiFetch call' );
} );

const setupRegistry = ( { dispatch } ) => {
	const { id, webPropertyId, accountId } = fixtures.propertiesProfiles.profiles[ 0 ];
	dispatch( modulesAnalyticsStoreName ).setAccountID( accountId );
	dispatch( modulesAnalyticsStoreName ).setPropertyID( webPropertyId );
	dispatch( modulesAnalyticsStoreName ).setProfileID( id );
	dispatch( modulesAnalyticsStoreName ).receiveProfiles( fixtures.propertiesProfiles.profiles );
};

const setupRegistryWithExistingTag = ( { dispatch } ) => {
	const { id, webPropertyId, accountId } = fixtures.propertiesProfiles.profiles[ 0 ];
	dispatch( modulesAnalyticsStoreName ).setAccountID( accountId );
	dispatch( modulesAnalyticsStoreName ).setPropertyID( webPropertyId );
	dispatch( modulesAnalyticsStoreName ).setProfileID( id );
	dispatch( modulesAnalyticsStoreName ).receiveProfiles( fixtures.accountsPropertiesProfiles.profiles );
	dispatch( modulesAnalyticsStoreName ).receiveExistingTag( {
		accountID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].accountId,
		propertyID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId,
	} );
};

const setupEmptyRegistry = ( { dispatch } ) => {
	dispatch( modulesAnalyticsStoreName ).receiveSettings( {} );
	dispatch( modulesAnalyticsStoreName ).receiveProfiles( [] );
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

		const currentPropertyID = registry.select( modulesAnalyticsStoreName ).getPropertyID();
		const existingTagPropertyID = registry.select( modulesAnalyticsStoreName ).getExistingTag().propertyID;
		expect( existingTagPropertyID ).not.toEqual( currentPropertyID );

		const existingTagProfiles = fixtures.accountsPropertiesProfiles.profiles
			.filter( ( p ) => p.webPropertyId === existingTagPropertyID );

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
		const validAccountID = registry.select( modulesAnalyticsStoreName ).getAccountID();

		// A valid accountID is provided, so ensure it is not currently disabled.
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) )
			.not.toHaveClass( 'mdc-select--disabled' );

		await act( () => registry.dispatch( modulesAnalyticsStoreName ).setAccountID( '0' ) );

		// An empty accountID is invalid, so ensure the select IS currently disabled.
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) )
			.toHaveClass( 'mdc-select--disabled' );

		await act( () => registry.dispatch( modulesAnalyticsStoreName ).setAccountID( validAccountID ) );
		await act( () => registry.dispatch( modulesAnalyticsStoreName ).setPropertyID( '0' ) );

		// The accountID is valid, but an empty propertyID is invalid, so ensure the select IS currently disabled.
		expect( container.querySelector( '.googlesitekit-analytics__select-profile' ) )
			.toHaveClass( 'mdc-select--disabled' );
	} );

	it( 'should render a select box with only an option to create a new property if no properties are available.', async () => {
		const { getAllByRole } = render( <ProfileSelect />, { setupRegistry: setupEmptyRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ 0 ].textContent ).toMatch( /set up a new profile/i );
	} );

	it( 'should update profileID in the store when a new item is selected', async () => {
		const { getByText, container, registry } = render( <ProfileSelect />, { setupRegistry } );
		const originalProfileID = registry.select( modulesAnalyticsStoreName ).getProfileID();

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getByText( /set up a new profile/i ) );

		const newProfileID = registry.select( modulesAnalyticsStoreName ).getProfileID();
		expect( originalProfileID ).not.toEqual( newProfileID );
		expect( newProfileID ).toEqual( PROFILE_CREATE );
	} );
} );
