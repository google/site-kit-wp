/**
 * `core/site` data store, urls tests.
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
import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site urls', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'selectors', () => {
		describe( 'getGoogleLocaleAwareURL', () => {
			it( 'should return the correct URL', () => {
				const url = registry
					.select( CORE_SITE )
					.getGoogleLocaleAwareURL( {
						website: 'https://myaccount.google.com/',
						path: '/test-page',
						hash: 'test-hash',
						locale: 'pt-BR',
					} );

				expect( url ).toBe(
					'https://myaccount.google.com/test-page?hl=pt-BR#test-hash'
				);
			} );

			it( 'should return NULL if the path is omitted', () => {
				const url = registry
					.select( CORE_SITE )
					.getGoogleLocaleAwareURL( {
						website: 'https://myaccount.google.com/',
						hash: 'test-hash',
						locale: 'pt-BR',
					} );

				expect( url ).toBeNull();
			} );
		} );

		describe( 'getGooglePrivacyPolicyURL', () => {
			it( 'should return the correct privacy policy URL', () => {
				const url = registry
					.select( CORE_SITE )
					.getGooglePrivacyPolicyURL();
				expect( url ).toBe(
					'https://myaccount.google.com/privacypolicy?hl=en-US'
				);
			} );
		} );

		describe( 'getDocumentationLinkURL', () => {
			it( 'should throw an error if the slug is omitted', () => {
				expect( () =>
					registry.select( CORE_SITE ).getDocumentationLinkURL()
				).toThrow( 'A slug is required.' );
			} );

			it( 'should return the correct documentation URL given a documentation slug', () => {
				const testSlug = 'test-slug';

				const baseURL = registry
					.select( CORE_SITE )
					.getProxySupportLinkURL();

				const url = registry
					.select( CORE_SITE )
					.getDocumentationLinkURL( testSlug );

				expect( url ).toBe( `${ baseURL }?doc=${ testSlug }` );
			} );

			it( 'should return the correct documentation URL given a documentation slug and hashProperty', () => {
				const testSlug = 'test-slug';
				const testHashProperty = 'test-hash-property';

				const baseURL = registry
					.select( CORE_SITE )
					.getProxySupportLinkURL();

				const url = registry
					.select( CORE_SITE )
					.getDocumentationLinkURL( testSlug, testHashProperty );

				expect( url ).toBe(
					`${ baseURL }?doc=${ testSlug }#${ testHashProperty }`
				);
			} );
		} );

		describe( 'getErrorTroubleshootingLinkURL', () => {
			const testError = {
				data: {
					reason: 'Data Error',
				},
				selectorData: {
					args: [
						{
							dimensions: [
								{
									name: 'date',
								},
							],
							metrics: [
								{
									name: 'totalUsers',
								},
							],
							startDate: '2020-12-31',
							endDate: '2021-01-27',
						},
					],
					name: 'getReport',
					storeName: 'MODULES_ANALYTICS_4',
				},
			};

			const testErrorWithMessage = {
				...testError,
				message: 'Test error message',
			};
			const testErrorWithCode = { ...testError, code: 'test-error-code' };
			const testErrorWithID = { ...testError, id: 'test-error-id' };

			it( 'should throw an error if no error is given', () => {
				expect( () =>
					registry
						.select( CORE_SITE )
						.getErrorTroubleshootingLinkURL()
				).toThrow( 'An error is required.' );
			} );

			it( 'should return the support link with the error message if no code or id is given', () => {
				const baseURL = registry
					.select( CORE_SITE )
					.getProxySupportLinkURL();

				const url = registry
					.select( CORE_SITE )
					.getErrorTroubleshootingLinkURL( testErrorWithMessage );

				expect( url ).toBe(
					`${ baseURL }?error=${ encodeURIComponent(
						testErrorWithMessage.message
					) }`
				);
			} );

			it( 'should return the support link with the error code if the error code is given', () => {
				const baseURL = registry
					.select( CORE_SITE )
					.getProxySupportLinkURL();

				const url = registry
					.select( CORE_SITE )
					.getErrorTroubleshootingLinkURL( testErrorWithCode );

				expect( url ).toBe(
					`${ baseURL }?error_id=${ encodeURIComponent(
						testErrorWithCode.code
					) }`
				);
			} );

			it( 'should return the support link with the error id if the error id is given', () => {
				const baseURL = registry
					.select( CORE_SITE )
					.getProxySupportLinkURL();

				const url = registry
					.select( CORE_SITE )
					.getErrorTroubleshootingLinkURL( testErrorWithID );

				expect( url ).toBe(
					`${ baseURL }?error_id=${ encodeURIComponent(
						testErrorWithID.id
					) }`
				);
			} );

			it( 'it should default to the error message if the error code is a numeric value', () => {
				const testErrorWithNumericCode = {
					...testErrorWithMessage,
					code: 123,
				};

				const baseURL = registry
					.select( CORE_SITE )
					.getProxySupportLinkURL();

				const url = registry
					.select( CORE_SITE )
					.getErrorTroubleshootingLinkURL( testErrorWithNumericCode );

				expect( url ).toBe(
					`${ baseURL }?error=${ encodeURIComponent(
						testErrorWithNumericCode.message
					) }`
				);
			} );

			it( 'it should default to the error message if the error code is empty', () => {
				const testErrorWithNumericCode = {
					...testErrorWithMessage,
					code: '',
				};

				const baseURL = registry
					.select( CORE_SITE )
					.getProxySupportLinkURL();

				const url = registry
					.select( CORE_SITE )
					.getErrorTroubleshootingLinkURL( testErrorWithNumericCode );

				expect( url ).toBe(
					`${ baseURL }?error=${ encodeURIComponent(
						testErrorWithNumericCode.message
					) }`
				);
			} );

			it( 'it should default to the error message if the error id is a numeric value', () => {
				const testErrorWithNumericID = {
					...testErrorWithMessage,
					id: 123,
				};

				const baseURL = registry
					.select( CORE_SITE )
					.getProxySupportLinkURL();

				const url = registry
					.select( CORE_SITE )
					.getErrorTroubleshootingLinkURL( testErrorWithNumericID );

				expect( url ).toBe(
					`${ baseURL }?error=${ encodeURIComponent(
						testErrorWithNumericID.message
					) }`
				);
			} );

			it( 'it should default to the error message if the error id is a string containing a numeric value', () => {
				const testErrorWithNumericID = {
					...testErrorWithMessage,
					id: '123',
				};

				const baseURL = registry
					.select( CORE_SITE )
					.getProxySupportLinkURL();

				const url = registry
					.select( CORE_SITE )
					.getErrorTroubleshootingLinkURL( testErrorWithNumericID );

				expect( url ).toBe(
					`${ baseURL }?error=${ encodeURIComponent(
						testErrorWithNumericID.message
					) }`
				);
			} );

			it( 'it should default to the error message if the error code is a string containing a numeric value', () => {
				const testErrorWithNumericCode = {
					...testErrorWithMessage,
					code: '123',
				};

				const baseURL = registry
					.select( CORE_SITE )
					.getProxySupportLinkURL();

				const url = registry
					.select( CORE_SITE )
					.getErrorTroubleshootingLinkURL( testErrorWithNumericCode );

				expect( url ).toBe(
					`${ baseURL }?error=${ encodeURIComponent(
						testErrorWithNumericCode.message
					) }`
				);
			} );
		} );

		describe( 'getGoogleTermsURL', () => {
			it( 'should return the correct terms URL', () => {
				const url = registry.select( CORE_SITE ).getGoogleTermsURL();
				expect( url ).toBe(
					'https://policies.google.com/terms?hl=en-US'
				);
			} );
		} );

		describe( 'getGoogleSupportURL', () => {
			it.each( [
				[ 'null if no arguments are supplied', undefined, null ],
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
				const url = registry
					.select( CORE_SITE )
					.getGoogleSupportURL( args );
				expect( url ).toBe( expected );
			} );

			it( 'should return the path with a predefined locale', () => {
				if ( ! global._googlesitekitLegacyData ) {
					global._googlesitekitLegacyData = {};
				}

				global._googlesitekitLegacyData.locale = 'de';

				const url = registry.select( CORE_SITE ).getGoogleSupportURL( {
					path: '/analytics/answer/1032415',
				} );
				expect( url ).toBe(
					'https://support.google.com/analytics/answer/1032415?hl=de'
				);
			} );

			it( 'should return the path with a "complex" locale', () => {
				if ( ! global._googlesitekitLegacyData ) {
					global._googlesitekitLegacyData = {};
				}

				global._googlesitekitLegacyData.locale = 'zh_tw';

				const url = registry.select( CORE_SITE ).getGoogleSupportURL( {
					path: '/analytics/answer/1032415',
				} );
				expect( url ).toBe(
					'https://support.google.com/analytics/answer/1032415?hl=zh-tw'
				);
			} );

			it( 'should return locale sections after the first two sections', () => {
				if ( ! global._googlesitekitLegacyData ) {
					global._googlesitekitLegacyData = {};
				}

				global._googlesitekitLegacyData.locale = 'zh_tw-abc	';

				const url = registry.select( CORE_SITE ).getGoogleSupportURL( {
					path: '/analytics/answer/1032415',
				} );
				expect( url ).toBe(
					'https://support.google.com/analytics/answer/1032415?hl=zh-tw'
				);
			} );
		} );
	} );
} );
