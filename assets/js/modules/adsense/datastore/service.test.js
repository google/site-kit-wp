/**
 * `modules/adsense` data store: service tests.
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
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import {
	ACCOUNT_STATUS_APPROVED,
	SITE_STATUS_ADDED,
} from '../util/status';
import { STORE_NAME } from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

describe( 'module/adsense service store', () => {
	const userData = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};
	const baseURI = 'https://www.google.com/adsense/new/u/0';
	const settings = {
		accountID: 'pub-12345678',
		clientID: 'ca-pub-12345678',
		useSnippet: true,
		accountStatus: ACCOUNT_STATUS_APPROVED,
		siteStatus: SITE_STATUS_ADDED,
	};
	const siteInfo = {
		referenceSiteURL: 'http://example.com/',
	};

	let registry;

	beforeAll( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			beforeEach( () => {
				registry.dispatch( CORE_USER ).receiveUserInfo( userData );
			} );

			it( 'retrieves the correct URL with no arguments', async () => {
				const serviceURL = registry.select( STORE_NAME ).getServiceURL();
				expect( serviceURL ).toBe( `${ baseURI }?authuser=${ encodeURIComponent( userData.email ) }` );
			} );

			it( 'prepends a forward slash to to the path if missing', () => {
				const expectedURL = `${ baseURI }/test/path/to/deeplink?authuser=${ encodeURIComponent( userData.email ) }`;

				const serviceURLNoSlashes = registry.select( STORE_NAME ).getServiceURL( { path: 'test/path/to/deeplink' } );
				expect( serviceURLNoSlashes ).toEqual( expectedURL );
				const serviceURLWithLeadingSlash = registry.select( STORE_NAME ).getServiceURL( { path: '/test/path/to/deeplink' } );
				expect( serviceURLWithLeadingSlash ).toEqual( expectedURL );
			} );

			it( 'adds query args', async () => {
				const path = '/test/path/to/deeplink';
				const query = {
					authuser: userData.email,
					param1: '1',
					param2: '2',
				};
				const serviceURL = registry.select( STORE_NAME ).getServiceURL( { path, query } );
				expect( serviceURL.startsWith( baseURI ) ).toBe( true );
				expect( serviceURL.endsWith( `${ path }?authuser=${ encodeURIComponent( userData.email ) }&param1=1&param2=2` ) ).toBe( true );
				expect( serviceURL ).toMatchQueryParameters( query );
			} );
		} );

		describe( 'getServiceAccountSiteURL', () => {
			beforeEach( () => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( siteInfo );
				registry.dispatch( STORE_NAME ).setSettings( settings );
			} );

			it( 'should return undefined if accountID is undefined', () => {
				registry.dispatch( STORE_NAME ).setSettings( { accountID: undefined } );

				const url = registry.select( STORE_NAME ).getServiceAccountSiteURL();
				expect( url ).toBeUndefined();
			} );

			it( 'should return undefined if referenceSiteURL is undefined', () => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( { referenceSiteURL: undefined } );

				const url = registry.select( STORE_NAME ).getServiceAccountSiteURL();
				expect( url ).toBeUndefined();
			} );

			it( 'should construct the correct `path` for the URL', () => {
				const correctPath = `${ settings.accountID }/home`;

				const resultingURL = registry.select( STORE_NAME ).getServiceAccountSiteURL();
				const { pathname } = new URL( resultingURL );

				expect( pathname.endsWith( correctPath ) ).toBe( true );
			} );

			it( 'should construct the correct query params for the URL', () => {
				const { host: referenceSiteURL } = new URL( siteInfo.referenceSiteURL );

				const resultingURL = registry.select( STORE_NAME ).getServiceAccountSiteURL();
				expect( resultingURL ).toMatchQueryParameters( {
					authuser: userData.email,
					source: 'site-kit',
					url: referenceSiteURL,
				} );
			} );

			it( 'should append `urlParams` arguments to the `query` if received', () => {
				const { host: referenceSiteURL } = new URL( siteInfo.referenceSiteURL );
				const urlParams = { foo: 'bar' };
				const url = registry.select( STORE_NAME ).getServiceAccountSiteURL( urlParams );

				expect( url ).toMatchQueryParameters( {
					authuser: userData.email,
					source: 'site-kit',
					url: referenceSiteURL,
					...urlParams,
				} );
			} );

			it( 'should give `urlParams` precedence over default query params with the same key', () => {
				const { host: referenceSiteURL } = new URL( siteInfo.referenceSiteURL );
				const urlParams = { source: 'new-source-param' };
				const url = registry.select( STORE_NAME ).getServiceAccountSiteURL( urlParams );

				expect( url ).toMatchQueryParameters( {
					// default query params
					authuser: userData.email,
					url: referenceSiteURL,
					// `source` key overriden
					source: 'new-source-param',
				} );
			} );
		} );
	} );
} );
