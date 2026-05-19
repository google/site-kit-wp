/**
 * `core/site` data store, golinks tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideSiteInfo,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site golinks', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry, {
			adminURL: 'http://example.com/wp-admin/',
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getGoLinkURL', () => {
			it( 'returns the expected URL shape for the `dashboard` key with no extra args', () => {
				const url = registry
					.select( CORE_SITE )
					.getGoLinkURL( 'dashboard' );

				expect( url ).toBe(
					'http://example.com/wp-admin/index.php?action=googlesitekit_go&to=dashboard'
				);
			} );

			it( 'appends a `permaLink` arg with URL-encoded value for entity-dashboard links', () => {
				const url = registry
					.select( CORE_SITE )
					.getGoLinkURL( 'dashboard', {
						permaLink: 'https://example.com/page',
					} );

				expect( url ).toBe(
					'http://example.com/wp-admin/index.php?action=googlesitekit_go&to=dashboard&permaLink=https%3A%2F%2Fexample.com%2Fpage'
				);
			} );

			it( 'appends arbitrary extra query args alongside `action` and `to`', () => {
				const url = registry
					.select( CORE_SITE )
					.getGoLinkURL( 'dashboard', {
						foo: 'bar',
						baz: 42,
					} );

				expect( url ).toBe(
					'http://example.com/wp-admin/index.php?action=googlesitekit_go&to=dashboard&foo=bar&baz=42'
				);
			} );

			it( 'still produces a URL for keys not registered server-side', () => {
				const url = registry
					.select( CORE_SITE )
					.getGoLinkURL( 'no-such-handler' );

				expect( url ).toBe(
					'http://example.com/wp-admin/index.php?action=googlesitekit_go&to=no-such-handler'
				);
			} );

			it( 'normalizes an admin URL without a trailing slash', () => {
				registry = createTestRegistry();
				provideSiteInfo( registry, {
					adminURL: 'http://example.com/wp-admin',
				} );

				const url = registry
					.select( CORE_SITE )
					.getGoLinkURL( 'dashboard' );

				expect( url ).toBe(
					'http://example.com/wp-admin/index.php?action=googlesitekit_go&to=dashboard'
				);
			} );

			it( 'returns undefined when site info has not loaded', () => {
				registry = createTestRegistry();

				expect(
					registry.select( CORE_SITE ).getGoLinkURL( 'dashboard' )
				).toBeUndefined();
			} );
		} );
	} );
} );
