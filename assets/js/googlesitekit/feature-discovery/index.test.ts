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
import IncompleteSetupReminderNotification from '@/js/components/feature-discovery/IncompleteSetupReminderNotification';
import { enabledFeatures } from '@/js/features';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { FeatureSettings } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureIncompleteSetupReminderKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
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

	describe( 'registerFeature', () => {
		const slug = 'test-feature';

		const settings: FeatureSettings = {
			title: 'Test feature',
			shortDescription: 'Test feature description',
			effort: FEATURE_EFFORTS.LOW,
			goalCategories: [ FEATURE_CATEGORIES.ENGAGEMENT ],
			addedInVersion: '1.191.0',
			setup: { type: FEATURE_SETUP_TYPES.SETUP_FLOW },
		};

		it( 'registers a reminder notification for a feature with incompleteSetupReminder', () => {
			createFeatureDiscovery( registry ).registerFeature( slug, {
				...settings,
				incompleteSetupReminder: {
					title: 'Finish setting up this feature',
					description: 'Complete setup to start using it.',
					tooltip: '',
					resolveRequirements: () => Promise.resolve(),
				},
			} );

			expect(
				registry
					.select( CORE_NOTIFICATIONS )
					.getNotification(
						getFeatureIncompleteSetupReminderKey( slug )
					)
			).toMatchObject( {
				Component: IncompleteSetupReminderNotification,
				priority: PRIORITY.REMINDER,
				areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
				groupID: NOTIFICATION_GROUPS.DEFAULT,
				viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				isDismissible: true,
				featureFlag: 'featureDiscoveryHub',
				checkRequirements: expect.any( Function ),
			} );
		} );

		it( 'does not register a reminder notification for a feature without incompleteSetupReminder', () => {
			createFeatureDiscovery( registry ).registerFeature(
				slug,
				settings
			);

			expect(
				registry
					.select( CORE_NOTIFICATIONS )
					.getNotification(
						getFeatureIncompleteSetupReminderKey( slug )
					)
			).toBeUndefined();
		} );
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

		it( 'loads dismissed items first and removes reminder once loaded', async () => {
			const key = getFeatureIncompleteSetupReminderKey( 'newsletter' );
			fetchMock.getOnce( dismissedItemsEndpoint, {
				body: [ key ],
			} );

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

			expect( fetchMock ).toHaveFetchedTimes( 2 );
			expect( registry.select( CORE_USER ).getDismissedItems() ).toEqual(
				[]
			);
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
