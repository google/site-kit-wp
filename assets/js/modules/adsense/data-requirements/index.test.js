/**
 * AdSense data requirements tests.
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
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '@/js/modules/adsense/datastore/constants';
import { createTestRegistry } from '@tests/js/test-utils';
import { requireAdBlockingRecoverySetupStatus } from './index';

describe( 'adsense data requirements', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'requireAdBlockingRecoverySetupStatus', () => {
		it( 'should return true when the setup status matches', async () => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				adBlockingRecoverySetupStatus:
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED,
			} );

			expect(
				await requireAdBlockingRecoverySetupStatus(
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
				)( registry )
			).toBe( true );
		} );

		it( 'should return false when the setup status does not match', async () => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				adBlockingRecoverySetupStatus:
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
			} );

			expect(
				await requireAdBlockingRecoverySetupStatus(
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
				)( registry )
			).toBe( false );
		} );

		it( 'should return false when the setup status is not available', async () => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );

			expect(
				await requireAdBlockingRecoverySetupStatus(
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
				)( registry )
			).toBe( false );
		} );
	} );
} );
