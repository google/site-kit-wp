/**
 * `modules/search-console` data store: service tests.
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
import { STORE_NAME as CORE_USER } from '../../../googlesitekit/datastore/user/constants';

describe( 'module/search-console service store', () => {
	const userData = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};
	const baseURI = 'https://search.google.com/search-console';

	let registry;

	beforeAll( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveUserInfo( userData );
	} );

	afterAll( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			it( 'retrieves the correct URL with no arguments', async () => {
				const serviceURL = registry.select( STORE_NAME ).getServiceURL();
				expect( serviceURL ).toBe( addQueryArgs( baseURI, { authuser: userData.email } ) );
			} );

			it( 'adds the path parameter', () => {
				const expectedURL = addQueryArgs( `${ baseURI }/test/path/to/deeplink`, { authuser: userData.email } );
				const serviceURLNoSlashes = registry.select( STORE_NAME ).getServiceURL( { path: 'test/path/to/deeplink' } );
				expect( serviceURLNoSlashes ).toEqual( expectedURL );
				const serviceURLWithLeadingSlash = registry.select( STORE_NAME ).getServiceURL( { path: '/test/path/to/deeplink' } );
				expect( serviceURLWithLeadingSlash ).toEqual( expectedURL );
			} );

			it( 'adds query args', async () => {
				const path = '/test/path/to/deeplink';
				const query = {
					param1: '1',
					param2: '2',
				};
				const serviceURL = registry.select( STORE_NAME ).getServiceURL( { path, query } );
				expect( serviceURL.startsWith( baseURI ) ).toBe( true );
				expect( serviceURL.split( '?' )[ 0 ].endsWith( path ) ).toBe( true );
				expect( serviceURL ).toMatchQueryParameters( query );
			} );
		} );
		describe( 'isDomainProperty', () => {
			it( 'identify if property is search console domain property', async () => {
				registry.dispatch( STORE_NAME ).setSettings( {
					propertyID: 'http://sitekit.google.com',
				} );

				let isDomainProperty = registry.select( STORE_NAME ).isDomainProperty();
				expect( isDomainProperty ).toBe( false );

				registry.dispatch( STORE_NAME ).setSettings( {
					propertyID: 'sc-domain:sitekit.google.com',
				} );

				isDomainProperty = registry.select( STORE_NAME ).isDomainProperty();
				expect( isDomainProperty ).toBe( true );
			} );
		} );
	} );
} );
