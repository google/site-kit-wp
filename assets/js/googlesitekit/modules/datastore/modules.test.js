/**
 * core/modules data store: modules tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	muteConsole,
	muteFetch,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { sortByProperty } from '../../../util/sort-by-property';
import { convertArrayListToKeyedObjectMap } from '../../../util/convert-array-to-keyed-object-map';
import { STORE_NAME } from './constants';
import FIXTURES from './fixtures.json';

describe( 'core/modules modules', () => {
	const sortedFixtures = sortByProperty( FIXTURES, 'order' );
	const fixturesKeyValue = convertArrayListToKeyedObjectMap( sortedFixtures, 'slug' );
	let registry;
	let store;

	beforeEach( async () => {
		// Invalidate the cache before every request, but keep it enabled to
		// make sure we're opting-out of the cache for the correct requests.
		await API.invalidateCache();

		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'activateModule', () => {
			it( 'dispatches a request to activate this module', async () => {
				// In our fixtures, optimize is off by default.
				const slug = 'optimize';
				const responseWithOptimizeEnabled = FIXTURES.reduce( ( acc, module ) => {
					if ( module.slug === slug ) {
						return [ ...acc, { ...module, active: true } ];
					}

					return [ ...acc, module ];
				}, [] );
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);

				// Call a selector that triggers an HTTP request to get the modules.
				registry.select( STORE_NAME ).isModuleActive( slug );
				// Wait until the modules have been loaded.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);
				const isActiveBefore = registry.select( STORE_NAME ).isModuleActive( slug );

				expect( isActiveBefore ).toEqual( false );

				// Activate the module.
				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
					{ body: { success: true }, status: 200 }
				);
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: responseWithOptimizeEnabled, status: 200 }
				);
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/user\/data\/authentication/,
					{ body: {}, status: 200 }
				);

				registry.dispatch( STORE_NAME ).activateModule( slug );

				// Wait until this activation action has completed.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.isDoingSetModuleActivation( slug ) === false
				);

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
					{
						body: {
							data: {
								slug,
								active: true,
							},
						},
					}
				);

				// Optimize should be active.
				const isActiveAfter = registry.select( STORE_NAME ).isModuleActive( slug );

				expect( fetchMock ).toHaveFetchedTimes( 4 );
				expect( isActiveAfter ).toEqual( true );
			} );

			it( 'does not update status if the API encountered a failure', async () => {
				// In our fixtures, optimize is off by default.
				const slug = 'optimize';
				registry.dispatch( STORE_NAME ).receiveGetModules( FIXTURES );

				const isActiveBefore = registry.select( STORE_NAME ).isModuleActive( slug );

				expect( isActiveBefore ).toEqual( false );

				// Try to activate the module—this will fail.
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
					{ body: response, status: 500 }
				);

				muteConsole( 'error' );
				registry.dispatch( STORE_NAME ).activateModule( slug );

				// Wait until this activation action has completed.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.isDoingSetModuleActivation( slug ) === false
				);

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
					{
						body: {
							data: {
								slug,
								active: true,
							},
						},
					}
				);

				// Optimize should be active.
				const isActiveAfter = registry.select( STORE_NAME ).isModuleActive( slug );

				// The fourth request to update the modules shouldn't be called, because the
				// activation request failed.
				expect( fetchMock ).toHaveBeenCalledTimes( 1 );
				expect( isActiveAfter ).toEqual( false );
			} );
		} );

		describe( 'deactivateModule', () => {
			it( 'dispatches a request to deactivate this module', async () => {
				// In our fixtures, analytics is on by default.
				const slug = 'analytics';
				const responseWithAnalyticsDisabled = FIXTURES.reduce( ( acc, module ) => {
					if ( module.slug === slug ) {
						return [ ...acc, { ...module, active: false } ];
					}

					return [ ...acc, module ];
				}, [] );

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);

				// Call a selector that triggers an HTTP request to get the modules.
				registry.select( STORE_NAME ).getModules();

				// Wait until the modules have been loaded.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const isActiveBefore = registry.select( STORE_NAME ).isModuleActive( slug );

				expect( isActiveBefore ).toEqual( true );

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
					{ body: { success: true }, status: 200 }
				);

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: responseWithAnalyticsDisabled, status: 200 }
				);

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/user\/data\/authentication/,
					{ body: {}, status: 200 }
				);

				await registry.dispatch( STORE_NAME ).deactivateModule( slug );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
					{
						body: {
							data: {
								slug,
								active: false,
							},
						},
					}
				);

				// Analytics should no longer be active.
				const isActiveAfter = registry.select( STORE_NAME ).isModuleActive( slug );

				expect( isActiveAfter ).toEqual( false );
				expect( fetchMock ).toHaveFetchedTimes( 4 );
			} );

			it( 'does not update status if the API encountered a failure', async () => {
				// In our fixtures, analytics is on by default.
				const slug = 'analytics';
				registry.dispatch( STORE_NAME ).receiveGetModules( FIXTURES );

				const isActiveBefore = registry.select( STORE_NAME ).isModuleActive( slug );

				expect( isActiveBefore ).toEqual( true );

				// Try to deactivate the module—this will fail.
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
					{ body: response, status: 500 }
				);

				muteConsole( 'error' );
				await registry.dispatch( STORE_NAME ).deactivateModule( slug );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
					{
						body: {
							data: {
								slug,
								active: false,
							},
						},
					}
				);

				// Analytics should still be active.
				const isActiveAfter = registry.select( STORE_NAME ).isModuleActive( slug );

				// The fourth request to update the modules shouldn't be called, because the
				// deactivation request failed.
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isActiveAfter ).toEqual( true );
			} );
		} );

		describe( 'registerModule', () => {
			const moduleSlug = 'test-module';
			const moduleSettings = {
				name: 'Test Module',
				order: 1,
				description: 'A module for testing',
				homepage: 'https://sitekit.withgoogle.com/',
				icon: 'icon-name',
			};

			it( 'registers a module', async () => {
				await registry.dispatch( STORE_NAME ).registerModule( moduleSlug, moduleSettings );
				const modules = registry.select( STORE_NAME ).getModules();
				expect( modules[ moduleSlug ] ).not.toBeUndefined();
				expect( modules[ moduleSlug ] ).toEqual( expect.objectContaining( moduleSettings ) );
			} );

			it( 'does not allow active or connected properties to be set to true', async () => {
				await registry.dispatch( STORE_NAME ).registerModule( moduleSlug, { active: true, connected: true, ...moduleSettings } );
				const modules = registry.select( STORE_NAME ).getModules();
				expect( modules[ moduleSlug ].active ).toBe( false );
				expect( modules[ moduleSlug ].connected ).toBe( false );
			} );
		} );

		describe( 'fetchGetModules', () => {
			it( 'does not require any params', () => {
				expect( () => {
					muteFetch( /^\/google-site-kit\/v1\/core\/modules\/data\/list/, [] );
					registry.dispatch( STORE_NAME ).fetchGetModules();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveGetModules', () => {
			it( 'requires the response param', () => {
				expect( () => {
					muteConsole( 'error' );
					registry.dispatch( STORE_NAME ).receiveGetModules();
				} ).toThrow( 'response is required.' );
			} );

			it( 'receives and sets modules ', async () => {
				const modules = FIXTURES;
				await registry.dispatch( STORE_NAME ).receiveGetModules( modules );

				const state = store.getState();

				expect( state ).toMatchObject( { modules: fixturesKeyValue } );
			} );
		} );

		describe( 'setSettingsDisplayMode', () => {
			it( 'sets the a module\'s displayMode to the correct value', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'analytics';
				registry.select( STORE_NAME ).getModule( slug );

				let displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );

				// Expect initial status to be closed.
				expect( displayMode ).toEqual( 'closed' );

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const moduleLoaded = registry.select( STORE_NAME ).getModule( slug );
				expect( moduleLoaded ).not.toEqual( null );

				// Set display mode to 'view'.
				registry.dispatch( STORE_NAME ).setSettingsDisplayMode( slug, 'view' );

				displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );

				// Expect displayMode to default to be 'view'.
				expect( displayMode ).toEqual( 'view' );
			} );

			it( 'changes other modules\' displayModes to "closed" when changing a module to "view"', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'analytics';
				const otherSlug = 'adsense';
				registry.select( STORE_NAME ).getModule( slug );
				registry.select( STORE_NAME ).getModule( otherSlug );

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				// Set otherSlug mode to 'open'.
				registry.dispatch( STORE_NAME ).setSettingsDisplayMode( otherSlug, 'view' );

				let otherDisplayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( otherSlug );
				expect( otherDisplayMode ).toEqual( 'view' );

				registry.dispatch( STORE_NAME ).setSettingsDisplayMode( slug, 'view' );

				// Expect target's displayMode to be "view".
				const displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );
				expect( displayMode ).toEqual( 'view' );

				// Expect other module's displayMode to have changed to "closed".
				otherDisplayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( otherSlug );
				expect( otherDisplayMode ).toEqual( 'closed' );
			} );
		} );

		it( 'changes other modules\' displayModes to "locked" when changing a module to "edit"', async () => {
			fetchMock.getOnce(
				/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
				{ body: FIXTURES, status: 200 }
			);
			const slug = 'analytics';
			const otherSlug = 'adsense';
			registry.select( STORE_NAME ).getModule( slug );
			registry.select( STORE_NAME ).getModule( otherSlug );

			// Wait for loading to complete.
			await subscribeUntil( registry, () => registry
				.select( STORE_NAME )
				.hasFinishedResolution( 'getModules' )
			);

			// Set otherSlug mode to "edit".
			registry.dispatch( STORE_NAME ).setSettingsDisplayMode( otherSlug, 'edit' );

			let otherDisplayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( otherSlug );
			expect( otherDisplayMode ).toEqual( 'edit' );

			registry.dispatch( STORE_NAME ).setSettingsDisplayMode( slug, 'edit' );

			// Expect target's displayMode to be "edit".
			const displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );
			expect( displayMode ).toEqual( 'edit' );

			// Expect other module's displayMode to have changed to "locked".
			otherDisplayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( otherSlug );
			expect( otherDisplayMode ).toEqual( 'locked' );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getModules', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);

				const initialModules = registry.select( STORE_NAME ).getModules();
				// The modules info will be its initial value while the modules
				// info is fetched.
				expect( initialModules ).toEqual( undefined );
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const modules = registry.select( STORE_NAME ).getModules();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( modules ).toEqual( fixturesKeyValue );
			} );

			it( 'does not make a network request if data is already in state', async () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( FIXTURES );

				const modules = registry.select( STORE_NAME ).getModules();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( modules ).toEqual( fixturesKeyValue );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: response, status: 500 }
				);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getModules();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const modules = registry.select( STORE_NAME ).getModules();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( modules ).toEqual( undefined );
			} );
		} );

		describe( 'getModule', () => {
			it( 'uses a resolver get all modules when one is requested', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'analytics';
				const module = registry.select( STORE_NAME ).getModule( slug );

				// The modules will be undefined whilst loading.
				expect( module ).toEqual( undefined );

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const moduleLoaded = registry.select( STORE_NAME ).getModule( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( moduleLoaded ).toEqual( fixturesKeyValue[ slug ] );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				const slug = 'analytics';

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: response, status: 500 }
				);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getModule( slug );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const module = registry.select( STORE_NAME ).getModule( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( module ).toEqual( undefined );
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				// This triggers a network request, so ignore the error.
				muteFetch( /^\/google-site-kit\/v1\/core\/modules\/data\/list/, [] );

				const module = registry.select( STORE_NAME ).getModule( 'analytics' );

				expect( module ).toEqual( undefined );
			} );

			it( 'returns null if the module does not exist', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);

				const slug = 'analytics';
				const module = registry.select( STORE_NAME ).getModule( slug );
				// The modules will be undefined whilst loading.
				expect( module ).toEqual( undefined );

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const moduleLoaded = registry.select( STORE_NAME ).getModule( 'not-a-real-module' );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( moduleLoaded ).toEqual( null );
			} );
		} );

		describe( 'getSettingsDisplayMode', () => {
			it( 'returns the correct status', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'analytics';
				registry.select( STORE_NAME ).getModule( slug );

				let displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );

				// Expect initial status to be closed.
				expect( displayMode ).toEqual( 'closed' );

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const moduleLoaded = registry.select( STORE_NAME ).getModule( slug );
				expect( moduleLoaded ).not.toEqual( null );

				// Set display mode to 'view'.
				registry.dispatch( STORE_NAME ).setSettingsDisplayMode( slug, 'view' );

				displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );

				// Expect displayMode to default to be 'view'.
				expect( displayMode ).toEqual( 'view' );
			} );

			it( 'returns "closed" by default', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'analytics';
				const module = registry.select( STORE_NAME ).getModule( slug );

				let displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );

				// Expect displayMode to be 'closed' before modules are loaded.
				expect( displayMode ).toEqual( 'closed' );
				expect( module ).toEqual( undefined );

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );

				// Expect displayMode to default to 'closed' after modules are loaded.
				expect( displayMode ).toEqual( 'closed' );
			} );
		} );

		describe( 'isEditingSettings', () => {
			it( 'returns true if module is being edited, false if not', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'analytics';
				registry.select( STORE_NAME ).getModule( slug );

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				let displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );

				expect( displayMode ).not.toEqual( 'edit' );
				expect( registry.select( STORE_NAME ).isEditingSettings( slug ) ).toBe( false );

				registry.dispatch( STORE_NAME ).setSettingsDisplayMode( slug, 'edit' );
				displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );

				expect( displayMode ).toEqual( 'edit' );
				expect( registry.select( STORE_NAME ).isEditingSettings( slug ) ).toBe( true );
			} );
		} );

		describe( 'isModuleActive', () => {
			beforeEach( () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
			} );

			it( 'returns true if a module is active', async () => {
				// Search console is active in our fixtures.
				const slug = 'search-console';
				const isActive = registry.select( STORE_NAME ).isModuleActive( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isActive ).toEqual( undefined );

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const isActiveLoaded = registry.select( STORE_NAME ).isModuleActive( slug );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isActiveLoaded ).toEqual( true );
			} );

			it( 'returns false if a module is not active', async () => {
				// Optimize in our fixtures is not active.
				const slug = 'optimize';
				const isActive = registry.select( STORE_NAME ).isModuleActive( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isActive ).toEqual( undefined );

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const isActiveLoaded = registry.select( STORE_NAME ).isModuleActive( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isActiveLoaded ).toEqual( false );
			} );

			it( 'returns null if a module does not exist', async () => {
				const slug = 'not-a-real-module';
				const isActive = registry.select( STORE_NAME ).isModuleActive( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isActive ).toEqual( undefined );

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const isActiveLoaded = registry.select( STORE_NAME ).isModuleActive( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isActiveLoaded ).toEqual( null );
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				muteFetch( /^\/google-site-kit\/v1\/core\/modules\/data\/list/, [] );

				const isActive = registry.select( STORE_NAME ).isModuleActive( 'analytics' );

				expect( isActive ).toEqual( undefined );
			} );
		} );

		describe( 'isModuleConnected', () => {
			beforeEach( () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
			} );

			it( 'returns true if a module is connected', async () => {
				const slug = 'analytics';
				const isConnected = registry.select( STORE_NAME ).isModuleConnected( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isConnected ).toBeUndefined();

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const isConnectedLoaded = registry.select( STORE_NAME ).isModuleConnected( slug );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isConnectedLoaded ).toEqual( true );
			} );

			it( 'returns false if a module is not active', async () => {
				// Optimize in our fixtures is not active.
				const slug = 'optimize';
				const isConnected = registry.select( STORE_NAME ).isModuleConnected( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isConnected ).toBeUndefined();

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const isConnectedLoaded = registry.select( STORE_NAME ).isModuleConnected( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isConnectedLoaded ).toEqual( false );
			} );

			it( 'returns false if a module is active but not connected', async () => {
				// AdSense in our fixtures is active but not connected.
				const slug = 'adsense';
				const isConnected = registry.select( STORE_NAME ).isModuleConnected( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isConnected ).toBeUndefined();

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const isConnectedLoaded = registry.select( STORE_NAME ).isModuleConnected( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isConnectedLoaded ).toEqual( false );
			} );

			it( 'returns null if a module does not exist', async () => {
				const slug = 'not-a-real-module';
				const isConnected = registry.select( STORE_NAME ).isModuleConnected( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isConnected ).toBeUndefined();

				// Wait for loading to complete.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				const isConnectedLoaded = registry.select( STORE_NAME ).isModuleConnected( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isConnectedLoaded ).toEqual( null );
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				muteFetch( /^\/google-site-kit\/v1\/core\/modules\/data\/list/, [] );

				const isConnected = registry.select( STORE_NAME ).isModuleConnected( 'analytics' );

				expect( isConnected ).toEqual( undefined );
			} );
		} );

		describe( 'isSettingsOpen', () => {
			it( 'returns true if module is open, false if not', async () => {
				const slug = 'analytics';
				registry.select( STORE_NAME ).getModule( slug );

				let displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );

				expect( displayMode ).not.toEqual( 'view' );
				expect( registry.select( STORE_NAME ).isSettingsOpen( slug ) ).toBe( false );

				registry.dispatch( STORE_NAME ).setSettingsDisplayMode( slug, 'view' );
				displayMode = registry.select( STORE_NAME ).getSettingsDisplayMode( slug );

				expect( displayMode ).toEqual( 'view' );
				expect( registry.select( STORE_NAME ).isSettingsOpen( slug ) ).toBe( true );
			} );
		} );
	} );
} );
