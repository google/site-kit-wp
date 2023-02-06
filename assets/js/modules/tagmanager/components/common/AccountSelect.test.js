/**
 * Account Select component tests.
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
import { fireEvent, render } from '../../../../../../tests/js/test-utils';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_TAGMANAGER, ACCOUNT_CREATE } from '../../datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import {
	freezeFetch,
	createTestRegistry,
} from '../../../../../../tests/js/utils';

describe( 'AccountSelect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		// Set set no existing tag by default.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
		// Receive containers for the first account in fixtures to prevent fetching in getAccounts resolver.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetContainers( [], {
			// eslint-disable-next-line sitekit/acronym-case
			accountID: fixtures.accounts[ 0 ].accountId,
		} );
		// Prevent error when loading site info.
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
	} );

	it( 'should render an option for each analytics account', () => {
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( fixtures.accounts );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );

		const { getAllByRole } = render( <AccountSelect />, { registry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		// Note: we do length + 1 here because there should also be an item for
		// "Set up a new account".
		expect( listItems ).toHaveLength( fixtures.accounts.length + 1 );
		expect(
			listItems.some(
				( { dataset } ) => dataset.value === ACCOUNT_CREATE
			)
		).toBe( true );
	} );

	it( 'should have a "Set up a new account" item at the end of the list', () => {
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( fixtures.accounts );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );

		const { getAllByRole } = render( <AccountSelect />, { registry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems.pop() ).toHaveTextContent( /set up a new account/i );
	} );

	it( 'should render a loading state when accounts are undefined', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/tagmanager/data/accounts'
			)
		);

		const { queryAllByRole, queryByRole } = render( <AccountSelect />, {
			registry,
		} );

		expect( queryAllByRole( 'menuitem', { hidden: true } ) ).toHaveLength(
			0
		);

		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render a select box with only the set up option when no accounts exist', () => {
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetAccounts( [] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );

		const { getAllByRole } = render( <AccountSelect />, { registry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );
		expect( listItems.pop() ).toHaveTextContent( /set up a new account/i );
	} );

	it( 'should update accountID in the store when a new item is clicked', () => {
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( fixtures.accounts );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );

		const { getByText, container } = render( <AccountSelect />, {
			registry,
		} );
		const originalAccountID = registry
			.select( MODULES_TAGMANAGER )
			.getAccountID();

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getByText( /set up a new account/i ) );
		// Note: we use the new account option here to avoid querying properties profiles,
		// as these are pre-selected when this changed (see next test).

		const newAccountID = registry
			.select( MODULES_TAGMANAGER )
			.getAccountID();
		expect( originalAccountID ).not.toEqual( newAccountID );
		expect( newAccountID ).toEqual( ACCOUNT_CREATE );
	} );

	it( 'should disable the account select if the user does not have module access', () => {
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( fixtures.accounts );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );

		const { container } = render(
			<AccountSelect hasModuleAccess={ false } />,
			{
				registry,
			}
		);

		// Verify that the Account select dropdown is disabled.
		[
			'.googlesitekit-tagmanager__select-account',
			'.mdc-select--disabled',
		].forEach( ( className ) => {
			expect( container.querySelector( className ) ).toBeInTheDocument();
		} );
	} );
} );
