/**
 * CompatibilityChecks utils tests.
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
import { getErrorMessages, normalizeConflictingPlugins } from './utils';

describe( 'CompatibilityChecks utils', () => {
	describe( 'normalizeConflictingPlugins', () => {
		it( 'returns the same array when an array is provided', () => {
			const plugins = [
				{ pluginName: 'Plugin A', conflictMessage: null },
			];

			expect( normalizeConflictingPlugins( plugins ) ).toBe( plugins );
		} );

		it( 'converts an object map to an array of values', () => {
			const plugins = {
				'plugin-a/plugin.php': {
					pluginName: 'Plugin A',
					conflictMessage: null,
				},
				'plugin-b/plugin.php': {
					pluginName: 'Plugin B',
					conflictMessage: 'Custom message',
				},
			};

			expect( normalizeConflictingPlugins( plugins ) ).toEqual(
				Object.values( plugins )
			);
		} );

		it( 'returns an empty array when provided with invalid data', () => {
			expect( normalizeConflictingPlugins( null ) ).toEqual( [] );
			expect( normalizeConflictingPlugins( undefined ) ).toEqual( [] );
			expect( normalizeConflictingPlugins( 123 ) ).toEqual( [] );
		} );
	} );

	describe( 'getErrorMessages', () => {
		it( 'returns empty array when no errors provided', () => {
			expect( getErrorMessages( {} ) ).toEqual( [] );
			expect( getErrorMessages( undefined ) ).toEqual( [] );
		} );

		it( 'returns message for inaccessible login page', () => {
			expect(
				getErrorMessages( { wp_login_inaccessible: true } )
			).toContain(
				'Your login page (wp-login.php) is not accessible at the expected location. This can prevent Sign in with Google from functioning correctly.'
			);
		} );

		it( 'returns message for WordPress.com hosting', () => {
			expect(
				getErrorMessages( { host_wordpress_dot_com: true } )
			).toContain(
				'Sign in with Google does not function on sites hosted on WordPress.com.'
			);
		} );

		it( 'returns bespoke conflicting plugin message when provided', () => {
			const errors = {
				conflicting_plugins: [
					{
						pluginName: 'Plugin A',
						conflictMessage:
							'Plugin A requires additional configuration.',
					},
				],
			};

			expect( getErrorMessages( errors ) ).toContain(
				'Plugin A requires additional configuration.'
			);
		} );

		it( 'returns fallback conflicting plugin message when bespoke message is missing', () => {
			const errors = {
				conflicting_plugins: [
					{
						pluginName: 'Plugin B',
					},
				],
			};

			expect( getErrorMessages( errors ) ).toContain(
				'Plugin B can interfere with Sign in with Google. When this plugin is active, Sign in with Google may not function properly'
			);
		} );
	} );
} );
