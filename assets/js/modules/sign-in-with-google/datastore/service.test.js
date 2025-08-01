/**
 * `modules/sign-in-with-google` data store: service tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { decodeServiceURL } from '../../../../../tests/js/mock-accountChooserURL-utils';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { MODULES_SIGN_IN_WITH_GOOGLE } from './constants';

describe( 'module/sign-in-with-google service store', () => {
	const baseURI = 'https://developers.google.com/identity/site-kit';

	const userData = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry, userData );
		provideSiteInfo( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			it( 'retrieves the correct URL with no arguments', () => {
				const serviceURL = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getServiceURL();

				expect( serviceURL ).toMatchInlineSnapshot(
					'"https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fdevelopers.google.com%2Fidentity%2Fsite-kit&Email=admin%40example.com"'
				);
			} );

			it( 'adds the path parameter', () => {
				const serviceURLNoSlashes = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getServiceURL( { path: 'test/path/to/deeplink' } );

				expect( serviceURLNoSlashes ).toMatchInlineSnapshot(
					'"https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fdevelopers.google.com%2Fidentity%2Fsite-kit%23%2Ftest%2Fpath%2Fto%2Fdeeplink&Email=admin%40example.com"'
				);

				const serviceURLWithLeadingSlash = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getServiceURL( { path: '/test/path/to/deeplink' } );

				expect( serviceURLWithLeadingSlash ).toMatchInlineSnapshot(
					'"https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fdevelopers.google.com%2Fidentity%2Fsite-kit%23%2Ftest%2Fpath%2Fto%2Fdeeplink&Email=admin%40example.com"'
				);
			} );

			it( 'adds query args', () => {
				const path = '/test/path/to/deeplink';
				const query = {
					authuser: userData.email,
					param1: '1',
					param2: '2',
				};
				const serviceURL = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getServiceURL( { path, query } );
				const decodedServiceURL = decodeServiceURL( serviceURL );

				expect( decodedServiceURL.startsWith( baseURI ) ).toBe( true );
				expect( decodedServiceURL.endsWith( `#${ path }` ) ).toBe(
					true
				);
				expect( decodedServiceURL ).toMatchQueryParameters( query );
			} );
		} );
		describe( 'getServiceClientIDProvisioningURL', () => {
			it( 'retrieves the correct Client ID URL', () => {
				const clientIDURL = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getServiceClientIDProvisioningURL();

				expect( clientIDURL ).toMatchInlineSnapshot(
					'"https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fdevelopers.google.com%2Fidentity%2Fsite-kit%3Fappname%3DMy%2520Site%2520Name%26sitename%3DMy%2520Site%2520Name%26siteorigin%3Dhttp%253A%252F%252Fexample.com&Email=admin%40example.com"'
				);
			} );

			it( 'sanitizes invalid characters in site name for appname parameter', () => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					adminURL: 'http://example.com/wp-admin',
					ampMode: false,
					currentEntityID: null,
					currentEntityTitle: null,
					currentEntityType: null,
					currentEntityURL: null,
					homeURL: 'http://example.com',
					siteName: 'Test@Site!Name',
				} );

				const clientIDURL = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getServiceClientIDProvisioningURL();
				const decodedServiceURL = decodeServiceURL( clientIDURL );

				expect( decodedServiceURL ).toMatchQueryParameters( {
					appname: 'Test-Site-Name',
					sitename: 'Test@Site!Name',
				} );
			} );

			it( 'generates fallback name for very short site names', () => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					adminURL: 'http://example.com/wp-admin',
					ampMode: false,
					currentEntityID: null,
					currentEntityTitle: null,
					currentEntityType: null,
					currentEntityURL: null,
					homeURL: 'http://example.com',
					siteName: 'Hi!',
				} );

				const clientIDURL = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getServiceClientIDProvisioningURL();
				const decodedServiceURL = decodeServiceURL( clientIDURL );

				expect( decodedServiceURL ).toMatchQueryParameters(
					expect.objectContaining( {
						appname: expect.stringMatching(
							/^site-kit-siwg-[a-f0-9]{16}$/
						),
						sitename: 'Hi!',
					} )
				);
			} );

			it( 'truncates very long site names for appname parameter', () => {
				const longSiteName =
					'This is a very long site name that exceeds the thirty character limit for appname parameter';
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					adminURL: 'http://example.com/wp-admin',
					ampMode: false,
					currentEntityID: null,
					currentEntityTitle: null,
					currentEntityType: null,
					currentEntityURL: null,
					homeURL: 'http://example.com',
					siteName: longSiteName,
				} );

				const clientIDURL = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getServiceClientIDProvisioningURL();
				const decodedServiceURL = decodeServiceURL( clientIDURL );

				expect( decodedServiceURL ).toMatchQueryParameters(
					expect.objectContaining( {
						appname: expect.stringMatching( /^.{1,30}$/ ),
						sitename: longSiteName,
					} )
				);
			} );
		} );
	} );
} );
