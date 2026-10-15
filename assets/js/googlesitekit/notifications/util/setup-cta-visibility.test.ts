/**
 * Setup CTA visibility helper tests.
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
import { Select } from 'googlesitekit-data';
import {
	CORE_USER,
	INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
} from '@/js/googlesitekit/datastore/user/constants';
import { createTestRegistry } from '@tests/js/utils';
import {
	areSetupCTAsMuted,
	requireSetupCTAsNotMuted,
} from './setup-cta-visibility';

describe( 'areSetupCTAsMuted', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'returns false when the initial setup notification timeout is not dismissed', () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		expect( areSetupCTAsMuted( registry.select as Select ) ).toBe( false );
	} );

	it( 'returns true when the initial setup notification timeout is dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
			] );

		expect( areSetupCTAsMuted( registry.select as Select ) ).toBe( true );
	} );
} );

describe( 'requireSetupCTAsNotMuted', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	function callRequirement() {
		return requireSetupCTAsNotMuted()( registry as never );
	}

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'resolves true when the setup CTAs are not muted', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		await expect( callRequirement() ).resolves.toBe( true );
	} );

	it( 'resolves false when the initial setup notification timeout is dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
			] );

		await expect( callRequirement() ).resolves.toBe( false );
	} );

	it( 'waits for the dismissed items to arrive before deciding', async () => {
		fetchMock.get(
			new RegExp( '^/google-site-kit/v1/core/user/data/dismissed-items' ),
			() =>
				new Promise( ( resolve ) =>
					setTimeout(
						() =>
							resolve( {
								body: [
									INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
								],
								status: 200,
							} ),
						50
					)
				)
		);

		expect( areSetupCTAsMuted( registry.select as Select ) ).toBe( false );

		await expect( callRequirement() ).resolves.toBe( false );
	} );
} );
