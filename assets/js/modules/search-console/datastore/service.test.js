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
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { STORE_NAME } from './constants';

describe( 'module/search-console service store', () => {
	const userData = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};
	const authuser = userData.email;
	const baseURI = 'https://search.google.com/search-console';

	const propertyID = 'https://example.com';
	const domainPropertyID = 'sc-domain:example.com';

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry, userData );
		provideSiteInfo( registry );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			it( 'retrieves the correct URL with no arguments', async () => {
				const serviceURL = registry.select( STORE_NAME ).getServiceURL();
				expect( serviceURL.startsWith( baseURI ) ).toBe( true );
				expect( serviceURL ).toMatchQueryParameters( { authuser: userData.email } );
			} );

			it( 'appends the given path (without leading slash) to the path of the base URL', () => {
				const serviceURL = registry.select( STORE_NAME ).getServiceURL( { path: 'test/path/to/deeplink' } );
				expect( serviceURL.startsWith( `${ baseURI }/test/path/to/deeplink` ) ).toBe( true );
			} );

			it( 'appends the given path (with leading slash) to the path of the base URL', () => {
				const serviceURL = registry.select( STORE_NAME ).getServiceURL( { path: '/test/path/to/deeplink' } );
				expect( serviceURL.startsWith( `${ baseURI }/test/path/to/deeplink` ) ).toBe( true );
			} );

			it( 'merges given query args to the base service URL args', async () => {
				const foo = 'bar';
				const baz = 'buzz';
				const serviceURL = registry.select( STORE_NAME ).getServiceURL( { query: { foo, baz } } );
				expect( serviceURL.startsWith( baseURI ) ).toBe( true );
				expect( serviceURL ).toMatchQueryParameters( { foo, baz, authuser } );
			} );

			it( 'does not take precedence over the authuser query arg', () => {
				const query = {
					authuser: 'bar', // conflicts with userData.email applied in the selector
					baz: 'buzz',
				};
				const serviceURL = registry.select( STORE_NAME ).getServiceURL( { query } );
				expect( serviceURL.startsWith( baseURI ) ).toBe( true );
				expect( serviceURL ).toMatchQueryParameters( {
					authuser: userData.email,
					baz: 'buzz',
				} );
			} );
		} );

		describe( 'getServiceReportURL', () => {
			beforeEach( () => {
				registry.dispatch( STORE_NAME ).setPropertyID( propertyID );
			} );

			it( 'returns a deep link to a search-analytics report', () => {
				const serviceURL = registry.select( STORE_NAME ).getServiceReportURL();
				expect( serviceURL.startsWith( `${ baseURI }/performance/search-analytics` ) ).toBe( true );
			} );

			it( 'adds the `resource_id` query arg for the current property ID', () => {
				const serviceURL = registry.select( STORE_NAME ).getServiceReportURL();
				expect( serviceURL ).toMatchQueryParameters( { resource_id: propertyID } );
			} );

			it( 'sets a default `page` query arg for domain properties', () => {
				registry.dispatch( STORE_NAME ).setPropertyID( domainPropertyID );
				expect( registry.select( STORE_NAME ).isDomainProperty() ).toBe( true );
				const serviceURL = registry.select( STORE_NAME ).getServiceReportURL();
				const referenceSiteURL = registry.select( CORE_SITE ).getReferenceSiteURL();
				expect( serviceURL ).toMatchQueryParameters( {
					resource_id: domainPropertyID,
					page: `*${ referenceSiteURL }`,
				} );
			} );

			it( 'sets a default `page` query arg for domain properties that takes precedence over an `undefined` page report arg', () => {
				registry.dispatch( STORE_NAME ).setPropertyID( domainPropertyID );
				expect( registry.select( STORE_NAME ).isDomainProperty() ).toBe( true );
				const serviceURL = registry.select( STORE_NAME ).getServiceReportURL( { page: undefined } );
				const referenceSiteURL = registry.select( CORE_SITE ).getReferenceSiteURL();
				expect( serviceURL ).toMatchQueryParameters( {
					resource_id: domainPropertyID,
					page: `*${ referenceSiteURL }`,
				} );
			} );
		} );

		describe( 'isDomainProperty', () => {
			it( 'should identify if property is search console domain property', async () => {
				registry.dispatch( STORE_NAME ).setPropertyID( propertyID );
				expect( registry.select( STORE_NAME ).isDomainProperty() ).toBe( false );

				registry.dispatch( STORE_NAME ).setPropertyID( domainPropertyID );
				expect( registry.select( STORE_NAME ).isDomainProperty() ).toBe( true );
			} );
		} );
	} );
} );
