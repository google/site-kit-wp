/**
 * `core/site` data store, site info tests.
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
 * Internal dependencies
 */
import { createTestRegistry, unsubscribeFromAll } from '../../../../../tests/js/utils';
import { STORE_NAME } from './constants';

describe( 'core/site site info', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getGoogleLocaleAwareURL', () => {
			it( 'should return the correct URL', () => {
				const url = registry.select( STORE_NAME ).getGoogleLocaleAwareURL( {
					website: 'https://myaccount.google.com/',
					path: '/test-page',
					hash: 'test-hash',
					locale: 'pt-BR',
				} );

				expect( url ).toBe( 'https://myaccount.google.com/test-page?hl=pt-BR#test-hash' );
			} );

			it( 'should return NULL if the path is omitted', () => {
				const url = registry.select( STORE_NAME ).getGoogleLocaleAwareURL( {
					website: 'https://myaccount.google.com/',
					hash: 'test-hash',
					locale: 'pt-BR',
				} );

				expect( url ).toBeNull();
			} );
		} );

		describe( 'getGooglePrivacyPolicyURL', () => {
			it( 'should return the correct privacy policy URL', () => {
				const url = registry.select( STORE_NAME ).getGooglePrivacyPolicyURL();
				expect( url ).toBe( 'https://myaccount.google.com/privacypolicy?hl=en-US' );
			} );
		} );

		describe( 'getGoogleTermsURL', () => {
			it( 'should return the correct terms URL', () => {
				const url = registry.select( STORE_NAME ).getGoogleTermsURL();
				expect( url ).toBe( 'https://policies.google.com/terms?hl=en-US' );
			} );
		} );

		describe( 'getGoogleSupportURL', () => {
			it.each( [
				[
					'null if no arguments are supplied',
					undefined,
					null,
				],
				[
					'null if no path is supplied or is empty',
					{
						path: '',
					},
					null,
				],
				[
					'the path, hash and the user locale',
					{
						path: '/analytics/answer/1032415',
						hash: 'hash_value',
					},
					'https://support.google.com/analytics/answer/1032415?hl=en-US#hash_value',
				],
				[
					'the path, query and the user locale',
					{
						path: '/analytics/answer/1032415',
						query: {
							param: 'value',
							param2: 'value2',
						},
					},
					'https://support.google.com/analytics/answer/1032415?param=value&param2=value2&hl=en-US',
				],
				[
					'the path with the user locale',
					{
						path: '/analytics/answer/1032415',
					},
					'https://support.google.com/analytics/answer/1032415?hl=en-US',
				],
				[
					'the path, query, hash and the user locale',
					{
						path: '/analytics/answer/1032415',
						query: {
							param: 'value',
							param2: 'value2',
						},
						hash: 'hash_value',
					},
					'https://support.google.com/analytics/answer/1032415?param=value&param2=value2&hl=en-US#hash_value',
				],
			] )( 'should return %s', ( _, args, expected ) => {
				const url = registry.select( STORE_NAME ).getGoogleSupportURL( args );
				expect( url ).toBe( expected );
			} );

			it( 'should return the path with a predefined locale', () => {
				if ( ! global._googlesitekitLegacyData ) {
					global._googlesitekitLegacyData = {};
				}

				global._googlesitekitLegacyData.locale = 'de';

				const url = registry.select( STORE_NAME ).getGoogleSupportURL( { path: '/analytics/answer/1032415' } );
				expect( url ).toBe( 'https://support.google.com/analytics/answer/1032415?hl=de' );
			} );

			it( 'should return the path with a "complex" locale', () => {
				if ( ! global._googlesitekitLegacyData ) {
					global._googlesitekitLegacyData = {};
				}

				global._googlesitekitLegacyData.locale = 'zh_tw';

				const url = registry.select( STORE_NAME ).getGoogleSupportURL( { path: '/analytics/answer/1032415' } );
				expect( url ).toBe( 'https://support.google.com/analytics/answer/1032415?hl=zh-tw' );
			} );

			it( 'should return locale sections after the first two sections', () => {
				if ( ! global._googlesitekitLegacyData ) {
					global._googlesitekitLegacyData = {};
				}

				global._googlesitekitLegacyData.locale = 'zh_tw-abc	';

				const url = registry.select( STORE_NAME ).getGoogleSupportURL( { path: '/analytics/answer/1032415' } );
				expect( url ).toBe( 'https://support.google.com/analytics/answer/1032415?hl=zh-tw' );
			} );
		} );
	} );
} );
