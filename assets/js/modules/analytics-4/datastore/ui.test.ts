/**
 * `modules/analytics-4` data store: UI tests.
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
import { LATEST_CONTENT_TAB_ID } from '@/js/modules/analytics-4/components/module/ModulePopularPagesWidgetGA4/constants';
import { createTestRegistry } from '@tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'modules/analytics-4 ui', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'setActiveContentTab', () => {
			it( 'should require a non-empty string tab ID', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setActiveContentTab( '' )
				).toThrow( 'tabID must be a non-empty string.' );
			} );

			it( 'should store the tab ID', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setActiveContentTab( LATEST_CONTENT_TAB_ID );

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getActiveContentTab()
				).toBe( LATEST_CONTENT_TAB_ID );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getActiveContentTab', () => {
			it( 'should return `undefined` before a tab is selected', () => {
				expect(
					registry.select( MODULES_ANALYTICS_4 ).getActiveContentTab()
				).toBeUndefined();
			} );
		} );
	} );
} );
