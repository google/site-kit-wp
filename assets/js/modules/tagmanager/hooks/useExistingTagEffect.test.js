/**
 * Tag Manager useExistingTagEffect hook tests.
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
import { renderHook, actHook as act } from '../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	untilResolved,
} from '../../../../../tests/js/utils';
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
		// eslint-disable-next-line sitekit/acronym-case
		const accountID = account.accountId;
		const containers = factories.buildContainers( 3, {
			// eslint-disable-next-line sitekit/acronym-case
			accountId: account.accountId,
			usageContext: [ CONTEXT_WEB ],
		} );
		const [ firstContainer, existingContainer ] = containers;
		registry.dispatch( STORE_NAME ).receiveGetAccounts( [ account ] );
		registry
			.dispatch( STORE_NAME )
			.receiveGetContainers( containers, { accountID } );
		registry.dispatch( STORE_NAME ).setAccountID( accountID );

		registry
			.dispatch( STORE_NAME )
			// eslint-disable-next-line sitekit/acronym-case
			.setContainerID( firstContainer.publicId );

		registry
			.dispatch( STORE_NAME )
			// eslint-disable-next-line sitekit/acronym-case
			.setInternalContainerID( firstContainer.containerId );

		let rerender;
		await act(
			() =>
				new Promise( async ( resolve ) => {
					( { rerender } = renderHook( () => useExistingTagEffect(), {
						registry,
					} ) );
					await untilResolved(
						registry,
						STORE_NAME
					).getTagPermission( null );
					resolve();
				} )
		);

		expect( registry.select( STORE_NAME ).getContainerID() ).toBe(
			// eslint-disable-next-line sitekit/acronym-case
			firstContainer.publicId
		);

		expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe(
			// eslint-disable-next-line sitekit/acronym-case
			firstContainer.containerId
		);

		await act(
			() =>
				new Promise( async ( resolve ) => {
					registry.dispatch( STORE_NAME ).receiveGetTagPermission(
						{ accountID, permission: true },
						// eslint-disable-next-line sitekit/acronym-case
						{ containerID: existingContainer.publicId }
					);

					registry
						.dispatch( STORE_NAME )
						// eslint-disable-next-line sitekit/acronym-case
						.receiveGetExistingTag( existingContainer.publicId );

					await untilResolved(
						registry,
						STORE_NAME
						// eslint-disable-next-line sitekit/acronym-case
					).getTagPermission( existingContainer.publicId );
					rerender();
					resolve();
				} )
		);

		expect( registry.select( STORE_NAME ).getContainerID() ).toBe(
			// eslint-disable-next-line sitekit/acronym-case
			existingContainer.publicId
		);

		expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe(
			// eslint-disable-next-line sitekit/acronym-case
			existingContainer.containerId
		);
	} );
} );
