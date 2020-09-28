/**
 * Tag Manager useExistingTagEffect hook tests.
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
import { renderHook, actHook as act } from '../../../../../tests/js/test-utils';
import { createTestRegistry, untilResolved } from '../../../../../tests/js/utils';
import { STORE_NAME, CONTEXT_WEB } from '../datastore/constants';
import * as factories from '../datastore/__factories__';
import useExistingTagEffect from './useExistingTagEffect';

describe( 'useExistingTagEffect', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
		// Set set no existing tag.
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
	} );

	it( 'sets the accountID and containerID when there is an existing tag with permission', async () => {
		const account = factories.accountBuilder();
		// eslint-disable-next-line sitekit/camelcase-acronyms
		const accountID = account.accountId;
		const containers = factories.buildContainers(
			// eslint-disable-next-line sitekit/camelcase-acronyms
			3, { accountId: account.accountId, usageContext: [ CONTEXT_WEB ] }
		);
		const [ firstContainer, existingContainer ] = containers;
		registry.dispatch( STORE_NAME ).receiveGetAccounts( [ account ] );
		registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );
		registry.dispatch( STORE_NAME ).setAccountID( accountID );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setContainerID( firstContainer.publicId );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setInternalContainerID( firstContainer.containerId );

		let rerender;
		await act( () => new Promise( async ( resolve ) => {
			( { rerender } = renderHook( () => useExistingTagEffect(), { registry } ) );
			await untilResolved( registry, STORE_NAME ).getTagPermission( null );
			resolve();
		} ) );

		// eslint-disable-next-line sitekit/camelcase-acronyms
		expect( registry.select( STORE_NAME ).getContainerID() ).toBe( firstContainer.publicId );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( firstContainer.containerId );

		await act( () => new Promise( async ( resolve ) => {
			// eslint-disable-next-line sitekit/camelcase-acronyms
			registry.dispatch( STORE_NAME ).receiveGetTagPermission( { accountID, permission: true }, { containerID: existingContainer.publicId } );
			// eslint-disable-next-line sitekit/camelcase-acronyms
			registry.dispatch( STORE_NAME ).receiveGetExistingTag( existingContainer.publicId );
			// eslint-disable-next-line sitekit/camelcase-acronyms
			await untilResolved( registry, STORE_NAME ).getTagPermission( existingContainer.publicId );
			rerender();
			resolve();
		} ) );

		// eslint-disable-next-line sitekit/camelcase-acronyms
		expect( registry.select( STORE_NAME ).getContainerID() ).toBe( existingContainer.publicId );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( existingContainer.containerId );
	} );
} );
