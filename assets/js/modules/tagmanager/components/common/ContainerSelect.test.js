/**
 * Container Select component tests.
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
import ContainerSelect from './ContainerSelect';
import { render, act } from '../../../../../../tests/js/test-utils';
import {
	MODULES_TAGMANAGER,
	ACCOUNT_CREATE,
} from '@/js/modules/tagmanager/datastore/constants';
import { createTestRegistry } from '../../../../../../tests/js/utils';
import * as factories from '@/js/modules/tagmanager/datastore/__factories__';

describe( 'ContainerSelect', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		// Set set no existing tag.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
	} );

	it( 'should be disabled if the selected account is not a valid account', async () => {
		const account = factories.accountBuilder();
		const { accountId: accountID } = account; // eslint-disable-line sitekit/acronym-case
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( [], { accountID } );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getAccounts', [] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getContainers', [ accountID ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.finishResolution( 'getContainers', [ ACCOUNT_CREATE ] );

		const { container } = render( <ContainerSelect containers={ [] } />, {
			registry,
		} );
		const select = container.querySelector( '.mdc-select' );

		expect( select ).not.toHaveClass( 'mdc-select--disabled' );

		// The account option to "set up a new account" is technically an invalid accountID.
		await act( () =>
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setAccountID( ACCOUNT_CREATE )
		);

		expect( select ).toHaveClass( 'mdc-select--disabled' );
	} );
} );
