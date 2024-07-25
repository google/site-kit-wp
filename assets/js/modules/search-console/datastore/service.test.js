/**
 * `modules/search-console` data store: service tests.
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
import { decodeServiceURL } from '../../../../../tests/js/mock-accountChooserURL-utils';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { MODULES_SEARCH_CONSOLE } from './constants';

describe( 'module/search-console service store', () => {
	const userData = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};

	const baseURI = 'https://search.google.com/search-console';

	const propertyID = 'https://example.com';
	const domainPropertyID = 'sc-domain:example.com';

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry, userData );
		provideSiteInfo( registry );
	} );

	afterEach( () => {} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			it( 'retrieves the correct URL with no arguments', () => {
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceURL();

				expect( new URL( serviceURL ) ).toMatchObject( {
					origin: 'https://accounts.google.com',
					pathname: '/accountchooser',
				} );
				expect( serviceURL ).toMatchQueryParameters( {
					continue: 'https://search.google.com/search-console',
					Email: 'admin@example.com',
				} );
			} );

			it( 'appends the given path (without leading slash) to the path of the base URL', () => {
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceURL( { path: 'test/path/to/deeplink' } );

				expect(
					new URL( decodeServiceURL( serviceURL ) ).pathname
				).toMatch( new RegExp( '/test/path/to/deeplink$' ) );
			} );

			it( 'appends the given path (with leading slash) to the path of the base URL', () => {
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceURL( { path: '/test/path/to/deeplink' } );

				expect(
					new URL( decodeServiceURL( serviceURL ) ).pathname
				).toMatch( new RegExp( '/test/path/to/deeplink$' ) );
			} );

			it( 'merges given query args to the base service URL args', () => {
				const foo = 'bar';
				const baz = 'buzz';
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceURL( { query: { foo, baz } } );

				const decodedServiceURL = decodeServiceURL( serviceURL );

				expect( decodedServiceURL.startsWith( baseURI ) ).toBe( true );
				expect( decodedServiceURL ).toMatchQueryParameters( {
					foo,
					baz,
				} );
			} );
		} );

		describe( 'getServiceReportURL', () => {
			beforeEach( () => {
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.setPropertyID( propertyID );
			} );

			it( 'returns a deep link to a search-analytics report', () => {
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceReportURL();

				const decodedServiceURL = decodeServiceURL( serviceURL );

				expect( new URL( decodedServiceURL ).pathname ).toMatch(
					new RegExp( '/performance/search-analytics$' )
				);
			} );

			it( 'adds the `resource_id` query arg for the current property ID', () => {
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceReportURL();

				const decodedServiceURL = decodeServiceURL( serviceURL );

				expect( decodedServiceURL ).toMatchQueryParameters( {
					resource_id: propertyID,
				} );
			} );

			it( 'sets a default `page` query arg for domain properties', () => {
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.setPropertyID( domainPropertyID );
				expect(
					registry.select( MODULES_SEARCH_CONSOLE ).isDomainProperty()
				).toBe( true );
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceReportURL();

				const decodedServiceURL = decodeServiceURL( serviceURL );

				const referenceSiteURL = registry
					.select( CORE_SITE )
					.getReferenceSiteURL();

				expect( decodedServiceURL ).toMatchQueryParameters( {
					resource_id: domainPropertyID,
					page: `*${ referenceSiteURL }`,
				} );
			} );

			it( 'sets a default `page` query arg for domain properties that takes precedence over an `undefined` page report arg', () => {
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.setPropertyID( domainPropertyID );
				expect(
					registry.select( MODULES_SEARCH_CONSOLE ).isDomainProperty()
				).toBe( true );
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceReportURL( { page: undefined } );

				const decodedServiceURL = decodeServiceURL( serviceURL );

				const referenceSiteURL = registry
					.select( CORE_SITE )
					.getReferenceSiteURL();

				expect( decodedServiceURL ).toMatchQueryParameters( {
					resource_id: domainPropertyID,
					page: `*${ referenceSiteURL }`,
				} );
			} );
		} );

		describe( 'getServiceEntityAccessURL', () => {
			beforeEach( () => {
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.setPropertyID( domainPropertyID );
			} );

			it( 'adds the `resource_id` query arg for the current property ID', () => {
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceEntityAccessURL();

				const decodedServiceURL = decodeServiceURL( serviceURL );

				expect( decodedServiceURL ).toMatchQueryParameters( {
					resource_id: domainPropertyID,
				} );
			} );
		} );

		describe( 'isDomainProperty', () => {
			it( 'should identify if property is search console domain property', () => {
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.setPropertyID( propertyID );
				expect(
					registry.select( MODULES_SEARCH_CONSOLE ).isDomainProperty()
				).toBe( false );

				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.setPropertyID( domainPropertyID );
				expect(
					registry.select( MODULES_SEARCH_CONSOLE ).isDomainProperty()
				).toBe( true );
			} );
		} );
	} );
} );
