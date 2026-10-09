/**
 * Feature Discovery API tests.
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
import { enabledFeatures } from '@/js/features';
import { getFeatureIncompleteSetupReminderKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	freezeFetch,
	untilResolved,
} from '@tests/js/utils';
import { createFeatureDiscovery } from './index';

describe( 'createFeatureDiscovery', () => {
	const dismissedItemsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-items'
	);

	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		enabledFeatures.add( 'featureDiscoveryHub' );
	} );

	afterEach( () => {
		enabledFeatures.delete( 'featureDiscoveryHub' );
	} );

	describe( 'resetIncompleteSetupReminder', () => {
		it( 'removes only the matching reminder dismissal', async () => {
			const key = getFeatureIncompleteSetupReminderKey( 'newsletter' );
			const otherKey = getFeatureIncompleteSetupReminderKey( 'adsense' );

			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [ key, otherKey ] );

			fetchMock.postOnce(
				dismissedItemsEndpoint,
				{
					body: [ otherKey ],
				},
				{
					headers: {
						'X-HTTP-Method-Override': 'DELETE',
					},
				}
			);

			await createFeatureDiscovery(
				registry
			).resetIncompleteSetupReminder( 'newsletter' );

			expect( fetchMock ).toHaveFetched( dismissedItemsEndpoint, {
				body: {
					data: {
						slugs: [ key ],
					},
				},
				headers: {
					'X-HTTP-Method-Override': 'DELETE',
				},
			} );

			expect( registry.select( CORE_USER ).getDismissedItems() ).toEqual(
				[ otherKey ]
			);
		} );

		it( 'does nothing when the reminder is already loaded and not dismissed', async () => {
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			await createFeatureDiscovery(
				registry
			).resetIncompleteSetupReminder( 'newsletter' );

			expect( fetchMock ).not.toHaveFetched( dismissedItemsEndpoint );
		} );

		it( 'does nothing when the featureDiscoveryHub feature flag is disabled, even with unloaded user data', async () => {
			enabledFeatures.delete( 'featureDiscoveryHub' );
			freezeFetch( dismissedItemsEndpoint );

			await createFeatureDiscovery(
				registry
			).resetIncompleteSetupReminder( 'newsletter' );

			expect( fetchMock ).not.toHaveFetched( dismissedItemsEndpoint );
		} );

		it( 'does nothing while dismissal data is still loading', async () => {
			const key = getFeatureIncompleteSetupReminderKey( 'newsletter' );

			await createFeatureDiscovery(
				registry
			).resetIncompleteSetupReminder( 'newsletter' );

			expect( fetchMock ).not.toHaveFetched( dismissedItemsEndpoint );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [ key ] );

			fetchMock.postOnce(
				dismissedItemsEndpoint,
				{
					body: [],
				},
				{
					headers: {
						'X-HTTP-Method-Override': 'DELETE',
					},
				}
			);

			await createFeatureDiscovery(
				registry
			).resetIncompleteSetupReminder( 'newsletter' );

			expect( fetchMock ).toHaveFetched( dismissedItemsEndpoint );
		} );

		it( 'surfaces user-store removal failures', async () => {
			const key = getFeatureIncompleteSetupReminderKey( 'newsletter' );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [ key ] );

			const response = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};

			fetchMock.postOnce(
				dismissedItemsEndpoint,
				{
					body: response,
					status: 500,
				},
				{
					headers: {
						'X-HTTP-Method-Override': 'DELETE',
					},
				}
			);

			await createFeatureDiscovery(
				registry
			).resetIncompleteSetupReminder( 'newsletter' );

			await untilResolved( registry, CORE_USER ).getDismissedItems();

			expect(
				registry
					.select( CORE_USER )
					.getErrorForAction( 'removeDismissedItems', [ [ key ] ] )
			).toMatchObject( response );
			expect( console ).toHaveErrored();
		} );
	} );
} );
