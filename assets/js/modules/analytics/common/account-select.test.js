import React from 'react';

import { fireEvent, muteConsole, render } from 'test-utils';
import { STORE_NAME as modulesAnalyticsStoreName } from '../datastore';
import * as fixtures from '../datastore/__fixtures__';

import AccountSelect from './account-select';

const setupRegistry = ( registry ) => {
	registry.dispatch( modulesAnalyticsStoreName ).receiveSettings( {} );
	registry.dispatch( modulesAnalyticsStoreName ).receiveAccounts( fixtures.accountsPropertiesProfiles.accounts );
	registry.dispatch( modulesAnalyticsStoreName ).receiveProfiles( fixtures.accountsPropertiesProfiles.properties );
	registry.dispatch( modulesAnalyticsStoreName ).receiveProfiles( fixtures.accountsPropertiesProfiles.profiles );
};

const setupEmptyRegistry = ( registry ) => {
	registry.dispatch( modulesAnalyticsStoreName ).receiveSettings( {} );
	registry.dispatch( modulesAnalyticsStoreName ).receiveAccounts( [] );
	registry.dispatch( modulesAnalyticsStoreName ).receiveProfiles( [] );
	registry.dispatch( modulesAnalyticsStoreName ).receiveProfiles( [] );
};

describe( 'AccountSelect', () => {
	it( 'should render an option for each analytics account', async () => {
		const { baseElement } = render( <AccountSelect />, { setupRegistry } );

		// The Material `<Select>` component puts its items at the bottom of the root
		// element of the page, and doesn't offer great selectors to use for selecting
		// them, so this is how we test the number of accounts rendered in the select box.
		//
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new account".
		const listItems = baseElement.querySelectorAll( '.mdc-select__menu [role=menu] li' );
		expect( listItems ).toHaveLength( fixtures.accountsPropertiesProfiles.accounts.length + 1 );
	} );

	it( 'should have a "Set up a new account" item at the end of the list', async () => {
		const { baseElement } = render( <AccountSelect />, { setupRegistry } );

		const listItems = baseElement.querySelectorAll( '.mdc-select__menu [role=menu] li' );
		expect( listItems[ listItems.length - 1 ].textContent ).toEqual( 'Set up a new account' );
	} );

	it( 'should render a select box with only setup when accounts are undefined', async () => {
		// Mute the console here; it will make an HTTP request to load accounts.
		muteConsole( 'error' );
		const { baseElement } = render( <AccountSelect /> );

		const listItems = baseElement.querySelectorAll( '.mdc-select__menu [role=menu] li' );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ listItems.length - 1 ].textContent ).toEqual( 'Set up a new account' );
	} );

	it( 'should render a select box with only setup when no accounts exist', async () => {
		const { baseElement } = render( <AccountSelect />, { setupRegistry: setupEmptyRegistry } );

		const listItems = baseElement.querySelectorAll( '.mdc-select__menu [role=menu] li' );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems[ listItems.length - 1 ].textContent ).toEqual( 'Set up a new account' );
	} );

	it( 'should update accountID in the store when a new item is clicked', async () => {
		const { baseElement, container, registry } = render( <AccountSelect />, { setupRegistry } );
		const originalAccountID = registry.select( modulesAnalyticsStoreName ).getAccountID();

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( baseElement.querySelectorAll( '.mdc-select__menu [role=menu] li' )[ 1 ] );

		const newAccountID = registry.select( modulesAnalyticsStoreName ).getAccountID();
		expect( originalAccountID ).not.toEqual( newAccountID );
		expect( newAccountID ).toEqual( fixtures.accountsPropertiesProfiles.accounts[ 1 ].id );
	} );
} );
