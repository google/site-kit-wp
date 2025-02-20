/**
 * AccountLinkedViaGoogleForWooCommerceSubtleNotification.test tests.
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
import { ADS_NOTIFICATIONS } from '../..';
import {
	createTestRegistry,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';

describe( 'AccountLinkedViaGoogleForWooCommerceSubtleNotification.test', () => {
	let registry;

	const notification =
		ADS_NOTIFICATIONS[ 'account-linked-via-google-for-woocommerce' ];

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
	} );

	describe( 'checkRequirements', () => {
		it( 'should return false if the WooCommerce or Google for WooCommerce plugins are not activated', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'should return true if the WooCommerce and Google for WooCommerce plugins are active and Ads account ins linked', async () => {
			provideSiteInfo( registry, {
				plugins: {
					wooCommerce: {
						active: true,
					},
					googleForWooCommerce: {
						active: true,
						adsConnected: true,
					},
				},
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );
	} );
} );
