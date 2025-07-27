/**
 * Provisioning utility tests.
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
 * Internal dependencies
 */
import { sanitizeProvisioningParams } from './provisioning';

describe( 'modules/sign-in-with-google provisioning utilities', () => {
	describe( 'sanitizeProvisioningParams', () => {
		it( 'should return params as-is when required parameters are missing', () => {
			const params = {
				appname: '',
				sitename: 'Test Site',
				siteorigin: 'https://example.com',
			};
			expect( sanitizeProvisioningParams( params ) ).toEqual( params );

			const params2 = {
				appname: 'Test App',
				sitename: '',
				siteorigin: 'https://example.com',
			};
			expect( sanitizeProvisioningParams( params2 ) ).toEqual( params2 );

			const params3 = {
				appname: 'Test App',
				sitename: 'Test Site',
				siteorigin: '',
			};
			expect( sanitizeProvisioningParams( params3 ) ).toEqual( params3 );
		} );

		it( 'should not mutate the original params object', () => {
			const originalParams = {
				appname: 'Test@App!',
				sitename: 'Test Site',
				siteorigin: 'https://example.com',
			};
			const originalCopy = { ...originalParams };

			sanitizeProvisioningParams( originalParams );

			expect( originalParams ).toEqual( originalCopy );
		} );

		it( 'should replace invalid characters with hyphens', () => {
			const params = {
				appname: 'Test@App!Site#Name',
				sitename: 'Test Site',
				siteorigin: 'https://example.com',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.appname ).toBe( 'Test-App-Site-Name' );
		} );

		it( 'should reduce consecutive spaces and hyphens to single characters', () => {
			const params = {
				appname: 'Test   App---Site  Name',
				sitename: 'Test Site',
				siteorigin: 'https://example.com',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.appname ).toBe( 'Test App-Site Name' );
		} );

		it( 'should generate fallback name when result is less than 4 characters', () => {
			const params = {
				appname: 'Hi!',
				sitename: 'Test Site',
				siteorigin: 'https://example.com',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.appname ).toMatch( /^site-kit-siwg-[a-f0-9]{16}$/ );
		} );

		it( 'should use hostname for MD5 when generating fallback', () => {
			const params = {
				appname: 'Hi!',
				sitename: 'Test Site',
				siteorigin: 'https://sub.example.com:8080/path',
			};

			const result = sanitizeProvisioningParams( params );

			// The MD5 should be generated from 'sub.example.com'
			expect( result.appname ).toMatch( /^site-kit-siwg-[a-f0-9]{16}$/ );
		} );

		it( 'should use full siteorigin for MD5 when URL parsing fails', () => {
			const params = {
				appname: 'Hi!',
				sitename: 'Test Site',
				siteorigin: 'invalid-url',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.appname ).toMatch( /^site-kit-siwg-[a-f0-9]{16}$/ );
		} );

		it( 'should truncate appname to 30 characters maximum', () => {
			const params = {
				appname:
					'This is a very long application name that exceeds thirty characters',
				sitename: 'Test Site',
				siteorigin: 'https://example.com',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.appname ).toHaveLength( 30 );
			expect( result.appname ).toBe( 'This is a very long applicatio' );
		} );

		it( 'should remove trailing hyphen after truncation', () => {
			const params = {
				appname:
					'This is a very long app name-with trailing hyphen that needs truncation',
				sitename: 'Test Site',
				siteorigin: 'https://example.com',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.appname.length ).toBeLessThanOrEqual( 30 );
			expect( result.appname.endsWith( '-' ) ).toBe( false );
		} );

		it( 'should preserve valid appnames between 4-30 characters', () => {
			const params = {
				appname: 'Valid App Name',
				sitename: 'Test Site',
				siteorigin: 'https://example.com',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.appname ).toBe( 'Valid App Name' );
		} );

		it( 'should handle appnames with only spaces and hyphens', () => {
			const params = {
				appname: '   ---   ',
				sitename: 'Test Site',
				siteorigin: 'https://example.com',
			};

			const result = sanitizeProvisioningParams( params );

			// Should be reduced to a single space/hyphen, then fall back to MD5
			expect( result.appname ).toMatch( /^site-kit-siwg-[a-f0-9]{16}$/ );
		} );

		it( 'should preserve other params unchanged', () => {
			const params = {
				appname: 'Test App',
				sitename: 'Test Site',
				siteorigin: 'https://example.com',
				extraParam: 'should be preserved',
			};

			const result = sanitizeProvisioningParams( params );

			expect( result.sitename ).toBe( 'Test Site' );
			expect( result.siteorigin ).toBe( 'https://example.com' );
			expect( result.extraParam ).toBe( 'should be preserved' );
		} );
	} );
} );
