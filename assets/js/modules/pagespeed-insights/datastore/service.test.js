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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createTestRegistry } from '@tests/js/utils';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_DESKTOP,
	STRATEGY_MOBILE,
} from './constants';

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
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			referenceSiteURL: 'https://example.com/',
			currentEntityURL: null,
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getDetailsLinkURL', () => {
			it( 'returns the mobile report URL for the current reference URL by default', () => {
				const detailsLinkURL = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getDetailsLinkURL();

				expect( new URL( detailsLinkURL ).pathname ).toBe( '/report' );
				expect( detailsLinkURL ).toMatchQueryParameters( {
					url: 'https://example.com/',
					form_factor: STRATEGY_MOBILE,
					utm_source: 'sitekit',
				} );
			} );

			it( 'returns the desktop report URL once the desktop tab is selected', () => {
				const desktopRegistry = createTestRegistry();
				desktopRegistry
					.dispatch( CORE_USER )
					.receiveUserInfo( userData );
				desktopRegistry.dispatch( CORE_SITE ).receiveSiteInfo( {
					referenceSiteURL: 'https://example.com/',
					currentEntityURL: null,
				} );
				desktopRegistry
					.dispatch( MODULES_PAGESPEED_INSIGHTS )
					.setActiveTab( STRATEGY_DESKTOP );

				const detailsLinkURL = desktopRegistry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getDetailsLinkURL();

				expect( detailsLinkURL ).toMatchQueryParameters( {
					url: 'https://example.com/',
					form_factor: STRATEGY_DESKTOP,
					utm_source: 'sitekit',
				} );
			} );

			it( 'returns the report URL for the page a user is viewing', () => {
				const pageRegistry = createTestRegistry();
				pageRegistry.dispatch( CORE_USER ).receiveUserInfo( userData );
				pageRegistry.dispatch( CORE_SITE ).receiveSiteInfo( {
					referenceSiteURL: 'https://example.com/',
					currentEntityURL: 'https://example.com/example-page/',
				} );

				const detailsLinkURL = pageRegistry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getDetailsLinkURL();

				expect( detailsLinkURL ).toMatchQueryParameters( {
					url: 'https://example.com/example-page/',
					form_factor: STRATEGY_MOBILE,
					utm_source: 'sitekit',
				} );
			} );

			it( 'returns undefined if the current reference URL is not loaded yet', () => {
				const loadingRegistry = createTestRegistry();
				loadingRegistry
					.dispatch( CORE_USER )
					.receiveUserInfo( userData );

				const detailsLinkURL = loadingRegistry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getDetailsLinkURL();

				expect( detailsLinkURL ).toBeUndefined();
			} );
		} );

		describe( 'getServiceURL', () => {
			it( 'retrieves the correct URL with no arguments', () => {
				const serviceURL = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getServiceURL();

				expect( new URL( serviceURL ).origin ).toBe( baseURI );
			} );

			it( 'adds the path parameter', () => {
				const serviceURLNoSlashes = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getServiceURL( { path: 'test/path/to/deeplink' } );

				expect( new URL( serviceURLNoSlashes ).pathname ).toMatch(
					'/test/path/to/deeplink'
				);

				const serviceURLWithLeadingSlash = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getServiceURL( { path: '/test/path/to/deeplink' } );

				expect(
					new URL( serviceURLWithLeadingSlash ).pathname
				).toMatch( '/test/path/to/deeplink' );
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
				expect( serviceURL ).toMatchQueryParameters( {
					...query,
					utm_source: 'sitekit',
				} );
			} );

			it( 'includes utm_source parameter', () => {
				const serviceURL = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getServiceURL();

				expect( serviceURL ).toMatchQueryParameters( {
					utm_source: 'sitekit',
				} );
			} );
		} );
	} );
} );
