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
import {
	fireEvent,
	render,
	freezeFetch,
	createTestRegistry,
} from '../../../../../../tests/js/test-utils';
import { MODULES_ADSENSE } from '../../datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';

describe( 'AccountSelect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( MODULES_ADSENSE ).setSettings( {} );
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetAccounts( fixtures.accountsMultiple );
		registry
			.dispatch( MODULES_ADSENSE )
			.finishResolution( 'getAccounts', [] );
	} );

	it( 'should render an option for each AdSense account', () => {
		const { getAllByRole } = render( <AccountSelect />, { registry } );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( fixtures.accountsMultiple.length );
	} );

	it( 'should render a loading state when accounts are undefined', () => {
		registry
			.dispatch( MODULES_ADSENSE )
			.startResolution( 'getAccounts', [] );

		freezeFetch(
			new RegExp( '^/google-site-kit/v1/modules/adsense/data/accounts' )
		);

		const { queryAllByRole, queryByRole } = render( <AccountSelect />, {
			registry,
		} );

		expect( queryAllByRole( 'menuitem', { hidden: true } ) ).toHaveLength(
			0
		);
		expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should update accountID in the store when a new item is clicked', () => {
		const { getByText, container } = render( <AccountSelect />, {
			registry,
		} );
		const originalAccountID = registry
			.select( MODULES_ADSENSE )
			.getAccountID();
		const selectedAccount = fixtures.accountsMultiple[ 0 ];

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getByText( selectedAccount.displayName ) );

		const newAccountID = registry.select( MODULES_ADSENSE ).getAccountID();
		expect( originalAccountID ).not.toEqual( newAccountID );
		expect( newAccountID ).toEqual( selectedAccount._id );
	} );
} );
