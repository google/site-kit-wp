/**
 * `modules/pagespeed-insights` data store: active tab tests.
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
import { createTestRegistry } from '@tests/js/utils';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_DESKTOP,
	STRATEGY_MOBILE,
} from './constants';

describe( 'modules/pagespeed-insights active-tab store', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'setActiveTab', () => {
			it( 'should set the active tab to desktop', () => {
				registry
					.dispatch( MODULES_PAGESPEED_INSIGHTS )
					.setActiveTab( STRATEGY_DESKTOP );

				expect(
					registry.select( MODULES_PAGESPEED_INSIGHTS ).getActiveTab()
				).toBe( STRATEGY_DESKTOP );
			} );

			it( 'should set the active tab to mobile', () => {
				registry
					.dispatch( MODULES_PAGESPEED_INSIGHTS )
					.setActiveTab( STRATEGY_DESKTOP );
				registry
					.dispatch( MODULES_PAGESPEED_INSIGHTS )
					.setActiveTab( STRATEGY_MOBILE );

				expect(
					registry.select( MODULES_PAGESPEED_INSIGHTS ).getActiveTab()
				).toBe( STRATEGY_MOBILE );
			} );

			it( 'should throw an error if the given tab is not mobile or desktop', () => {
				expect( () => {
					registry
						.dispatch( MODULES_PAGESPEED_INSIGHTS )
						.setActiveTab( 'tablet' );
				} ).toThrow( 'activeTab must be one of: mobile, desktop.' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getActiveTab', () => {
			it( 'should default to mobile', () => {
				expect(
					registry.select( MODULES_PAGESPEED_INSIGHTS ).getActiveTab()
				).toBe( STRATEGY_MOBILE );
			} );
		} );
	} );
} );
