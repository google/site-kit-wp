/**
 * AdSense Account Select component tests.
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
import AccountSelect from './account-select';
import { fireEvent, muteConsole, render } from '../../../../../tests/js/test-utils';
import { STORE_NAME } from '../datastore/constants';
import * as fixtures from '../datastore/__fixtures__';

// Mock apiFetch so we know if it's called.
jest.mock( '@wordpress/api-fetch' );
apiFetchMock.mockImplementation( ( ...args ) => {
	// eslint-disable-next-line no-console
	console.warn( 'apiFetch', ...args );
} );

const setupRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).setSettings( {} );
	registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accountsMultiple );
};

const setupLoadingRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).setSettings( {} );
};

describe( 'AccountSelect', () => {
	afterEach( () => apiFetchMock.mockClear() );
	afterAll( () => jest.restoreAllMocks() );

	it( 'should render an option for each AdSense account', async () => {
		const { getAllByRole } = render( <AccountSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( fixtures.accountsMultiple.length );
		expect( apiFetchMock ).not.toHaveBeenCalled();
	} );

	it( 'should render a loading state when accounts are undefined', async () => {
		muteConsole( 'warn' );
		const { queryAllByRole, queryByRole } = render( <AccountSelect />, { setupRegistry: setupLoadingRegistry } );

		expect( queryAllByRole( 'menuitem', { hidden: true } ) ).toHaveLength( 0 );
		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();

		// If accounts are `undefined`, we'll make a request to fetch them.
		expect( apiFetchMock ).toHaveBeenCalled();
	} );

	it( 'should update accountID in the store when a new item is clicked', async () => {
		const tt = render( <AccountSelect />, { setupRegistry } );
		const { getByText, container, registry } = tt;
		const originalAccountID = registry.select( STORE_NAME ).getAccountID();
		const selectedAccount = fixtures.accountsMultiple[ 0 ];

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getByText( selectedAccount.name ) );

		const newAccountID = registry.select( STORE_NAME ).getAccountID();
		expect( originalAccountID ).not.toEqual( newAccountID );
		expect( newAccountID ).toEqual( selectedAccount.id );
	} );
} );
