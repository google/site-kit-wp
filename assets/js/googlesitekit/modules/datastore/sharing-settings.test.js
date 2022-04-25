/**
 * `googlesitekit/modules` datastore: sharing settings tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { CORE_MODULES } from './constants';
import { createTestRegistry } from '../../../../../tests/js/utils';

describe( 'core/modules sharing-settings', () => {
	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_MODULES ].store;
	} );

	describe( 'actions', () => {
		const settings = {
			sharingSettings: {
				'search-console': {
					sharedRoles: [ 'editor', 'subscriber' ],
					management: 'all_admins',
				},
				analytics: {
					sharedRoles: [ 'editor' ],
					management: 'owner',
				},
				'pagespeed-insights': {
					sharedRoles: [ 'editor' ],
					management: 'all_admins',
				},
			},
		};

		const sharingSettingsWithOwnerID = Object.keys(
			settings.sharingSettings
		).reduce(
			( modules, moduleSlug ) => ( {
				...modules,
				[ moduleSlug ]: {
					...settings.sharingSettings[ moduleSlug ],
					ownerID: 2,
				},
			} ),
			{}
		);

		describe( 'setOwnerID', () => {
			it( 'requires the newOwnerIDs param', () => {
				expect( () => {
					registry.dispatch( CORE_MODULES ).setOwnerID();
				} ).toThrow( 'newOwnerIDs is required' );
			} );

			it( 'receives newOwnerIDs and sets it to the sharing settings modules', () => {
				registry
					.dispatch( CORE_MODULES )
					.receiveGetSharingSettings( settings );

				const state = {
					...store.getState().sharingSettings,
					...store.getState().savedSharingSettings,
				};

				registry.dispatch( CORE_MODULES ).setOwnerID( {
					analytics: 2,
					'search-console': 2,
					'pagespeed-insights': 2,
				} );

				expect( store.getState().sharingSettings ).toMatchObject( {
					...state,
					...sharingSettingsWithOwnerID,
				} );
				expect( store.getState().savedSharingSettings ).toMatchObject( {
					...state,
					...sharingSettingsWithOwnerID,
				} );
			} );
		} );

		describe( 'setSharingManagement', () => {
			const settingsWithoutManagement = {
				sharingSettings: {
					'search-console': {
						sharedRoles: [ 'editor', 'subscriber' ],
					},
					analytics: {
						sharedRoles: [ 'editor' ],
					},
					'pagespeed-insights': {
						sharedRoles: [ 'editor' ],
					},
				},
			};

			it( 'requires the moduleSlug param', () => {
				expect( () => {
					registry.dispatch( CORE_MODULES ).setSharingManagement();
				} ).toThrow( 'moduleSlug is required' );
			} );

			it( 'requires the management param', () => {
				expect( () => {
					registry
						.dispatch( CORE_MODULES )
						.setSharingManagement( 'analytics' );
				} ).toThrow( 'management must be one of: all_admins, owner.' );
			} );

			it( 'receives management and sets it to the sharing settings modules', () => {
				registry
					.dispatch( CORE_MODULES )
					.receiveGetSharingSettings( settingsWithoutManagement );

				const state = {
					...store.getState().sharingSettings,
					...store.getState().savedSharingSettings,
				};

				const moduleSlugs = [ 'analytics', 'search-console' ];
				const managementRoles = [ 'all_admins', 'owner' ];

				registry
					.dispatch( CORE_MODULES )
					.setSharingManagement(
						moduleSlugs[ 0 ],
						managementRoles[ 0 ]
					);
				registry
					.dispatch( CORE_MODULES )
					.setSharingManagement(
						moduleSlugs[ 1 ],
						managementRoles[ 1 ]
					);

				const sharingSettingsWithManagement = moduleSlugs.reduce(
					( sharingSettings, moduleSlug, index ) => ( {
						...sharingSettings,
						[ moduleSlug ]: {
							...settingsWithoutManagement.sharingSettings[
								moduleSlug
							],
							management: managementRoles[ index ],
						},
					} ),
					{}
				);

				expect( store.getState().sharingSettings ).toMatchObject( {
					...state,
					...sharingSettingsWithManagement,
				} );
				expect( store.getState().savedSharingSettings ).toMatchObject( {
					...state,
					...sharingSettingsWithManagement,
				} );
			} );
		} );

		describe( 'setSharedRoles', () => {
			const settingsWithoutRoles = {
				sharingSettings: {
					'search-console': {
						management: 'all_admins',
					},
					analytics: {
						management: 'owner',
					},
					'pagespeed-insights': {
						management: 'all_admins',
					},
				},
			};

			it( 'requires the moduleSlug param', () => {
				expect( () => {
					registry.dispatch( CORE_MODULES ).setSharedRoles();
				} ).toThrow( 'moduleSlug is required' );
			} );

			it( 'requires the roles param', () => {
				expect( () => {
					registry
						.dispatch( CORE_MODULES )
						.setSharedRoles( 'analytics' );
				} ).toThrow( 'roles must be an array of strings.' );
			} );

			it( 'receives roles and sets it to the sharing settings modules', () => {
				registry
					.dispatch( CORE_MODULES )
					.receiveGetSharingSettings( settingsWithoutRoles );

				const state = {
					...store.getState().sharingSettings,
					...store.getState().savedSharingSettings,
				};

				const moduleSlugs = [ 'analytics', 'search-console' ];
				const sharedRoles = [ 'editor', 'subscriber' ];

				registry
					.dispatch( CORE_MODULES )
					.setSharedRoles( moduleSlugs[ 0 ], sharedRoles );
				registry
					.dispatch( CORE_MODULES )
					.setSharedRoles( moduleSlugs[ 1 ], sharedRoles );

				const sharingSettingsWithSharedRoles = moduleSlugs.reduce(
					( sharingSettings, moduleSlug ) => ( {
						...sharingSettings,
						[ moduleSlug ]: {
							...settingsWithoutRoles.sharingSettings[
								moduleSlug
							],
							sharedRoles,
						},
					} ),
					{}
				);

				expect( store.getState().sharingSettings ).toMatchObject( {
					...state,
					...sharingSettingsWithSharedRoles,
				} );
				expect( store.getState().savedSharingSettings ).toMatchObject( {
					...state,
					...sharingSettingsWithSharedRoles,
				} );
			} );
		} );

		describe( 'saveSharingSettings', () => {
			it( 'requires the sharingSettings param', () => {
				expect( () => {
					registry.dispatch( CORE_MODULES ).saveSharingSettings();
				} ).toThrow( 'sharingSettings is required' );
			} );

			it( 'dispatches a request to save sharing settings', async () => {
				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/sharing-settings/,
					{
						body: {
							settings: settings.sharingSettings,
							newOwnerIDs: {
								analytics: 2,
								'search-console': 2,
								'pagespeed-insights': 2,
							},
						},
					}
				);

				await registry.dispatch( CORE_MODULES ).saveSharingSettings( {
					savedSharingSettings: settings.sharingSettings,
				} );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				// Ensure the API call was made.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/core\/modules\/data\/sharing-settings/
				);

				// Ensure the ownerIDs were set to the modules via setOnwerID action
				expect( store.getState().sharingSettings ).toMatchObject( {
					...sharingSettingsWithOwnerID,
				} );
				expect( store.getState().savedSharingSettings ).toMatchObject( {
					...sharingSettingsWithOwnerID,
				} );
			} );
		} );
	} );
} );
