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
import {
	createTestRegistry,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import FIXTURES from './__fixtures__';
import { MODULES_SEARCH_CONSOLE } from '../../../modules/search-console/datastore/constants';
import { MODULES_PAGESPEED_INSIGHTS } from '../../../modules/pagespeed-insights/datastore/constants';

describe( 'core/modules sharing-settings', () => {
	const sharingSettings = {
		settings: {
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

	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_MODULES ].store;
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'setSharingManagement', () => {
			const settingsWithoutManagement = {
				'search-console': {
					sharedRoles: [ 'editor', 'subscriber' ],
				},
				analytics: {
					sharedRoles: [ 'editor' ],
				},
				'pagespeed-insights': {
					sharedRoles: [ 'editor' ],
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
					( sharingSettingsObj, moduleSlug, index ) => ( {
						...sharingSettingsObj,
						[ moduleSlug ]: {
							...settingsWithoutManagement[ moduleSlug ],
							management: managementRoles[ index ],
						},
					} ),
					{}
				);

				expect( store.getState().sharingSettings ).toMatchObject( {
					...state,
					...sharingSettingsWithManagement,
				} );
			} );
		} );

		describe( 'setSharedRoles', () => {
			const settingsWithoutRoles = {
				'search-console': {
					management: 'all_admins',
				},
				analytics: {
					management: 'owner',
				},
				'pagespeed-insights': {
					management: 'all_admins',
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
					( sharingSettingsObj, moduleSlug ) => ( {
						...sharingSettingsObj,
						[ moduleSlug ]: {
							...settingsWithoutRoles[ moduleSlug ],
							sharedRoles,
						},
					} ),
					{}
				);

				expect( store.getState().sharingSettings ).toMatchObject( {
					...state,
					...sharingSettingsWithSharedRoles,
				} );
			} );
		} );

		describe( 'saveSharingSettings', () => {
			it( 'does not require any params', () => {
				expect( async () => {
					fetchMock.get(
						/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
						{ body: FIXTURES, status: 200 }
					);

					fetchMock.postOnce(
						/^\/google-site-kit\/v1\/core\/modules\/data\/sharing-settings/,
						{
							body: {
								settings: sharingSettings.settings,
								newOwnerIDs: {
									'search-console': 2,
									'pagespeed-insights': 2,
								},
							},
						}
					);

					const initialModules = registry
						.select( CORE_MODULES )
						.getModules();
					// The modules info will be its initial value while the modules
					// info is fetched.
					expect( initialModules ).toBeUndefined();
					await untilResolved( registry, CORE_MODULES ).getModules();

					// TODO: Remove the `receiveGetSharingSettings` call and
					// Add coverage for using `getSharingSettings` selector in 4795.
					registry
						.dispatch( CORE_MODULES )
						.receiveGetSharingSettings( sharingSettings.settings );

					await registry
						.dispatch( CORE_MODULES )
						.saveSharingSettings();
				} ).not.toThrow();
			} );

			it.each( [
				[
					'should',
					{
						'search-console': 2,
						'pagespeed-insights': 2,
					},
					2,
				],
				[ 'should not', undefined, undefined ],
			] )(
				'dispatches a request to save sharing settings and %s dispatch setOwnerID action based on the `newOwnerIDs` availability',
				async ( _, newOwnerIDs, ownerID ) => {
					fetchMock.get(
						/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
						{
							body: [
								...FIXTURES,
								{
									slug: 'search-console',
									name: 'Search Console',
									storeName: 'modules/search-console',
								},
								{
									slug: 'pagespeed-insights',
									name: 'PageSpeed Insights',
									storeName: 'modules/pagespeed-insights',
								},
							],
							status: 200,
						}
					);

					fetchMock.get(
						/^\/google-site-kit\/v1\/core\/site\/data\/settings/,
						{ body: { setting1: 'value' }, status: 200 }
					);

					fetchMock.get(
						/^\/google-site-kit\/v1\/modules\/search-console\/data\/settings/,
						{ body: { setting1: 'value' }, status: 200 }
					);

					fetchMock.get(
						/^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/settings/,
						{ body: { setting1: 'value' }, status: 200 }
					);

					fetchMock.postOnce(
						/^\/google-site-kit\/v1\/core\/modules\/data\/sharing-settings/,
						{
							body: {
								settings: sharingSettings.settings,
								newOwnerIDs,
							},
						}
					);

					const initialModules = registry
						.select( CORE_MODULES )
						.getModules();
					// The modules info will be its initial value while the modules
					// info is fetched.
					expect( initialModules ).toBeUndefined();
					await untilResolved( registry, CORE_MODULES ).getModules();

					registry
						.dispatch( CORE_MODULES )
						.receiveGetSharingSettings( sharingSettings.settings );

					await registry
						.dispatch( CORE_MODULES )
						.saveSharingSettings();

					// Ensure the API call was made.
					expect( fetchMock ).toHaveFetched(
						/^\/google-site-kit\/v1\/core\/modules\/data\/sharing-settings/
					);

					expect( fetchMock ).toHaveFetched(
						/^\/google-site-kit\/v1\/core\/modules\/data\/list/
					);

					// Ensure the `setOwnerID` action is dispatched and set the ownerID in state
					// OR not based on the `newOwnerIDs` availability.
					expect(
						registry.select( MODULES_SEARCH_CONSOLE ).getOwnerID()
					).toBe( ownerID );
					expect(
						registry
							.select( MODULES_PAGESPEED_INSIGHTS )
							.getOwnerID()
					).toBe( ownerID );
				}
			);
		} );

		describe( 'receiveGetSharingSettings', () => {
			it( 'requires the sharingSettings param', () => {
				expect( () => {
					registry
						.dispatch( CORE_MODULES )
						.receiveGetSharingSettings();
				} ).toThrow( 'sharingSettings is required' );
			} );

			it( 'receives sharingSettings and sets it to the state', () => {
				const state = {
					...store.getState().sharingSettings,
					...store.getState().savedSharingSettings,
				};

				registry
					.dispatch( CORE_MODULES )
					.receiveGetSharingSettings( sharingSettings.settings );

				expect( store.getState().sharingSettings ).toMatchObject( {
					...state,
					...sharingSettings.settings,
				} );
				expect( store.getState().savedSharingSettings ).toMatchObject( {
					...state,
					...sharingSettings.settings,
				} );
			} );
		} );
	} );
} );
