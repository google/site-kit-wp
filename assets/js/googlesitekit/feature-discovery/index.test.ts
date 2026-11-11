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
import { PERMISSION_MANAGE_OPTIONS } from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { createTestRegistry, provideUserCapabilities } from '@tests/js/utils';
import { createFeatureDiscovery } from './index';

describe( 'createFeatureDiscovery', () => {
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

		describe( 'checkRequirements', () => {
			let checkRequirements: (
				registry: WPDataRegistry
			) => Promise< boolean >;

			let resolveRequirements: jest.Mock;
			let isInProgress: jest.Mock;

			beforeEach( () => {
				provideUserCapabilities( registry, {
					[ PERMISSION_MANAGE_OPTIONS ]: true,
				} );

				resolveRequirements = jest.fn().mockResolvedValue( undefined );
				isInProgress = jest.fn().mockReturnValue( true );

				createFeatureDiscovery( registry ).registerFeature( slug, {
					...settings,
					setup: {
						...settings.setup,
						isEnabled: () => false,
						isInProgress,
					},
					incompleteSetupReminder: {
						title: 'Finish setting up this feature',
						description: 'Complete setup to start using it.',
						tooltip: '',
						resolveRequirements,
					},
				} );

				( { checkRequirements } = registry
					.select( CORE_NOTIFICATIONS )
					.getNotification(
						getFeatureIncompleteSetupReminderKey( slug )
					) );
			} );

			it( 'returns false without permission to manage options', async () => {
				provideUserCapabilities( registry, {
					[ PERMISSION_MANAGE_OPTIONS ]: false,
				} );

				await expect( checkRequirements( registry ) ).resolves.toBe(
					false
				);

				expect( resolveRequirements ).not.toHaveBeenCalled();
			} );

			it( 'resolves requirements before checking feature progress', async () => {
				isInProgress.mockReturnValue( undefined );

				resolveRequirements.mockImplementation( async () => {
					await Promise.resolve();
					isInProgress.mockReturnValue( true );
				} );

				await expect( checkRequirements( registry ) ).resolves.toBe(
					true
				);

				expect( resolveRequirements ).toHaveBeenCalledWith( registry );
			} );

			it.each( [
				[ true, true ],
				[ false, false ],
				[ undefined, false ],
			] )(
				'returns the expected eligibility for feature progress %s',
				async ( progress, expected ) => {
					isInProgress.mockReturnValue( progress );

					await expect( checkRequirements( registry ) ).resolves.toBe(
						expected
					);
				}
			);
		} );
	} );
} );
