/* eslint-disable sitekit/camelcase-acronyms */
/**
 * Container Select component tests.
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
import ContainerSelect from './ContainerSelect';
import { render, act } from '../../../../../../tests/js/test-utils';
import { STORE_NAME, ACCOUNT_CREATE } from '../../datastore/constants';
import { createTestRegistry } from '../../../../../../tests/js/utils';
import * as factories from '../../datastore/__factories__';

describe( 'ContainerSelect', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( STORE_NAME ).setSettings( {} );
		// Set set no existing tag.
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
	} );

	it( 'should be disabled if there is an existing tag', async () => {
		const account = factories.accountBuilder();
		registry.dispatch( STORE_NAME ).receiveGetAccounts( [ account ] );
		registry.dispatch( STORE_NAME ).setAccountID( account.accountId );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [], { accountID: account.accountId } );

		const { container } = render( <ContainerSelect containers={ [] } />, { registry } );
		const select = container.querySelector( '.mdc-select' );

		expect( select ).not.toHaveClass( 'mdc-select--disabled' );

		await act( () => registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'GTM-G000GL3' ) );

		expect( select ).toHaveClass( 'mdc-select--disabled' );
	} );

	it( 'should be disabled if the selected account is not a valid account', async () => {
		const account = factories.accountBuilder();
		registry.dispatch( STORE_NAME ).receiveGetAccounts( [ account ] );
		registry.dispatch( STORE_NAME ).setAccountID( account.accountId );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [], { accountID: account.accountId } );

		const { container } = render( <ContainerSelect containers={ [] } />, { registry } );
		const select = container.querySelector( '.mdc-select' );

		expect( select ).not.toHaveClass( 'mdc-select--disabled' );

		// The account option to "set up a new account" is technically an invalid accountID.
		await act( () => registry.dispatch( STORE_NAME ).setAccountID( ACCOUNT_CREATE ) );

		expect( select ).toHaveClass( 'mdc-select--disabled' );
	} );
} );
