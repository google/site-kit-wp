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

	const accountChooserBaseURI = `https://accounts.google.com/accountchooser?continue=${ encodeURIComponent(
		baseURI
	) }`;

	/**
	 * Mocks an account chooser URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} path The path to append to the base URL.
	 * @return {string} The account chooser with an appended path.
	 */
	const mockAccountChooserURL = ( path = '' ) =>
		`${ accountChooserBaseURI }${
			path &&
			`${ encodeURIComponent( '#/' ) }${ encodeURIComponent(
				path.replace( /^\//, '' )
			) }`
		}&Email=${ encodeURIComponent( userData.email ) }`;

	/**
	 * Decodes an account chooser URLs `continue` argument.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} receivedURL The URL to decode.
	 * @return {string} The decoded URL.
	 */
	const decodeServiceURL = ( receivedURL ) => {
		const url = new URL( receivedURL );

		const received = Array.from( url.searchParams ).reduce(
			( object, [ key, value ] ) => {
				object[ key ] = value;

				return object;
			},
			{}
		);

		if ( ! received.continue ) {
			return;
		}

		const serviceURL = decodeURIComponent( received.continue );

		return serviceURL;
	};

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
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceURL();
				expect( serviceURL.startsWith( mockAccountChooserURL() ) ).toBe(
					true
				);
			} );

			it( 'appends the given path (without leading slash) to the path of the base URL', () => {
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceURL( { path: 'test/path/to/deeplink' } );
				expect(
					serviceURL.endsWith(
						mockAccountChooserURL( '/test/path/to/deeplink' )
					)
				).toBe( true );
			} );

			it( 'appends the given path (with leading slash) to the path of the base URL', () => {
				const serviceURL = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getServiceURL( { path: '/test/path/to/deeplink' } );
				expect(
					serviceURL.endsWith(
						mockAccountChooserURL( '/test/path/to/deeplink' )
					)
				).toBe( true );
			} );

			it( 'merges given query args to the base service URL args', async () => {
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

				expect(
					decodedServiceURL.endsWith(
						'#/performance/search-analytics'
					)
				).toBe( true );
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

		describe( 'isDomainProperty', () => {
			it( 'should identify if property is search console domain property', async () => {
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
