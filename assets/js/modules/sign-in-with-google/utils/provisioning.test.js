/**
 * Sign in with Google provisioning utility tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * External dependencies
 */
import md5 from 'md5';

/**
 * Internal dependencies
 */
import { sanitizeProvisioningParams } from './provisioning';

describe( 'sanitizeProvisioningParams', () => {
	const validParams = {
		appname: 'Test App',
		sitename: 'Test Site',
		siteorigin: 'https://example.com',
	};

	describe( 'missing or empty required parameters', () => {
		it.each( [
			[
				'appname',
				{
					sitename: 'Test Site',
					siteorigin: 'https://example.com',
				},
			],
			[
				'sitename',
				{
					appname: 'Test App',
					siteorigin: 'https://example.com',
				},
			],
			[
				'siteorigin',
				{
					appname: 'Test App',
					sitename: 'Test Site',
				},
			],
		] )( 'returns params as-is when %s is missing', ( _, params ) => {
			expect( sanitizeProvisioningParams( params ) ).toEqual( params );
		} );

		it.each( [
			[
				'appname',
				{
					appname: '',
					sitename: 'Test Site',
					siteorigin: 'https://example.com',
				},
			],
			[
				'sitename',
				{
					appname: 'Test App',
					sitename: '',
					siteorigin: 'https://example.com',
				},
			],
			[
				'siteorigin',
				{ appname: 'Test App', sitename: 'Test Site', siteorigin: '' },
			],
		] )( 'returns params as-is when %s is empty', ( _, params ) => {
			expect( sanitizeProvisioningParams( params ) ).toEqual( params );
		} );
	} );

	describe( 'sitename sanitization', () => {
		it( 'strips leading numbers from sitename', () => {
			const params = {
				...validParams,
				sitename: '123Test Site',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.sitename ).toBe( 'Test Site' );
		} );

		it( 'handles sitename that is only numbers', () => {
			const params = {
				...validParams,
				sitename: '12345',
				siteorigin: 'https://example.com',
			};

			const result = sanitizeProvisioningParams( params );
			// Should trigger MD5 fallback since all numbers are stripped
			const fullFallback = `site-kit-siwg-${ md5( 'example.com' ) }`;
			const expectedResult = fullFallback.substring( 0, 30 );

			expect( result.sitename ).toBe( expectedResult );
		} );

		it.each( [
			[
				'replaces non-alphanumeric characters (except hyphens) with spaces',
				'Test@Site#123!',
				'Test Site 123',
			],
			[
				'preserves hyphens in sitename',
				'Test-Site-Name',
				'Test-Site-Name',
			],
			[
				'handles combination of hyphens and other special characters',
				'Test-Site@Name#123!',
				'Test-Site Name 123',
			],
			[
				'normalizes multiple whitespace characters to single spaces',
				'Test\t\tSite\n\nName   With  Spaces',
				'Test Site Name With Spaces',
			],
			[
				'trims whitespace from beginning and end',
				'   Test Site Name   ',
				'Test Site Name',
			],
			[
				'handles combination of special characters and whitespace',
				'  @#$ Test-Site_Name!!! \t\n  ',
				'Test-Site Name',
			],
		] )( '%s', ( _, inputSitename, expectedSitename ) => {
			const params = {
				...validParams,
				sitename: inputSitename,
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.sitename ).toBe( expectedSitename );
		} );
	} );

	describe( 'short sitename fallback', () => {
		it.each( [
			[
				'generates MD5-based fallback when sanitized sitename is less than 4 characters',
				'@#$',
				'https://example.com',
				'example.com',
			],
			[
				'generates MD5-based fallback when sitename becomes empty after sanitization',
				'!@#$%^&*()',
				'https://test.example.com',
				'test.example.com',
			],
			[
				'uses siteorigin for MD5 when URL parsing fails',
				'!!',
				'invalid-url',
				'invalid-url',
			],
		] )( '%s', ( _, inputSitename, siteorigin, expectedHashInput ) => {
			const params = {
				...validParams,
				sitename: inputSitename,
				siteorigin,
			};

			const result = sanitizeProvisioningParams( params );
			// The full fallback gets truncated to 30 characters
			const fullFallback = `site-kit-siwg-${ md5( expectedHashInput ) }`;
			const expectedResult = fullFallback.substring( 0, 30 );

			expect( result.sitename ).toBe( expectedResult );
		} );

		it( 'does not apply fallback when sanitized sitename is exactly 4 characters', () => {
			const params = {
				...validParams,
				sitename: 'Test',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.sitename ).toBe( 'Test' );
		} );
	} );

	describe( 'sitename truncation', () => {
		it( 'truncates sitename to 30 characters', () => {
			const longSitename =
				'This is a very long site name that exceeds thirty characters';
			const params = {
				...validParams,
				sitename: longSitename,
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.sitename ).toBe( 'This is a very long site name' );
			expect( result.sitename.length ).toBe( 29 );
		} );

		it( 'trims trailing spaces after truncation', () => {
			const params = {
				...validParams,
				sitename:
					'This is a very long site name that has spaces at truncation point',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.sitename ).toBe( 'This is a very long site name' );
			expect( result.sitename.endsWith( ' ' ) ).toBe( false );
		} );

		it( 'does not truncate sitenames shorter than or equal to 30 characters', () => {
			const params = {
				...validParams,
				sitename: 'Exactly thirty characters!!',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.sitename ).toBe( 'Exactly thirty characters' );
			expect( result.sitename.length ).toBe( 25 );
		} );
	} );

	describe( 'parameter immutability', () => {
		it( 'does not mutate the original params object', () => {
			const originalParams = {
				appname: 'Test App',
				sitename: 'Test@Site#Name!',
				siteorigin: 'https://example.com',
				extraParam: 'should remain',
			};
			const paramsCopy = { ...originalParams };

			sanitizeProvisioningParams( originalParams );

			expect( originalParams ).toEqual( paramsCopy );
		} );

		it( 'preserves extra parameters in the returned object', () => {
			const params = {
				...validParams,
				extraParam: 'should be preserved',
				anotherParam: 123,
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.extraParam ).toBe( 'should be preserved' );
			expect( result.anotherParam ).toBe( 123 );
		} );
	} );

	describe( 'edge cases', () => {
		it( 'handles sitename with only spaces', () => {
			const params = {
				...validParams,
				sitename: '   ',
				siteorigin: 'https://example.com',
			};

			const result = sanitizeProvisioningParams( params );
			// The full fallback gets truncated to 30 characters
			const fullFallback = `site-kit-siwg-${ md5( 'example.com' ) }`;
			const expectedResult = fullFallback.substring( 0, 30 );

			expect( result.sitename ).toBe( expectedResult );
		} );

		it( 'handles complex URL parsing scenarios', () => {
			const params = {
				...validParams,
				sitename: '!!',
				siteorigin:
					'https://subdomain.example.com:8080/path?query=value',
			};

			const result = sanitizeProvisioningParams( params );
			// The full fallback gets truncated to 30 characters
			const fullFallback = `site-kit-siwg-${ md5(
				'subdomain.example.com'
			) }`;
			const expectedResult = fullFallback.substring( 0, 30 );

			expect( result.sitename ).toBe( expectedResult );
		} );

		it( 'handles Unicode characters in sitename', () => {
			const params = {
				...validParams,
				sitename: 'Tëst Ñámé 测试',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.sitename ).toBe( 'T st m' );
		} );

		it( 'handles fallback generation when sitename contains only 3 valid characters', () => {
			const params = {
				...validParams,
				sitename: 'a!b@c#',
				siteorigin: 'https://example.com',
			};

			const result = sanitizeProvisioningParams( params );
			const expectedHash = md5( 'example.com' ).substring( 0, 16 );

			expect( result.sitename ).toBe( `site-kit-siwg-${ expectedHash }` );
		} );
	} );
} );
