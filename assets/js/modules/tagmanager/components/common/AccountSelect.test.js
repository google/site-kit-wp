/**
 * Account Select component tests.
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
 * Internal dependencies
 */
import AccountSelect from './AccountSelect';
import { fireEvent, render } from '../../../../../../tests/js/test-utils';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME, ACCOUNT_CREATE } from '../../datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import { freezeFetch, createTestRegistry } from '../../../../../../tests/js/utils';

describe( 'AccountSelect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( STORE_NAME ).setSettings( {} );
		// Set set no existing tag by default.
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		// Receive containers for the first account in fixtures to prevent fetching in getAccounts resolver.
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetContainers( [], { accountID: fixtures.accounts[ 0 ].accountId } );
		// Prevent error when loading site info.
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
	} );

	it( 'should render an option for each analytics account', () => {
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

		const { getAllByRole } = render( <AccountSelect />, { registry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new account".
		expect( listItems ).toHaveLength( fixtures.accounts.length + 1 );
		expect(
			listItems.some( ( { dataset } ) => dataset.value === ACCOUNT_CREATE )
		).toBe( true );
	} );

	it( 'should have a "Set up a new account" item at the end of the list', async () => {
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

		const { getAllByRole } = render( <AccountSelect />, { registry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems.pop() ).toHaveTextContent( /set up a new account/i );
	} );

	it( 'should render a loading state when accounts are undefined', async () => {
		freezeFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/ );

		const { queryAllByRole, queryByRole } = render( <AccountSelect />, { registry } );

		expect( queryAllByRole( 'menuitem', { hidden: true } ) ).toHaveLength( 0 );

		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render a select box with only the set up option when no accounts exist', async () => {
		registry.dispatch( STORE_NAME ).receiveGetAccounts( [] );
		registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

		const { getAllByRole } = render( <AccountSelect />, { registry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems.pop() ).toHaveTextContent( /set up a new account/i );
	} );

	it( 'should update accountID in the store when a new item is clicked', async () => {
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

		const { getByText, container } = render( <AccountSelect />, { registry } );
		const originalAccountID = registry.select( STORE_NAME ).getAccountID();

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getByText( /set up a new account/i ) );
		// Note: we use the new account option here to avoid querying properties profiles,
		// as these are pre-selected when this changed (see next test).

		const newAccountID = registry.select( STORE_NAME ).getAccountID();
		expect( originalAccountID ).not.toEqual( newAccountID );
		expect( newAccountID ).toEqual( ACCOUNT_CREATE );
	} );
} );
