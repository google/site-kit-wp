/**
 * Info datastore functions tests.
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
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { createTestRegistry } from '../../../../tests/js/utils';
import { createInfoStore } from './create-info-store';
import { CORE_SITE } from '../datastore/site/constants';
import { CORE_USER } from '../datastore/user/constants';

const MODULE_SLUG = 'test-slug';
const TEST_STORE_NAME = `test/${ MODULE_SLUG }`;

describe( 'createInfoStore store', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'storeName', () => {
		it( 'throws an error if storeName is not passed', () => {
			expect( () => {
				createInfoStore( MODULE_SLUG );
			} ).toThrow();
		} );

		it( 'returns the passed store name', () => {
			const { STORE_NAME } = createInfoStore( MODULE_SLUG, {
				storeName: 'test/createstore',
			} );

			expect( STORE_NAME ).toEqual( 'test/createstore' );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAdminScreenURL', () => {
			// Uses google dashboard when no `adminPage` is provided.
			it( 'returns the adminScreenURL page if no `adminPage` is provided', () => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					adminURL: 'http://example.com/wp-admin/',
				} );
				const { STORE_NAME, ...store } = createInfoStore( MODULE_SLUG, {
					storeName: TEST_STORE_NAME,
				} );
				registry.registerStore( STORE_NAME, store );

				const adminSreenURL = registry
					.select( STORE_NAME )
					.getAdminScreenURL();

				const { origin, pathname } = new URL( adminSreenURL );
				expect( origin + pathname ).toEqual(
					'http://example.com/wp-admin/admin.php'
				);
				expect( adminSreenURL ).toMatchQueryParameters( {
					page: 'googlesitekit-dashboard',
				} );
			} );

			// It adds extra query parameters if provided.
			it( 'adds extra query parameters to the adminScreenURL when provided', () => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					adminURL: 'http://example.com/wp-admin/',
				} );
				const { STORE_NAME, ...store } = createInfoStore( MODULE_SLUG, {
					storeName: TEST_STORE_NAME,
				} );
				registry.registerStore( STORE_NAME, store );

				const adminSreenURL = registry
					.select( STORE_NAME )
					.getAdminScreenURL( { foo: 'bar' } );

				const { origin, pathname } = new URL( adminSreenURL );
				expect( origin + pathname ).toEqual(
					'http://example.com/wp-admin/admin.php'
				);
				expect( adminSreenURL ).toMatchQueryParameters( {
					page: 'googlesitekit-dashboard',
					foo: 'bar',
				} );
			} );
		} );

		describe( 'getAdminReauthURL', () => {
			beforeEach( () => {
				registry
					.dispatch( CORE_USER )
					.receiveConnectURL( 'http://example.com/connect' );
			} );
			// It generates an adminReauthURL with no slug passed.
			it( 'works with no slug passed', () => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					adminURL: 'http://example.com/wp-admin/',
				} );
				registry.dispatch( CORE_USER ).receiveGetAuthentication( {
					needsReauthentication: false,
				} );
				const { STORE_NAME, ...store } = createInfoStore( MODULE_SLUG, {
					storeName: TEST_STORE_NAME,
				} );
				registry.registerStore( STORE_NAME, store );

				const adminReauthURL = registry
					.select( STORE_NAME )
					.getAdminReauthURL();

				const { origin, pathname } = new URL( adminReauthURL );
				expect( origin + pathname ).toEqual(
					'http://example.com/wp-admin/admin.php'
				);
				expect( adminReauthURL ).toMatchQueryParameters( {
					page: 'googlesitekit-dashboard',
					reAuth: 'true',
				} );
			} );

			// It generates an adminReauthURL with reAuth set to false
			it( 'it generates an adminReauthURL with reAuth set to false', () => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					adminURL: 'http://example.com/wp-admin/',
				} );
				registry.dispatch( CORE_USER ).receiveGetAuthentication( {
					needsReauthentication: false,
				} );
				const { STORE_NAME, ...store } = createInfoStore( MODULE_SLUG, {
					storeName: TEST_STORE_NAME,
				} );
				registry.registerStore( STORE_NAME, store );

				const adminReauthURL = registry
					.select( STORE_NAME )
					.getAdminReauthURL( false );

				const { origin, pathname } = new URL( adminReauthURL );
				expect( origin + pathname ).toEqual(
					'http://example.com/wp-admin/admin.php'
				);
				expect( adminReauthURL ).toMatchQueryParameters( {
					page: 'googlesitekit-dashboard',
					reAuth: 'false',
				} );
			} );

			// It adds notification_success parameter when needsReautentication is false and requireSetup is false.
			it( 'adds notification query parameter to the adminReauthURL when needsReautentication is false and requireSetup is false', () => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					adminURL: 'http://example.com/wp-admin/',
				} );
				registry.dispatch( CORE_USER ).receiveGetAuthentication( {
					needsReauthentication: false,
				} );
				const { STORE_NAME, ...store } = createInfoStore( MODULE_SLUG, {
					storeName: TEST_STORE_NAME,
					requiresSetup: false,
				} );
				registry.registerStore( STORE_NAME, store );

				const adminReauthURL = registry
					.select( STORE_NAME )
					.getAdminReauthURL();

				const { origin, pathname } = new URL( adminReauthURL );
				expect( origin + pathname ).toEqual(
					'http://example.com/wp-admin/admin.php'
				);
				expect( adminReauthURL ).toMatchQueryParameters( {
					page: 'googlesitekit-dashboard',
					slug: MODULE_SLUG,
					notification: 'authentication_success',
				} );
			} );

			it( 'should not add notification query parameter to the adminReauthURL when reAuth is false', () => {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					adminURL: 'http://example.com/wp-admin/',
				} );
				registry.dispatch( CORE_USER ).receiveGetAuthentication( {
					needsReauthentication: false,
				} );
				const { STORE_NAME, ...store } = createInfoStore( MODULE_SLUG, {
					storeName: TEST_STORE_NAME,
					requiresSetup: false,
				} );
				registry.registerStore( STORE_NAME, store );

				const adminReauthURL = registry
					.select( STORE_NAME )
					.getAdminReauthURL( false );

				const url = new URL( adminReauthURL );
				expect( url.origin + url.pathname ).toEqual(
					'http://example.com/wp-admin/admin.php'
				);
				expect( url.searchParams.has( 'notification' ) ).toBe( false );
				expect( adminReauthURL ).toMatchQueryParameters( {
					page: 'googlesitekit-dashboard',
					slug: MODULE_SLUG,
					reAuth: 'false',
				} );
			} );

			// Uses connect URL when needsReautentication is true.
			it( 'adds connectURL to the adminReauthURL when needsReautentication is true', () => {
				const connectURLBase = 'http://example.com/wp-admin/index.php';
				const connectURLQueryParams = {
					action: 'googlesitekit_connect',
					nonce: 'abc123',
				};
				const connectURL = addQueryArgs(
					connectURLBase,
					connectURLQueryParams
				);
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					adminURL: 'http://example.com/wp-admin/',
				} );
				registry.dispatch( CORE_USER ).receiveGetAuthentication( {
					needsReauthentication: true,
				} );
				registry.dispatch( CORE_USER ).receiveConnectURL( connectURL );

				const { STORE_NAME, ...store } = createInfoStore( MODULE_SLUG, {
					storeName: TEST_STORE_NAME,
				} );
				registry.registerStore( STORE_NAME, store );

				const adminReauthURL = registry
					.select( STORE_NAME )
					.getAdminReauthURL();

				const { origin, pathname } = new URL( adminReauthURL );
				expect( origin + pathname ).toEqual( connectURLBase );
				expect( adminReauthURL ).toMatchQueryParameters( {
					...connectURLQueryParams,
					redirect: `http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=${ MODULE_SLUG }&reAuth=true`,
					status: 'true',
				} );
			} );
		} );
	} );
} );
