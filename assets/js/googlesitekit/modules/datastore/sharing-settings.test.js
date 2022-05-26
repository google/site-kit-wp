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
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { MODULES_SEARCH_CONSOLE } from '../../../modules/search-console/datastore/constants';
import { MODULES_PAGESPEED_INSIGHTS } from '../../../modules/pagespeed-insights/datastore/constants';

describe( 'core/modules sharing-settings', () => {
	const dashboardSharingDataBaseVar = '_googlesitekitDashboardSharingData';
	const sharingSettings = {
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
	};
	const shareableRoles = [
		{
			id: 'administrator',
			displayName: 'Administrator',
		},
		{
			id: 'editor',
			displayName: 'Editor',
		},
		{
			id: 'author',
			displayName: 'Author',
		},
		{
			id: 'contributor',
			displayName: 'Contributor',
		},
	];
	const dashboardSharingData = {
		settings: sharingSettings,
		roles: shareableRoles,
	};

	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_MODULES ].store;
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		delete global[ dashboardSharingDataBaseVar ];
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

				registry
					.dispatch( CORE_MODULES )
					.setSharingManagement( 'search-console', 'all_admins' );
				registry
					.dispatch( CORE_MODULES )
					.setSharingManagement( 'analytics', 'owner' );

				expect(
					store.getState().sharingSettings.analytics.management
				).toBe( 'owner' );
				expect(
					store.getState().sharingSettings[ 'search-console' ]
						.management
				).toBe( 'all_admins' );
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

				registry
					.dispatch( CORE_MODULES )
					.setSharedRoles( 'analytics', [ 'editor', 'subscriber' ] );
				registry
					.dispatch( CORE_MODULES )
					.setSharedRoles( 'search-console', [ 'subscriber' ] );

				expect(
					store.getState().sharingSettings.analytics.sharedRoles
				).toEqual( [ 'editor', 'subscriber' ] );
				expect(
					store.getState().sharingSettings[ 'search-console' ]
						.sharedRoles
				).toEqual( [ 'subscriber' ] );
			} );
		} );

		describe( 'saveSharingSettings', () => {
			it.each( [
				[
					'should',
					{
						'search-console': 2,
						'pagespeed-insights': 2,
					},
					2,
				],
				[ 'should not', {}, 1 ],
			] )(
				'dispatches a request to save sharing settings and %s dispatch setOwnerID action based on the `newOwnerIDs` availability',
				async ( _, newOwnerIDs, ownerID ) => {
					global[
						dashboardSharingDataBaseVar
					] = dashboardSharingData;

					provideModules( registry );
					provideModuleRegistrations( registry );

					registry
						.dispatch( MODULES_SEARCH_CONSOLE )
						.receiveGetSettings( { ownerID: 1 } );
					registry
						.dispatch( MODULES_PAGESPEED_INSIGHTS )
						.receiveGetSettings( { ownerID: 1 } );

					fetchMock.postOnce(
						/^\/google-site-kit\/v1\/core\/modules\/data\/sharing-settings/,
						{
							body: {
								settings: sharingSettings,
								newOwnerIDs,
							},
						}
					);

					await registry
						.dispatch( CORE_MODULES )
						.saveSharingSettings();

					// Ensure the API call was made.
					expect( fetchMock ).toHaveFetched(
						/^\/google-site-kit\/v1\/core\/modules\/data\/sharing-settings/
					);

					// Ensure the `setOwnerID` action is dispatched and set the ownerID in state
					// OR not based on the `newOwnerIDs` availability from the response.
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
				registry
					.dispatch( CORE_MODULES )
					.receiveGetSharingSettings( sharingSettings );

				expect( store.getState().sharingSettings ).toMatchObject(
					sharingSettings
				);
				expect( store.getState().savedSharingSettings ).toMatchObject(
					sharingSettings
				);
			} );
		} );

		describe( 'receiveShareableRoles', () => {
			it( 'requires the shareableRoles param', () => {
				expect( () => {
					registry.dispatch( CORE_MODULES ).receiveShareableRoles();
				} ).toThrow( 'shareableRoles is required' );
			} );

			it( 'receives shareableRoles and sets it to the state', () => {
				registry
					.dispatch( CORE_MODULES )
					.receiveShareableRoles( shareableRoles );

				expect( store.getState().shareableRoles ).toEqual(
					expect.arrayContaining( shareableRoles )
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getSharingSettings', () => {
			it( 'should return undefined if `sharingSettings` cannot be loaded', () => {
				global[ dashboardSharingDataBaseVar ] = undefined;

				const sharingSettingsObj = registry
					.select( CORE_MODULES )
					.getSharingSettings();

				expect( console ).toHaveErrored();
				expect( sharingSettingsObj ).toBeUndefined();
			} );

			it( 'should return an empty object if there is no `settings`', async () => {
				global[ dashboardSharingDataBaseVar ] = {
					settings: {},
				};

				const sharingSettingsObj = registry
					.select( CORE_MODULES )
					.getSharingSettings();

				expect( sharingSettingsObj ).toMatchObject( {} );
			} );

			it( 'should return the `sharingSettings` object', async () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

				const sharingSettingsObj = registry
					.select( CORE_MODULES )
					.getSharingSettings();

				expect( sharingSettingsObj ).toMatchObject( sharingSettings );
			} );
		} );

		describe( 'getShareableRoles', () => {
			it( 'should return undefined if `shareableRoles` cannot be loaded', () => {
				global[ dashboardSharingDataBaseVar ] = undefined;

				const shareableRolesObj = registry
					.select( CORE_MODULES )
					.getShareableRoles();

				expect( console ).toHaveErrored();
				expect( shareableRolesObj ).toBeUndefined();
			} );

			it( 'should return an empty array if there is no `roles`', async () => {
				global[ dashboardSharingDataBaseVar ] = {
					roles: [],
				};

				const shareableRolesObj = registry
					.select( CORE_MODULES )
					.getShareableRoles();

				expect( shareableRolesObj ).toMatchObject( [] );
			} );

			it( 'should return the `shareableRoles` object', async () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

				const shareableRolesObj = registry
					.select( CORE_MODULES )
					.getShareableRoles();

				expect( shareableRolesObj ).toMatchObject( shareableRoles );
			} );
		} );

		describe( 'getSharingManagement', () => {
			it( 'requires the moduleSlug param', () => {
				expect( () => {
					registry.select( CORE_MODULES ).getSharingManagement();
				} ).toThrow( 'moduleSlug is required' );
			} );

			it( 'should return undefined if `sharingSettings` cannot be loaded', () => {
				global[ dashboardSharingDataBaseVar ] = undefined;

				const sharingManagement = registry
					.select( CORE_MODULES )
					.getSharingManagement( 'search-console' );

				expect( console ).toHaveErrored();
				expect( sharingManagement ).toBeUndefined();
			} );

			it( 'should return null if `management` is not available the given module', () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

				const sharingManagement = registry
					.select( CORE_MODULES )
					.getSharingManagement( 'idea-hub' );
				expect( sharingManagement ).toBeNull();
			} );

			it( 'should return the `management` string for the given module', async () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

				const sharingManagement = registry
					.select( CORE_MODULES )
					.getSharingManagement( 'search-console' );

				expect( sharingManagement ).toBe( 'all_admins' );
			} );
		} );

		describe( 'getSharedRoles', () => {
			it( 'requires the moduleSlug param', () => {
				expect( () => {
					registry.select( CORE_MODULES ).getSharedRoles();
				} ).toThrow( 'moduleSlug is required' );
			} );

			it( 'should return undefined if `sharingSettings` cannot be loaded', () => {
				global[ dashboardSharingDataBaseVar ] = undefined;

				const sharedRoles = registry
					.select( CORE_MODULES )
					.getSharedRoles( 'search-console' );

				expect( console ).toHaveErrored();
				expect( sharedRoles ).toBeUndefined();
			} );

			it( 'should return null if `shareableRoles` is not available the given module', () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

				const sharedRoles = registry
					.select( CORE_MODULES )
					.getSharedRoles( 'idea-hub' );
				expect( sharedRoles ).toBeNull();
			} );

			it( 'should return the `sharedRoles` array for the given module', async () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;

				const sharedRoles = registry
					.select( CORE_MODULES )
					.getSharedRoles( 'search-console' );

				expect( sharedRoles ).toEqual( [ 'editor', 'subscriber' ] );
			} );
		} );

		describe( 'haveSharingSettingsChanged', () => {
			it( 'informs whether client-side sharing-settings differ from server-side ones', async () => {
				global[ dashboardSharingDataBaseVar ] = undefined;

				// Initially false.
				expect(
					registry.select( CORE_MODULES ).haveSharingSettingsChanged()
				).toBe( false );

				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;
				registry.select( CORE_MODULES ).getSharingSettings();

				// Still false after getting the sharing settings from the global variable.
				expect(
					registry.select( CORE_MODULES ).haveSharingSettingsChanged()
				).toBe( false );

				// True after updating module's `management` on the client.
				registry
					.dispatch( CORE_MODULES )
					.setSharingManagement( 'search-console', 'owner' );
				expect(
					registry.select( CORE_MODULES ).haveSharingSettingsChanged()
				).toBe( true );

				// False after updating module's `management` back to original server value on client.
				registry
					.dispatch( CORE_MODULES )
					.setSharingManagement( 'search-console', 'all_admins' );
				expect(
					registry.select( CORE_MODULES ).haveSharingSettingsChanged()
				).toBe( false );

				// True after updating module's `sharedRoles` on the client.
				registry
					.dispatch( CORE_MODULES )
					.setSharedRoles( 'search-console', [ 'editor' ] );
				expect(
					registry.select( CORE_MODULES ).haveSharingSettingsChanged()
				).toBe( true );

				// False after updating module's `sharedRoles` back to original server value on client.
				registry
					.dispatch( CORE_MODULES )
					.setSharedRoles( 'search-console', [
						'editor',
						'subscriber',
					] );
				expect(
					registry.select( CORE_MODULES ).haveSharingSettingsChanged()
				).toBe( false );
			} );

			it( 'compares all keys when keys argument is not supplied', async () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;
				registry.select( CORE_MODULES ).getSharingSettings();

				// Update the sharing settings so they differ. All values are being checked here.
				registry
					.dispatch( CORE_MODULES )
					.setSharingManagement( 'search-console', 'owner' );
				expect(
					registry.select( CORE_MODULES ).haveSharingSettingsChanged()
				).toBe( true );
			} );

			it( 'compares select keys when keys argument is supplied', async () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;
				registry.select( CORE_MODULES ).getSharingSettings();

				// Update the sharing settings so they differ. Only `search-console` should trigger
				// a truthy return value. `analytics` should return a falsy value.
				registry
					.dispatch( CORE_MODULES )
					.setSharingManagement( 'search-console', 'owner' );
				expect(
					registry
						.select( CORE_MODULES )
						.haveSharingSettingsChanged( [ 'search-console' ] )
				).toBe( true );
				expect(
					registry
						.select( CORE_MODULES )
						.haveSharingSettingsChanged( [ 'analytics' ] )
				).toBe( false );

				// Checking all values should be possible.
				expect(
					registry
						.select( CORE_MODULES )
						.haveSharingSettingsChanged( [
							'search-console',
							'analytics',
						] )
				).toBe( true );

				// Checking no values should be possible, and should not be treated as
				// an `undefined` keys array.
				expect(
					registry
						.select( CORE_MODULES )
						.haveSharingSettingsChanged( [] )
				).toBe( false );
			} );
		} );

		describe( 'canSubmitSharingChanges', () => {
			it( 'informs whether client-side sharing-settings differ from server-side ones', () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;
				registry.select( CORE_MODULES ).getSharingSettings();

				// True after updating module's `sharedRoles` on the client.
				registry
					.dispatch( CORE_MODULES )
					.setSharedRoles( 'search-console', [ 'editor' ] );
				expect(
					registry.select( CORE_MODULES ).canSubmitSharingChanges()
				).toBe( true );

				// False after updating module's `sharedRoles` back to original server value on client.
				registry
					.dispatch( CORE_MODULES )
					.setSharedRoles( 'search-console', [
						'editor',
						'subscriber',
					] );
				expect(
					registry.select( CORE_MODULES ).canSubmitSharingChanges()
				).toBe( false );
			} );
		} );

		describe( 'isDoingSubmitSharingChanges', () => {
			it( 'should be set to FALSE by default', () => {
				expect(
					registry
						.select( CORE_MODULES )
						.isDoingSubmitSharingChanges()
				).toBe( false );
			} );

			it( 'should be set to TRUE after starting submiting sharing changes', () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;
				registry.select( CORE_MODULES ).getSharingSettings();

				freezeFetch(
					/^\/google-site-kit\/v1\/core\/modules\/data\/sharing-settings/
				);

				registry.dispatch( CORE_MODULES ).saveSharingSettings();

				expect(
					registry
						.select( CORE_MODULES )
						.isDoingSubmitSharingChanges()
				).toBe( true );
			} );

			it( 'should be set to FALSE after finishing submitting sharing changes', async () => {
				global[ dashboardSharingDataBaseVar ] = dashboardSharingData;
				registry.select( CORE_MODULES ).getSharingSettings();

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/sharing-settings/,
					{
						body: {
							settings: sharingSettings,
							newOwnerIDs: {},
						},
					}
				);

				await registry.dispatch( CORE_MODULES ).saveSharingSettings();

				expect(
					registry
						.select( CORE_MODULES )
						.isDoingSubmitSharingChanges()
				).toBe( false );
			} );
		} );
	} );
} );
