/**
 * `core/site` data store tests.
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
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import { CORE_SITE } from './constants';
import { initialState } from './index';

describe( 'core/site store', () => {
	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_SITE ].store;
	} );

	describe( 'reducer', () => {
		it( 'has the appropriate initial state', () => {
			const state = store.getState();

			expect( state ).toEqual( initialState );
		} );
	} );

	describe( 'snapshot and restore', () => {
		it( 'does not overwrite siteInfo when restoring a snapshot', async () => {
			provideSiteInfo( registry, {
				setupErrorMessage: null,
				setupErrorCode: null,
			} );

			await registry.dispatch( CORE_SITE ).createSnapshot();

			// Simulate the page reload after OAuth error by providing
			// site info with an error message.
			provideSiteInfo( registry, {
				setupErrorMessage: 'An error occurred',
				setupErrorCode: 'access_denied',
			} );

			// Restore the snapshot (simulating what happens on page load).
			await registry.dispatch( CORE_SITE ).restoreSnapshot();

			// The setupErrorMessage should still be present because
			// the snapshot only includes conversionTracking, not siteInfo.
			expect( registry.select( CORE_SITE ).getSetupErrorMessage() ).toBe(
				'An error occurred'
			);
		} );
	} );
} );
