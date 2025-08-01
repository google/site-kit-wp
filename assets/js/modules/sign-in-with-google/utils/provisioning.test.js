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
 * Internal dependencies
 */
import { sanitizeProvisioningParams } from './provisioning';

describe( 'modules/sign-in-with-google provisioning utilities', () => {
	describe( 'sanitizeProvisioningParams', () => {
		it.each( [
			[
				'missing appname',
				{
					appname: '',
					sitename: 'Test Site',
					siteorigin: 'https://example.com',
				},
			],
			[
				'missing sitename',
				{
					appname: 'Test App',
					sitename: '',
					siteorigin: 'https://example.com',
				},
			],
			[
				'missing siteorigin',
				{
					appname: 'Test App',
					sitename: 'Test Site',
					siteorigin: '',
				},
			],
		] )( 'should return params as-is when %s', ( _, params ) => {
			expect( sanitizeProvisioningParams( params ) ).toEqual( params );
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

		it.each( [
			[
				'invalid characters with hyphens',
				'Test@App!Site#Name',
				'Test-App-Site-Name',
			],
			[
				'consecutive spaces and hyphens',
				'Test   App---Site  Name',
				'Test App-Site Name',
			],
			[ 'valid appnames', 'Valid App Name', 'Valid App Name' ],
			[
				'mixed invalid characters',
				'App$Name%With&Symbols*',
				'App-Name-With-Symbols',
			],
		] )(
			'should sanitize %s correctly',
			( _, inputAppname, expectedAppname ) => {
				const params = {
					appname: inputAppname,
					sitename: 'Test Site',
					siteorigin: 'https://example.com',
				};

				const result = sanitizeProvisioningParams( params );

				expect( result.appname ).toBe( expectedAppname );
			}
		);

		it.each( [
			[ 'leading hyphens', '---Valid App Name', 'Valid App Name' ],
			[ 'trailing hyphens', 'Valid App Name---', 'Valid App Name' ],
			[
				'both leading and trailing hyphens',
				'--Valid App Name--',
				'Valid App Name',
			],
			[
				'only hyphens after invalid character replacement',
				'@@@Valid App Name@@@',
				'Valid App Name',
			],
			[
				'mixed case with hyphens',
				'-App-Name-With-Hyphens-',
				'App-Name-With-Hyphens',
			],
		] )(
			'should trim hyphens for %s',
			( _, inputAppname, expectedAppname ) => {
				const params = {
					appname: inputAppname,
					sitename: 'Test Site',
					siteorigin: 'https://example.com',
				};

				const result = sanitizeProvisioningParams( params );

				expect( result.appname ).toBe( expectedAppname );
			}
		);

		it.each( [
			[ 'short input', 'Hi!', 'https://example.com' ],
			[ 'URL with subdomain', 'x', 'https://sub.example.com:8080/path' ],
			[ 'only spaces and hyphens', '   ---   ', 'https://example.com' ],
			[ 'invalid URL', 'z', 'invalid-url' ],
		] )(
			'should generate fallback name for %s',
			( _, inputAppname, siteorigin ) => {
				const params = {
					appname: inputAppname,
					sitename: 'Test Site',
					siteorigin,
				};

				const result = sanitizeProvisioningParams( params );

				expect( result.appname ).toMatch(
					/^site-kit-siwg-[a-f0-9]{16}$/
				);
			}
		);

		it.each( [
			[
				'basic truncation',
				'This is a very long application name that exceeds thirty characters',
				'This is a very long applicatio',
				30,
			],
		] )(
			'should handle %s',
			( _, inputAppname, expectedAppname, expectedLength ) => {
				const params = {
					appname: inputAppname,
					sitename: 'Test Site',
					siteorigin: 'https://example.com',
				};

				const result = sanitizeProvisioningParams( params );

				expect( result.appname ).toBe( expectedAppname );
				expect( result.appname ).toHaveLength( expectedLength );
			}
		);

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
