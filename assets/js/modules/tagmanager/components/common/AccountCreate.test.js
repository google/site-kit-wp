/**
 * Account Create component tests.
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
import AccountCreate from './AccountCreate';
import {
	fireEvent,
	render,
	waitFor,
	createTestRegistry,
	muteFetch,
} from '../../../../../../tests/js/test-utils';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import * as factories from '../../datastore/__factories__';

describe( 'AccountCreate', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		// Set set no existing tag by default.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
		// Set user info.
		registry
			.dispatch( CORE_USER )
			.receiveUserInfo( { email: 'user@example.com' } );
		registry.dispatch( CORE_USER ).finishResolution( 'getUser', [] );
		// Prevent error when loading site info.
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
		// Receive empty modules to prevent unexpected fetch by resolver.
		registry.dispatch( CORE_MODULES ).receiveGetModules( [] );
	} );

	it( 'displays a progress bar while accounts are being loaded', () => {
		const { getByRole, queryByRole } = render( <AccountCreate />, {
			registry,
		} );

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
		expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'resets accounts when the re-fetch accounts link is clicked', async () => {
		const accountA = factories.accountBuilder();
		const accountB = factories.accountBuilder();
		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setAccountID( accountA.accountId );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ accountA ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/tagmanager/data/accounts'
			),
			{ body: [ accountA, accountB ], status: 200 }
		);
		const { getByRole } = render( <AccountCreate />, { registry } );

		const refetchMyAccountButton = getByRole( 'button', {
			name: /re-fetch my account/i,
		} );

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/tagmanager/data/containers'
			),
			[]
		);
		fireEvent.click( refetchMyAccountButton );

		await waitFor(
			() => registry.select( MODULES_TAGMANAGER ).getAccounts().length > 1
		);
		expect( fetchMock ).toHaveFetched(
			new RegExp(
				'^/google-site-kit/v1/modules/tagmanager/data/accounts'
			)
		);
	} );

	describe( '"Create an account" button', () => {
		let openSpy;
		beforeEach( () => {
			openSpy = jest.spyOn( global, 'open' );
			// Need to set a placeholder implementation here to prevent JSDOM from raising a "Error: Not implemented" error.
			openSpy.mockImplementation( () => {} );
		} );
		afterEach( () => openSpy.mockRestore() );

		it( 'opens a new window  new account screen for the current user', () => {
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetAccounts( [] );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.finishResolution( 'getAccounts', [] );

			const { getByRole } = render( <AccountCreate />, { registry } );

			const createAccountButton = getByRole( 'button', {
				name: /Create an account/i,
			} );

			fireEvent.click( createAccountButton );

			expect( openSpy ).toHaveBeenCalledTimes( 1 );
			expect( openSpy ).toHaveBeenCalledWith(
				expect.stringMatching( /tagmanager.google.com/ ),
				'_blank'
			);
			expect( openSpy ).toHaveBeenCalledWith(
				expect.stringContaining(
					`${ encodeURIComponent(
						'/admin/accounts/create'
					) }&Email=${ encodeURIComponent( 'user@example.com' ) }`
				),
				'_blank'
			);
		} );
	} );
} );
