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
import { createTestRegistry } from '../../../../../tests/js/utils';
import {
	AMP_MODE_SECONDARY,
	CORE_SITE,
} from '../../../googlesitekit/datastore/site/constants';
import { MODULES_TAGMANAGER, CONTEXT_WEB } from '../datastore/constants';
import * as factories from '../datastore/__factories__';
import useExistingTagEffect from './useExistingTagEffect';

describe( 'useExistingTagEffect', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {} );
		// Set set no existing tag.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			ampMode: AMP_MODE_SECONDARY,
		} );
	} );

	it( 'sets useSnippet value based on existing tag and selected container', () => {
		const account = factories.accountBuilder();
		// eslint-disable-next-line sitekit/acronym-case
		const accountID = account.accountId;
		const containers = factories.buildContainers(
			2,
			// eslint-disable-next-line sitekit/acronym-case
			{ accountId: account.accountId, usageContext: [ CONTEXT_WEB ] }
		);
		const [ existingContainer, anotherContainer ] = containers;

		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.receiveGetExistingTag( existingContainer.publicId );

		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( containers, { accountID } );
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		expect(
			registry.select( MODULES_TAGMANAGER ).getUseSnippet()
		).toBeUndefined();

		expect(
			registry.select( MODULES_TAGMANAGER ).getContainerID()
		).toBeUndefined();

		act( () => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				// eslint-disable-next-line sitekit/acronym-case
				.setContainerID( '' );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.setInternalContainerID( '' );
			rerender();
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			undefined
		);
		expect( registry.select( MODULES_TAGMANAGER ).getContainerID() ).toBe(
			''
		);

		act( () => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				// eslint-disable-next-line sitekit/acronym-case
				.setContainerID( existingContainer.publicId );
			registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID(
				// eslint-disable-next-line sitekit/acronym-case
				existingContainer.containerId
			);
			rerender();
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			false
		);

		act( () => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				// eslint-disable-next-line sitekit/acronym-case
				.setContainerID( anotherContainer.publicId );
			registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID(
				// eslint-disable-next-line sitekit/acronym-case
				anotherContainer.containerId
			);
			rerender();
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			true
		);
	} );

	it( 'does not change the useSnippet value when there is already a container ID on page load (container ID is same as existing tag)', () => {
		const account = factories.accountBuilder();
		// eslint-disable-next-line sitekit/acronym-case
		const accountID = account.accountId;
		const containers = factories.buildContainers(
			2,
			// eslint-disable-next-line sitekit/acronym-case
			{ accountId: account.accountId, usageContext: [ CONTEXT_WEB ] }
		);
		const [ existingContainer, anotherContainer ] = containers;

		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.receiveGetExistingTag( existingContainer.publicId );

		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( containers, { accountID } );
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );

		// Manually enable useSnippet.
		registry.dispatch( MODULES_TAGMANAGER ).setUseSnippet( true );

		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setContainerID( existingContainer.publicId );
		registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID(
			// eslint-disable-next-line sitekit/acronym-case
			existingContainer.containerId
		);

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			true
		);

		act( () => {
			// Set useSnippet to false to simulate pressing the toggle.
			registry.dispatch( MODULES_TAGMANAGER ).setUseSnippet( false );
			// Change to another container. This should change the useSnippet value.
			registry
				.dispatch( MODULES_TAGMANAGER )
				// eslint-disable-next-line sitekit/acronym-case
				.setContainerID( anotherContainer.publicId );
			registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID(
				// eslint-disable-next-line sitekit/acronym-case
				anotherContainer.containerId
			);
			rerender();
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			true
		);

		act( () => {
			// Change back to existing container. This should change the useSnippet value.
			registry
				.dispatch( MODULES_TAGMANAGER )
				// eslint-disable-next-line sitekit/acronym-case
				.setContainerID( existingContainer.publicId );
			registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID(
				// eslint-disable-next-line sitekit/acronym-case
				existingContainer.containerId
			);
			rerender();
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			false
		);
	} );

	it( 'does not change the useSnippet value when there is already a container ID on page load (container ID is not the same as existing tag)', () => {
		const account = factories.accountBuilder();
		// eslint-disable-next-line sitekit/acronym-case
		const accountID = account.accountId;
		const containers = factories.buildContainers(
			3,
			// eslint-disable-next-line sitekit/acronym-case
			{ accountId: account.accountId, usageContext: [ CONTEXT_WEB ] }
		);
		const [ existingContainer, anotherContainer, thirdContainer ] =
			containers;

		registry
			.dispatch( MODULES_TAGMANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.receiveGetExistingTag( existingContainer.publicId );

		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetAccounts( [ account ] );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( containers, { accountID } );
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );

		// Manually disable useSnippet.
		registry.dispatch( MODULES_TAGMANAGER ).setUseSnippet( false );

		const { rerender } = renderHook( () => useExistingTagEffect(), {
			registry,
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			false
		);
		expect(
			registry.select( MODULES_TAGMANAGER ).getContainerID()
		).toBeUndefined();

		act( () => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				// eslint-disable-next-line sitekit/acronym-case
				.setContainerID( anotherContainer.publicId );
			registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID(
				// eslint-disable-next-line sitekit/acronym-case
				anotherContainer.containerId
			);
			rerender();
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			false
		);

		act( () => {
			// Set useSnippet to true to simulate pressing the toggle.
			registry.dispatch( MODULES_TAGMANAGER ).setUseSnippet( true );
			// Change to existing tag container. This should change the useSnippet value.
			registry
				.dispatch( MODULES_TAGMANAGER )
				// eslint-disable-next-line sitekit/acronym-case
				.setContainerID( existingContainer.publicId );
			registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID(
				// eslint-disable-next-line sitekit/acronym-case
				existingContainer.containerId
			);
			rerender();
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			false
		);

		act( () => {
			// Change to a third container. This should change the useSnippet value.
			registry
				.dispatch( MODULES_TAGMANAGER )
				// eslint-disable-next-line sitekit/acronym-case
				.setContainerID( thirdContainer.publicId );
			registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID(
				// eslint-disable-next-line sitekit/acronym-case
				thirdContainer.containerId
			);
			rerender();
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			true
		);

		act( () => {
			// Set useSnippet to true to simulate pressing the toggle.
			registry.dispatch( MODULES_TAGMANAGER ).setUseSnippet( false );
			// Change back to initially saved container. This should change the useSnippet value.
			registry
				.dispatch( MODULES_TAGMANAGER )
				// eslint-disable-next-line sitekit/acronym-case
				.setContainerID( anotherContainer.publicId );
			registry.dispatch( MODULES_TAGMANAGER ).setInternalContainerID(
				// eslint-disable-next-line sitekit/acronym-case
				anotherContainer.containerId
			);
			rerender();
		} );

		expect( registry.select( MODULES_TAGMANAGER ).getUseSnippet() ).toBe(
			true
		);
	} );
} );
