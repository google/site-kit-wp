/**
 * Analytics useExistingTagEffect hook tests.
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
import { STORE_NAME } from '../datastore/constants';
import { STORE_NAME as CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME as CORE_SITE, AMP_MODE_SECONDARY } from '../../../googlesitekit/datastore/site/constants';
import { renderHook, act } from '../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../tests/js/utils';
import { makeBuildAndReceiveWebAndAMP } from '../../tagmanager/datastore/util/web-and-amp';
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

	it( 'sets the accountID and selects property when there is an existing tag with permission', async () => {
		fetchMock.getOnce( /^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/, { body: { properties: [] }, status: 200 } );
		fetchMock.getOnce( /^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/, { body: [], status: 200 } );

		const data = {
			accountID: '12345',
			webPropertyID: 'UA-123456789-1',
			ampPropertyID: 'UA-123456789-1',
		};

		registry.dispatch( CORE_MODULES ).receiveGetModules( [
			{
				slug: 'tagmanager',
				name: 'Tag Manager',
				description: 'Tag Manager creates an easy to manage way to create tags on your site without updating code.',
				homepage: 'https://tagmanager.google.com/',
				internal: false,
				active: true,
				connected: true,
				dependencies: [ 'analytics' ],
				dependants: [],
				order: 10,
			},
		] );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: data.accountID,
			permission: true,
		}, { propertyID: data.webPropertyID } );

		makeBuildAndReceiveWebAndAMP( registry )( data );

		act( () => {
			renderHook( () => useExistingTagEffect(), { registry } );
		} );

		expect( registry.select( STORE_NAME ).getAccountID() ).toBe( data.accountID );
		expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( data.webPropertyID );
	} );
} );
