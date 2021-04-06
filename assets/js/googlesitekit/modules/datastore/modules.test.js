/**
 * `core/modules` data store: modules tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
	muteFetch,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import { sortByProperty } from '../../../util/sort-by-property';
import { convertArrayListToKeyedObjectMap } from '../../../util/convert-array-to-keyed-object-map';
import { STORE_NAME, ERROR_CODE_INSUFFICIENT_MODULE_DEPENDENCIES } from './constants';
import FIXTURES, { withActive } from './__fixtures__';

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
				await untilResolved( registry, STORE_NAME ).getModules();
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

				await registry.dispatch( STORE_NAME ).activateModule( slug );

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

				await registry.dispatch( STORE_NAME ).activateModule( slug );

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
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'deactivateModule', () => {
			it( 'dispatches a request to deactivate this module', async () => {
				// In our fixtures, analytics is off by default.
				const slug = 'analytics';
				registry.dispatch( STORE_NAME ).receiveGetModules( withActive( slug ) );

				const isActiveBefore = registry.select( STORE_NAME ).isModuleActive( slug );
				expect( isActiveBefore ).toEqual( true );

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
					{ body: { success: true }, status: 200 }
				);

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: withActive(), status: 200 }
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
				expect( fetchMock ).toHaveFetchedTimes( 3 );
			} );

			it( 'does not update status if the API encountered a failure', async () => {
				// In our fixtures, analytics is off by default.
				const slug = 'analytics';
				registry.dispatch( STORE_NAME ).receiveGetModules( withActive( slug ) );

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
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'registerModule', () => {
			const moduleSlug = 'test-module';
			const moduleSettings = {
				name: 'Test Module',
				order: 1,
				description: 'A module for testing',
				homepage: 'https://sitekit.withgoogle.com/',
			};

			beforeEach( () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( [] );
			} );

			it( 'registers a module', () => {
				registry.dispatch( STORE_NAME ).registerModule( moduleSlug, moduleSettings );
				const modules = registry.select( STORE_NAME ).getModules();
				expect( modules[ moduleSlug ] ).not.toBeUndefined();
				expect( modules[ moduleSlug ] ).toMatchObject( moduleSettings );
			} );

			it( 'does not allow active or connected properties to be set to true', () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( FIXTURES );
				registry.dispatch( STORE_NAME ).registerModule( moduleSlug, { active: true, connected: true, ...moduleSettings } );
				const modules = registry.select( STORE_NAME ).getModules();
				expect( modules[ moduleSlug ] ).toMatchObject( { active: false, connected: false } );
			} );

			it( 'does not allow the same module to be registered more than once on the client', () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( [] );

				registry.dispatch( STORE_NAME ).registerModule( 'test-module', { name: 'Original Name' } );

				expect( console ).not.toHaveWarned();

				registry.dispatch( STORE_NAME ).registerModule( 'test-module', { name: 'New Name' } );

				expect( store.getState().clientDefinitions[ 'test-module' ].name ).toBe( 'Original Name' );
				expect( console ).toHaveWarned();
			} );

			it( 'accepts settings components for the module', () => {
				const SettingsViewComponent = () => 'view';
				const SettingsEditComponent = () => 'edit';

				registry.dispatch( STORE_NAME ).registerModule( moduleSlug, {
					SettingsViewComponent,
					SettingsEditComponent,
				} );

				expect( store.getState().clientDefinitions[ moduleSlug ].SettingsViewComponent ).toEqual( SettingsViewComponent );
				expect( store.getState().clientDefinitions[ moduleSlug ].SettingsEditComponent ).toEqual( SettingsEditComponent );
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
					registry.dispatch( STORE_NAME ).receiveGetModules();
				} ).toThrow( 'response is required.' );
			} );

			it( 'receives and sets server definitions', () => {
				const modules = FIXTURES;
				registry.dispatch( STORE_NAME ).receiveGetModules( modules );

				const state = store.getState();

				expect( state.serverDefinitions ).toMatchObject( fixturesKeyValue );
			} );
		} );

		describe( 'receiveCheckRequirementsError', () => {
			it( 'requires the error and slug params', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveCheckRequirementsError();
				} ).toThrow( 'slug is required' );
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveCheckRequirementsError( 'slug' );
				} ).toThrow( 'error is required' );
			} );

			it( 'receives and sets the error', () => {
				const slug = 'slug1';
				const error = { code: 'error_code', message: 'Error Message', data: null };
				const state = { ... store.getState().checkRequirementsResults };
				registry.dispatch( STORE_NAME ).receiveCheckRequirementsError( slug, error );
				expect( store.getState().checkRequirementsResults ).toMatchObject( { ...state, [ slug ]: error } );
			} );
		} );

		describe( 'receiveCheckRequirementsSuccess', () => {
			it( 'requires the slug param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveCheckRequirementsSuccess();
				} ).toThrow( 'slug is required' );
			} );

			it( 'receives and sets success', () => {
				const slug = 'test-module';
				const state = { ... store.getState().checkRequirementsResults };
				registry.dispatch( STORE_NAME ).receiveCheckRequirementsSuccess( slug );
				expect( store.getState().checkRequirementsResults ).toMatchObject( { ...state, [ slug ]: true } );
			} );
		} );
	} );

	describe( 'selectors', () => {
		// We need a module set where one dependency is active, and the other inactive.
		const bootStrapActivateModulesTests = async () => {
			const moduleFixtures =
				[
					{
						slug: 'slug1',
						active: true,
						dependencies: [ ],
						dependants: [
							'slug1dependant',
						],
					},
					{
						slug: 'slug2',
						active: false,
						dependencies: [ ],
						dependants: [
							'slug2dependant',
						],
					},
					{
						slug: 'slug1dependant',
						active: false,
						dependencies: [
							'slug1',
						],
						dependants: [ ],
					},
					{
						slug: 'slug2dependant',
						active: false,
						dependencies: [
							'slug2',
						],
						dependants: [ ],
					},
				];

			fetchMock.getOnce(
				/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
				{ body: moduleFixtures, status: 200 }
			);
			const slug1 = 'slug1';
			const slug2 = 'slug2';
			const slug1Dependant = 'slug1dependant';
			const slug2Dependant = 'slug2dependant';
			registry.dispatch( STORE_NAME ).registerModule( slug1 );
			registry.dispatch( STORE_NAME ).registerModule( slug2 );
			registry.dispatch( STORE_NAME ).registerModule( slug1Dependant );
			registry.dispatch( STORE_NAME ).registerModule( slug2Dependant );

			registry.select( STORE_NAME ).getModule( slug1 );

			// Wait for loading to complete.
			await untilResolved( registry, STORE_NAME ).getModules();
		};

		describe( 'getModules', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);

				const initialModules = registry.select( STORE_NAME ).getModules();
				// The modules info will be its initial value while the modules
				// info is fetched.
				expect( initialModules ).toBeUndefined();
				await untilResolved( registry, STORE_NAME ).getModules();

				const modules = registry.select( STORE_NAME ).getModules();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( modules ).toMatchObject( fixturesKeyValue );
			} );

			it( 'does not make a network request if data is already in state', async () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( FIXTURES );

				const modules = registry.select( STORE_NAME ).getModules();

				await untilResolved( registry, STORE_NAME ).getModules();

				expect( fetchMock ).not.toHaveFetched();
				expect( modules ).toMatchObject( fixturesKeyValue );
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

				registry.select( STORE_NAME ).getModules();

				await untilResolved( registry, STORE_NAME ).getModules();

				expect( console ).toHaveErrored();

				const modules = registry.select( STORE_NAME ).getModules();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( modules ).toBeUndefined();
			} );

			it( 'combines `serverDefinitions` with `clientDefinitions`', () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( [
					{ slug: 'server-module' },
				] );
				registry.dispatch( STORE_NAME ).registerModule( 'client-module' );

				const modules = registry.select( STORE_NAME ).getModules();

				expect( Object.keys( modules ) ).toEqual(
					expect.arrayContaining( [ 'server-module', 'client-module' ] )
				);
			} );

			it( 'merges `serverDefinitions` of the same module with `clientDefinitions`', () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( [
					{ slug: 'test-module', name: 'Server Name' },
				] );
				registry.dispatch( STORE_NAME ).registerModule( 'test-module', { name: 'Client Name' } );

				const modules = registry.select( STORE_NAME ).getModules();

				expect( modules[ 'test-module' ] ).toMatchObject( { name: 'Client Name' } );
			} );

			it( 'does not overwrite `serverDefinitions` of the same module with undefined settings from client registration', () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( [
					{ slug: 'test-module', name: 'Server Name', description: 'Server description' },
				] );
				registry.dispatch( STORE_NAME ).registerModule( 'test-module', { description: 'Client description' } );

				const modules = registry.select( STORE_NAME ).getModules();

				expect( modules[ 'test-module' ] ).toMatchObject( { name: 'Server Name', description: 'Client description' } );
			} );

			it( 'returns an object with keys set in module order', () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( [] );
				registry.dispatch( STORE_NAME ).registerModule( 'second-module', { order: 2 } );
				registry.dispatch( STORE_NAME ).registerModule( 'first-module', { order: 1 } );
				registry.dispatch( STORE_NAME ).registerModule( 'third-module', { order: 3 } );

				const modules = registry.select( STORE_NAME ).getModules();

				expect( Object.keys( modules ) ).toEqual( [ 'first-module', 'second-module', 'third-module' ] );
			} );

			it( 'defaults settings components to `null` if not provided', () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( [] );
				registry.dispatch( STORE_NAME ).registerModule( 'test-module' );

				const module = registry.select( STORE_NAME ).getModule( 'test-module' );

				expect( module.SettingsViewComponent ).toEqual( null );
				expect( module.SettingsEditComponent ).toEqual( null );
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
				expect( module ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, STORE_NAME ).getModules();

				const moduleLoaded = registry.select( STORE_NAME ).getModule( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( moduleLoaded ).toMatchObject( fixturesKeyValue[ slug ] );
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

				registry.select( STORE_NAME ).getModule( slug );

				await untilResolved( registry, STORE_NAME ).getModules();

				const module = registry.select( STORE_NAME ).getModule( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( module ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				// This triggers a network request, so ignore the error.
				muteFetch( /^\/google-site-kit\/v1\/core\/modules\/data\/list/, [] );

				const module = registry.select( STORE_NAME ).getModule( 'analytics' );

				expect( module ).toBeUndefined();
			} );

			it( 'returns null if the module does not exist', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);

				const slug = 'analytics';
				const module = registry.select( STORE_NAME ).getModule( slug );
				// The modules will be undefined whilst loading.
				expect( module ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, STORE_NAME ).getModules();

				const moduleLoaded = registry.select( STORE_NAME ).getModule( 'not-a-real-module' );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( moduleLoaded ).toEqual( null );
			} );
		} );

		describe( 'canActivateModule', () => {
			it.each( [
				[ 'active', 'slug1dependant', true ],
				[ 'inactive', 'slug2dependant', false ],
			] )( 'checks that we can activate modules with an %s dependency', async ( _, slug, expected ) => {
				await bootStrapActivateModulesTests();

				registry.select( STORE_NAME ).canActivateModule( slug );
				await untilResolved( registry, STORE_NAME ).canActivateModule( slug );

				const canActivate = registry.select( STORE_NAME ).canActivateModule( slug );
				expect( canActivate ).toEqual( expected );
			} );
		} );

		describe( 'getCheckRequirementsError', () => {
			it( 'has no error message when we can activate a module', async () => {
				await bootStrapActivateModulesTests();
				const slug = 'slug1dependant';
				registry.select( STORE_NAME ).canActivateModule( slug );
				await untilResolved( registry, STORE_NAME ).canActivateModule( slug );

				const error = registry.select( STORE_NAME ).getCheckRequirementsError( slug );
				expect( error ).toEqual( null );
			} );

			it( 'has an error when we can not activate a module', async () => {
				await bootStrapActivateModulesTests();
				const slug = 'slug2dependant';
				registry.select( STORE_NAME ).canActivateModule( slug );
				await untilResolved( registry, STORE_NAME ).canActivateModule( slug );

				const error = registry.select( STORE_NAME ).getCheckRequirementsError( slug );
				expect( error ).toEqual( {
					code: ERROR_CODE_INSUFFICIENT_MODULE_DEPENDENCIES,
					data: {
						inactiveModules: [ 'slug2' ],
					},
					message: 'You need to set up slug2 to gain access to slug2dependant.',
				} );
			} );
		} );

		describe.each( [
			[ 'getModuleDependencyNames', 'dependencies' ],
			[ 'getModuleDependantNames', 'dependants' ],
		] )( '%s', ( selector, collectionName ) => {
			it( 'returns undefined when no modules are loaded', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'optimize';
				const namesLoaded = registry.select( STORE_NAME )[ selector ]( slug );

				// The modules will be undefined whilst loading.
				expect( namesLoaded ).toBeUndefined();
			} );

			it( `returns ${ collectionName } module names when modules are loaded`, async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'optimize';
				registry.select( STORE_NAME )[ selector ]( slug );

				// Wait for loading to complete.
				await untilResolved( registry, STORE_NAME ).getModules();

				const namesLoaded = registry.select( STORE_NAME )[ selector ]( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( namesLoaded ).toMatchObject( fixturesKeyValue[ slug ][ collectionName ].map( ( key ) => fixturesKeyValue[ key ].name ) );
			} );

			it( `returns an empty array when requesting ${ collectionName } for a non-existent module`, async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'non-existent-slug';
				registry.select( STORE_NAME )[ selector ]( slug );

				// Wait for loading to complete.
				await untilResolved( registry, STORE_NAME ).getModules();

				const namesLoaded = registry.select( STORE_NAME )[ selector ]( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( namesLoaded ).toMatchObject( {} );
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
				expect( isActive ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, STORE_NAME ).getModules();

				const isActiveLoaded = registry.select( STORE_NAME ).isModuleActive( slug );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isActiveLoaded ).toEqual( true );
			} );

			it( 'returns false if a module is not active', async () => {
				// Optimize in our fixtures is not active.
				const slug = 'optimize';
				const isActive = registry.select( STORE_NAME ).isModuleActive( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isActive ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, STORE_NAME ).getModules();

				const isActiveLoaded = registry.select( STORE_NAME ).isModuleActive( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isActiveLoaded ).toEqual( false );
			} );

			it( 'returns null if a module does not exist', async () => {
				const slug = 'not-a-real-module';
				const isActive = registry.select( STORE_NAME ).isModuleActive( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isActive ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, STORE_NAME ).getModules();

				const isActiveLoaded = registry.select( STORE_NAME ).isModuleActive( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isActiveLoaded ).toEqual( null );
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				muteFetch( /^\/google-site-kit\/v1\/core\/modules\/data\/list/, [] );

				const isActive = registry.select( STORE_NAME ).isModuleActive( 'analytics' );

				expect( isActive ).toBeUndefined();
			} );
		} );

		describe( 'isModuleConnected', () => {
			it.each( [
				[ 'true if a module is connected', 'analytics', true, { connected: true } ],
				[ 'false if a module is not active', 'optimize', false, { active: false } ],
				[ 'false if a module is active but not connected', 'adsense', false ],
				[ 'null if a module does not exist', 'not-a-real-module', null ],
			] )( 'should return %s', async ( _, slug, expected, extraData = {} ) => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{
						status: 200,
						body: withActive( slug ).map( ( module ) => module.slug === slug ? { ...module, ...extraData } : module ),
					},
				);

				// The modules will be undefined whilst loading, so this will
				// return `undefined`.
				const isConnected = registry.select( STORE_NAME ).isModuleConnected( slug );
				expect( isConnected ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, STORE_NAME ).getModules();

				const isConnectedLoaded = registry.select( STORE_NAME ).isModuleConnected( slug );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isConnectedLoaded ).toEqual( expected );
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				muteFetch( /^\/google-site-kit\/v1\/core\/modules\/data\/list/, [] );

				const isConnected = registry.select( STORE_NAME ).isModuleConnected( 'analytics' );

				expect( isConnected ).toBeUndefined();
			} );
		} );

		describe( 'getModuleFeatures', () => {
			it( 'returns undefined when no modules are loaded', async () => {
				muteFetch( /^\/google-site-kit\/v1\/core\/modules\/data\/list/, [] );
				const featuresLoaded = registry.select( STORE_NAME ).getModuleFeatures( 'analytics' );

				// The modules will be undefined whilst loading.
				expect( featuresLoaded ).toBeUndefined();
			} );

			it( 'returns features when modules are loaded', async () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( FIXTURES );

				const featuresLoaded = registry.select( STORE_NAME ).getModuleFeatures( 'analytics' );

				expect( featuresLoaded ).toMatchObject( fixturesKeyValue.analytics.features );
			} );

			it( 'returns an empty object when requesting features for a non-existent module', async () => {
				registry.dispatch( STORE_NAME ).receiveGetModules( FIXTURES );

				const featuresLoaded = registry.select( STORE_NAME ).getModuleFeatures( 'non-existent-slug' );

				expect( featuresLoaded ).toMatchObject( {} );
			} );
		} );
	} );
} );
