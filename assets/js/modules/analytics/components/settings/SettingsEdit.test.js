/**
 * Analytics Settings Edit component tests.
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
 * WordPress dependencies
 */
import apiFetchMock from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { render, waitFor } from '../../../../../../tests/js/test-utils';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import SettingsEdit from './SettingsEdit';
import * as fixtures from '../../datastore/__fixtures__';

// Mock apiFetch so we know if it's called.
jest.mock( '@wordpress/api-fetch' );
apiFetchMock.mockImplementation( ( ...args ) => {
	// eslint-disable-next-line no-console
	console.warn( 'apiFetch', ...args );
} );

describe( 'SettingsEdit', () => {
	afterEach( () => apiFetchMock.mockClear() );
	afterAll( () => jest.restoreAllMocks() );

	it( 'sets the account ID and property ID of an existing tag when present', () => {
		const existingTag = {};
		const setupRegistry = ( { dispatch } ) => {
			const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
			existingTag.accountID = profiles[ 0 ].accountId;
			existingTag.propertyID = profiles[ 0 ].webPropertyId;
			const { accountID, propertyID } = existingTag;
			dispatch( STORE_NAME ).setSettings( {} );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, { accountID, propertyID } );
			dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
			dispatch( STORE_NAME ).receiveGetTagPermission( {
				accountID: existingTag.accountID,
				permission: true,
			}, { propertyID: existingTag.propertyID } );
			dispatch( CORE_SITE ).receiveSiteInfo( {} );
		};
		const { registry } = render( <SettingsEdit />, { setupRegistry } );

		waitFor( () => {
			expect( registry.select( STORE_NAME ).getAccountID() ).toBe( existingTag.accountID );
			expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( existingTag.propertyID );
			expect( registry.select( STORE_NAME ).hasErrors() ).toBeFalsy();
			expect( console ).toHaveWarned();
		} );
	} );
} );
