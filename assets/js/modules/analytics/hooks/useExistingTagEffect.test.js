/**
 * Analytics useExistingTagEffect hook tests.
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
import { STORE_NAME } from '../datastore/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE, AMP_MODE_SECONDARY } from '../../../googlesitekit/datastore/site/constants';
import { renderHook, actHook as act } from '../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../tests/js/utils';
import { createBuildAndReceivers } from '../../tagmanager/datastore/__factories__/utils';
import { withActive } from '../../../googlesitekit/modules/datastore/__fixtures__';
import useExistingTagEffect from './useExistingTagEffect';

describe( 'useExistingTagEffect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
		// Set no existing tag.
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
	} );

	it( 'should select existing tag if it is available and user has permissions', async () => {
		fetchMock.getOnce( /^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/, { body: { properties: [] }, status: 200 } );
		fetchMock.getOnce( /^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/, { body: [], status: 200 } );

		const existingTag = {
			accountID: '54321',
			propertyID: 'UA-987654321-1',
		};

		const gtmAnalytics = {
			accountID: '12345',
			webPropertyID: 'UA-123456789-1',
			ampPropertyID: 'UA-123456789-1',
		};

		registry.dispatch( CORE_MODULES ).receiveGetModules( withActive( 'tagmanager' ) );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );

		registry.dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: existingTag.accountID,
			permission: true,
		}, { propertyID: existingTag.propertyID } );

		const { buildAndReceiveWebAndAMP } = createBuildAndReceivers( registry );
		buildAndReceiveWebAndAMP( gtmAnalytics );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: gtmAnalytics.accountID,
			permission: true,
		}, { propertyID: gtmAnalytics.webPropertyID } );

		act( () => {
			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect( registry.select( STORE_NAME ).getAccountID() ).toBe( existingTag.accountID );
		expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( existingTag.propertyID );
		expect( registry.select( STORE_NAME ).getUseSnippet() ).toBe( false );
	} );

	it( 'should not select GTM tag if user doesn\'t have permissions for existing tag', async () => {
		fetchMock.getOnce( /^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/, { body: { properties: [] }, status: 200 } );
		fetchMock.getOnce( /^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/, { body: [], status: 200 } );

		const existingTag = {
			accountID: '54321',
			propertyID: 'UA-987654321-1',
		};

		const gtmAnalytics = {
			accountID: '12345',
			webPropertyID: 'UA-123456789-1',
			ampPropertyID: 'UA-123456789-1',
		};

		registry.dispatch( CORE_MODULES ).receiveGetModules( withActive( 'tagmanager' ) );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );

		registry.dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: existingTag.accountID,
			permission: false,
		}, { propertyID: existingTag.propertyID } );

		const { buildAndReceiveWebAndAMP } = createBuildAndReceivers( registry );
		buildAndReceiveWebAndAMP( gtmAnalytics );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: gtmAnalytics.accountID,
			permission: true,
		}, { propertyID: gtmAnalytics.webPropertyID } );

		act( () => {
			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect( registry.select( STORE_NAME ).getAccountID() ).toBeUndefined();
		expect( registry.select( STORE_NAME ).getPropertyID() ).toBeUndefined();
	} );

	it( 'should select GTM tag if there is no existing tag and user has permissions', async () => {
		fetchMock.getOnce( /^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/, { body: { properties: [] }, status: 200 } );
		fetchMock.getOnce( /^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/, { body: [], status: 200 } );

		const gtmAnalytics = {
			accountID: '12345',
			webPropertyID: 'UA-123456789-1',
			ampPropertyID: 'UA-123456789-1',
		};

		registry.dispatch( CORE_MODULES ).receiveGetModules( withActive( 'tagmanager' ) );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: gtmAnalytics.accountID,
			permission: true,
		}, { propertyID: gtmAnalytics.webPropertyID } );

		const { buildAndReceiveWebAndAMP } = createBuildAndReceivers( registry );
		buildAndReceiveWebAndAMP( gtmAnalytics );

		act( () => {
			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect( registry.select( STORE_NAME ).getAccountID() ).toBe( gtmAnalytics.accountID );
		expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( gtmAnalytics.webPropertyID );
	} );

	it( 'should select nothing if user doesn\'t have permissions neither to existing tag nor to GTM tag', async () => {
		fetchMock.getOnce( /^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/, { body: { properties: [] }, status: 200 } );
		fetchMock.getOnce( /^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/, { body: [], status: 200 } );

		const gtmAnalytics = {
			accountID: '12345',
			webPropertyID: 'UA-123456789-1',
			ampPropertyID: 'UA-123456789-1',
		};

		registry.dispatch( CORE_MODULES ).receiveGetModules( withActive( 'tagmanager' ) );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: gtmAnalytics.accountID,
			permission: false,
		}, { propertyID: gtmAnalytics.webPropertyID } );

		const { buildAndReceiveWebAndAMP } = createBuildAndReceivers( registry );
		buildAndReceiveWebAndAMP( gtmAnalytics );

		act( () => {
			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect( registry.select( STORE_NAME ).getAccountID() ).toBeUndefined();
		expect( registry.select( STORE_NAME ).getPropertyID() ).toBeUndefined();
	} );
} );
