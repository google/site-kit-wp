/**
 * Sign in with Google data requirements tests.
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
 * Internal dependencies
 */
import { Registry } from 'googlesitekit-data';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import { createTestRegistry } from '@tests/js/test-utils';
import { requireCompatibilityCheckErrors } from './index';

describe( 'sign-in-with-google data requirements', () => {
	let registry: Registry;

	beforeEach( () => {
		// The runtime registry has `resolveSelect`, which the
		// `@wordpress/data` registry type it is created from omits.
		registry = createTestRegistry() as Registry;
	} );

	describe( 'requireCompatibilityCheckErrors', () => {
		it( 'should return true when a compatibility check reported an error', async () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetCompatibilityChecks( {
					checks: { wp_login_inaccessible: true },
				} );

			expect( await requireCompatibilityCheckErrors()( registry ) ).toBe(
				true
			);
		} );

		it( 'should return false when no compatibility check reported an error', async () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetCompatibilityChecks( { checks: {} } );

			expect( await requireCompatibilityCheckErrors()( registry ) ).toBe(
				false
			);
		} );

		it( 'should return false when the checks are absent from the response', async () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetCompatibilityChecks( {} );

			expect( await requireCompatibilityCheckErrors()( registry ) ).toBe(
				false
			);
		} );
	} );
} );
