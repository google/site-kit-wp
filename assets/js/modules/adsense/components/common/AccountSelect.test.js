/**
 * AdSense Account Select component tests.
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
import AccountSelect from './AccountSelect';
import { fireEvent, render, freezeFetch } from '../../../../../../tests/js/test-utils';
import { STORE_NAME } from '../../datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';

const setupRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).setSettings( {} );
	registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsMultiple );
	registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );
};

const setupLoadingRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).setSettings( {} );
};

describe( 'AccountSelect', () => {
	it( 'should render an option for each AdSense account', async () => {
		const { getAllByRole } = render( <AccountSelect />, { setupRegistry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( fixtures.accountsMultiple.length );
	} );

	it( 'should render a loading state when accounts are undefined', async () => {
		freezeFetch( /^\/google-site-kit\/v1\/modules\/adsense\/data\/accounts/ );

		const { queryAllByRole, queryByRole } = render( <AccountSelect />, { setupRegistry: setupLoadingRegistry } );

		expect( queryAllByRole( 'menuitem', { hidden: true } ) ).toHaveLength( 0 );
		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should update accountID in the store when a new item is clicked', async () => {
		const { getByText, container, registry } = render( <AccountSelect />, { setupRegistry } );
		const originalAccountID = registry.select( STORE_NAME ).getAccountID();
		const selectedAccount = fixtures.accountsMultiple[ 0 ];

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getByText( selectedAccount.displayName ) );

		const newAccountID = registry.select( STORE_NAME ).getAccountID();
		expect( originalAccountID ).not.toEqual( newAccountID );
		expect( newAccountID ).toEqual( selectedAccount._id );
	} );
} );
