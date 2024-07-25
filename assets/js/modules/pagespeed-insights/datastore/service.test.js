/**
 * `modules/pagespeed-insights` data store: service tests.
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
 *
 * Internal dependencies
 */
import { createTestRegistry } from '../../../../../tests/js/utils';
import { MODULES_PAGESPEED_INSIGHTS } from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

describe( 'module/pagespeed-insights service store', () => {
	const userData = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};
	const baseURI = 'https://pagespeed.web.dev';

	let registry;

	beforeAll( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveUserInfo( userData );
	} );

	afterAll( () => {} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			it( 'retrieves the correct URL with no arguments', () => {
				const serviceURL = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getServiceURL();
				expect( serviceURL ).toBe( baseURI );
			} );

			it( 'adds the path parameter', () => {
				const expectedURL = `${ baseURI }/test/path/to/deeplink`;
				const serviceURLNoSlashes = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getServiceURL( { path: 'test/path/to/deeplink' } );
				expect( serviceURLNoSlashes ).toEqual( expectedURL );
				const serviceURLWithLeadingSlash = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getServiceURL( { path: '/test/path/to/deeplink' } );
				expect( serviceURLWithLeadingSlash ).toEqual( expectedURL );
			} );

			it( 'adds query args', () => {
				const path = '/test/path/to/deeplink';
				const query = {
					param1: '1',
					param2: '2',
				};
				const serviceURL = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getServiceURL( { path, query } );
				expect( serviceURL.startsWith( baseURI ) ).toBe( true );
				expect( serviceURL.split( '?' )[ 0 ].endsWith( path ) ).toBe(
					true
				);
				expect( serviceURL ).toMatchQueryParameters( query );
			} );
		} );
	} );
} );
