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
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import { STORE_NAME } from './constants';
import FIXTURES from './fixtures.json';

describe( 'core/modules modules', () => {
	const fixturesKeyValue = FIXTURES.reduce( ( acc, module ) => {
		return { ...acc, [ module.slug ]: module };
	}, {} );
	let registry;
	let store;

	beforeEach( () => {
		// Invalidate the cache before every request, but keep it enabled to
		// make sure we're opting-out of the cache for the correct requests.
		API.invalidateCache();

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

				registry.dispatch( STORE_NAME ).activateModule( slug );

				// Wait until this activation action has completed.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.isSettingModuleActivation( slug ) === false
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

				expect( fetchMock ).toHaveFetchedTimes( 3 );
				expect( isActiveAfter ).toEqual( true );
			} );

			it( 'does not update status if the API encountered a failure', async () => {
				// In our fixtures, optimize is off by default.
				const slug = 'optimize';
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
					.isSettingModuleActivation( slug ) === false
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

				// The third request to update the modules shouldn't be called, because the
				// activation request failed.
				expect( fetchMock ).toHaveFetchedTimes( 2 );
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

				fetchMock.post(
					/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
					{ body: { success: true }, status: 200 }
				);

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: responseWithAnalyticsDisabled, status: 200 }
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
				expect( fetchMock ).toHaveFetchedTimes( 3 );
			} );

			it( 'does not update status if the API encountered a failure', async () => {
				// In our fixtures, analytics is on by default.
				const slug = 'analytics';

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

				// The third request to update the modules shouldn't be called, because the
				// deactivation request failed.
				expect( fetchMock ).toHaveFetchedTimes( 2 );
				expect( isActiveAfter ).toEqual( true );
			} );
		} );

		describe( 'fetchModules', () => {
			it( 'does not require any params', () => {
				expect( () => {
					fetchMock.getOnce(
						/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
						{ body: FIXTURES, status: 200 }
					);
					registry.dispatch( STORE_NAME ).fetchModules();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveModules', () => {
			it( 'requires the modules param', () => {
				expect( () => {
					muteConsole( 'error' );
					registry.dispatch( STORE_NAME ).receiveModules();
				} ).toThrow( 'modules is required.' );
			} );

			it( 'receives and sets modules ', async () => {
				const modules = FIXTURES;
				await registry.dispatch( STORE_NAME ).receiveModules( modules );

				const state = store.getState();

				expect( state ).toMatchObject( { modules: fixturesKeyValue } );
			} );
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
				registry.dispatch( STORE_NAME ).receiveModules( FIXTURES );

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
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				// This triggers a network request, so ignore the error.
				muteConsole( 'error' );
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

			// it( 'returns false if a module is not active', async () => {
			// 	// Optimize in our fixtures is not active.
			// 	const slug = 'optimize';
			// 	const isActive = registry.select( STORE_NAME ).isModuleActive( slug );
			// 	// The modules will be undefined whilst loading, so this will return `undefined`.
			// 	expect( isActive ).toEqual( undefined );

			// 	// Wait for loading to complete.
			// 	await subscribeUntil( registry, () => registry
			// 		.select( STORE_NAME )
			// 		.hasFinishedResolution( 'getModules' )
			// 	);

			// 	const isActiveLoaded = registry.select( STORE_NAME ).isModuleActive( slug );

			// 	expect( fetchMock ).toHaveFetchedTimes( 1 );
			// 	expect( isActiveLoaded ).toEqual( false );
			// } );

			// it( 'returns null if a module does not exist', async () => {
			// 	const slug = 'not-a-real-module';
			// 	const isActive = registry.select( STORE_NAME ).isModuleActive( slug );
			// 	// The modules will be undefined whilst loading, so this will return `undefined`.
			// 	expect( isActive ).toEqual( undefined );

			// 	// Wait for loading to complete.
			// 	await subscribeUntil( registry, () => registry
			// 		.select( STORE_NAME )
			// 		.hasFinishedResolution( 'getModules' )
			// 	);

			// 	const isActiveLoaded = registry.select( STORE_NAME ).isModuleActive( slug );

			// 	expect( fetchMock ).toHaveFetchedTimes( 1 );
			// 	expect( isActiveLoaded ).toEqual( null );
			// } );

			// it( 'returns undefined if modules is not yet available', async () => {
			// 	// This triggers a network request, so ignore the error.
			// 	muteConsole( 'error' );
			// 	const isActive = registry.select( STORE_NAME ).isModuleActive( 'analytics' );

			// 	expect( isActive ).toEqual( undefined );
			// } );
		} );
	} );
} );
