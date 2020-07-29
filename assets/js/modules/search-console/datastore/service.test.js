/**
 * modules/search-console data store: service tests.
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
 * Wordpress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 *
 * Internal dependencies
 */
import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { STORE_NAME } from './constants';

describe( 'module/adsense service store', () => {
	const userDataGlobal = '_googlesitekitUserData';
	const userData = {
		connectURL: 'http://example.com/wp-admin/admin.php?page=googlesitekit-splash&googlesitekit_connect=1&nonce=a1b2c3d4e5',
		user: {
			id: 1,
			email: 'admin@fakedomain.com',
			name: 'admin',
			picture: 'https://path/to/image',
		},
		verified: true,
	};
	const baseURI = 'https://search.google.com/search-console';

	let registry;

	beforeAll( async () => {
		// Set up the global
		global[ userDataGlobal ] = userData;
		registry = createTestRegistry();
	} );

	afterAll( async () => {
		delete global[ userDataGlobal ];
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			it( 'retrieves the correct URL with no arguments', async () => {
				const serviceURL = registry.select( STORE_NAME ).getServiceURL();
				expect( serviceURL ).toBe( addQueryArgs( baseURI, { authuser: userData.user.email } ) );
			} );
			it( 'adds the path parameter', () => {
				const expectedURL = addQueryArgs( `${ baseURI }/test/path/to/deeplink`, { authuser: userData.user.email } );
				const serviceURLNoSlashes = registry.select( STORE_NAME ).getServiceURL( { path: 'test/path/to/deeplink' } );
				expect( serviceURLNoSlashes ).toEqual( expectedURL );
				const serviceURLWithLeadingSlash = registry.select( STORE_NAME ).getServiceURL( { path: '/test/path/to/deeplink' } );
				expect( serviceURLWithLeadingSlash ).toEqual( expectedURL );
			} );
			it( 'adds query args', async () => {
				const query = {
					param1: 1,
					param2: 2,
					authuser: userData.user.email,
				};
				const expectedURL = addQueryArgs( `${ baseURI }/test/path/to/deeplink`, query );
				const serviceURL = registry.select( STORE_NAME ).getServiceURL( { path: 'test/path/to/deeplink', query } );
				expect( serviceURL ).toEqual( expectedURL );
			} );
		} );
	} );
} );
