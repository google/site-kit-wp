/**
 * WordPress dependencies
 */
import apiFetchMock from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import AccountSelect from './account-select';
import { fireEvent, render } from 'test-utils';
import { STORE_NAME as modulesAnalyticsStoreName } from '../datastore';
import * as fixtures from '../datastore/__fixtures__';

// Mock apiFetch so we know if it's called.
jest.mock( '@wordpress/api-fetch' );
apiFetchMock.mockImplementation( ( ...args ) => {
	// eslint-disable-next-line no-console
	console.warn( 'apiFetch', ...args );
} );

const setupRegistry = ( registry ) => {
	registry.dispatch( modulesAnalyticsStoreName ).receiveSettings( {} );
	registry.dispatch( modulesAnalyticsStoreName ).receiveAccounts( fixtures.accountsPropertiesProfiles.accounts );
};

const setupEmptyRegistry = ( registry ) => {
	registry.dispatch( modulesAnalyticsStoreName ).receiveSettings( {} );
	registry.dispatch( modulesAnalyticsStoreName ).receiveAccounts( [] );
};

describe( 'AccountSelect', () => {
	afterEach( () => apiFetchMock.mockClear() );
	afterAll( () => jest.restoreAllMocks() );

	it( 'should render an option for each analytics account', async () => {
		const { getAllByRole } = render( <AccountSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new account".
		expect( listItems ).toHaveLength( fixtures.accountsPropertiesProfiles.accounts.length + 1 );
		expect( apiFetchMock ).not.toHaveBeenCalled();
	} );

	it( 'should have a "Set up a new account" item at the end of the list', async () => {
		const { getAllByRole } = render( <AccountSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems[ listItems.length - 1 ].textContent ).toMatch( /set up a new account/i );
		expect( apiFetchMock ).not.toHaveBeenCalled();
	} );

	it( 'should render a select box with only setup when accounts are undefined', async () => {
		const { getAllByRole } = render( <AccountSelect />, { setupRegistry: setupEmptyRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ listItems.length - 1 ].textContent ).toMatch( /set up a new account/i );
		expect( apiFetchMock ).not.toHaveBeenCalled();
	} );

	it( 'should render a select box with only setup when no accounts exist', async () => {
		const { getAllByRole } = render( <AccountSelect />, { setupRegistry: setupEmptyRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ listItems.length - 1 ].textContent ).toMatch( /set up a new account/i );
		expect( apiFetchMock ).not.toHaveBeenCalled();
	} );

	it( 'should update accountID in the store when a new item is clicked', async () => {
		const { getAllByRole, container, registry } = render( <AccountSelect />, { setupRegistry } );
		const originalAccountID = registry.select( modulesAnalyticsStoreName ).getAccountID();

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 1 ] );

		const newAccountID = registry.select( modulesAnalyticsStoreName ).getAccountID();
		expect( originalAccountID ).not.toEqual( newAccountID );
		expect( newAccountID ).toEqual( fixtures.accountsPropertiesProfiles.accounts[ 1 ].id );
		expect( apiFetchMock ).not.toHaveBeenCalled();
	} );
} );
