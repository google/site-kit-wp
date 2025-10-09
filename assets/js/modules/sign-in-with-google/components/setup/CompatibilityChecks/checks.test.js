/**
 * Sign in with Google compatibility checks tests.
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
import { createTestRegistry } from '../../../../../../../tests/js/utils';
import { ERROR_WP_LOGIN_INACCESSIBLE } from '@/js/modules/sign-in-with-google/components/setup/CompatibilityChecks/CompatibilityErrorNotice';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import { runChecks } from './checks';

describe( 'Sign in with Google runChecks', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'does not throw when compatibility checks are clear', async () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetCompatibilityChecks( {
				checks: {},
				timestamp: Date.now(),
			} );

		await expect( runChecks( registry )() ).resolves.toBeUndefined();
	} );

	it( 'throws compatibility data when checks contain issues', async () => {
		const compatibilityError = {
			[ ERROR_WP_LOGIN_INACCESSIBLE ]: true,
		};

		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetCompatibilityChecks( {
				checks: compatibilityError,
				timestamp: Date.now(),
			} );

		await expect( runChecks( registry )() ).rejects.toEqual(
			compatibilityError
		);
	} );
} );
