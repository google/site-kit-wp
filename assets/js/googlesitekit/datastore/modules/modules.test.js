/**
 * core/site data store: modules info tests.
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
import apiFetch from '@wordpress/api-fetch';

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
	let apiFetchSpy;
	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;

		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'actions', () => {
		describe( 'fetchModules', () => {
			it( 'does not require any params', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).fetchModules();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveModules', () => {
			it( 'requires the modules param', () => {
				expect( () => {
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
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/modules\/data\/list/
					)
					.mockResponseOnce(
						JSON.stringify( FIXTURES ),
						{ status: 200 }
					);

				const initialModules = registry.select( STORE_NAME ).getModules();
				// The modules info will be its initial value while the modules
				// info is fetched.
				expect( initialModules ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getModules() !== undefined
					),
				);

				const modules = registry.select( STORE_NAME ).getModules();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( modules ).toEqual( fixturesKeyValue );
			} );

			it( 'does not make a network request if data is already in state', async () => {
				registry.dispatch( STORE_NAME ).receiveModules( FIXTURES );

				const modules = registry.select( STORE_NAME ).getModules();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getModules' )
				);

				expect( fetch ).not.toHaveBeenCalled();
				expect( modules ).toEqual( fixturesKeyValue );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/modules\/data\/list/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getModules();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingModules === false,
				);

				const modules = registry.select( STORE_NAME ).getModules();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( modules ).toEqual( undefined );
			} );
		} );

		describe( 'getModule', () => {
			it( 'uses a resolver get all modules when one is requested', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/modules\/data\/list/
					)
					.mockResponseOnce(
						JSON.stringify( FIXTURES ),
						{ status: 200 }
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

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( moduleLoaded ).toEqual( fixturesKeyValue[ slug ] );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/modules/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				const slug = 'analytics';
				registry.select( STORE_NAME ).getModule( slug );
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingModules === false,
				);

				const module = registry.select( STORE_NAME ).getModule( slug );

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( module ).toEqual( undefined );
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				// This triggers a network request, so ignore the error.
				muteConsole( 'error' );
				const module = registry.select( STORE_NAME ).getModule( 'analytics' );

				expect( module ).toEqual( undefined );
			} );
		} );

		describe( 'isModuleActive', () => {
			beforeEach( () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/modules\/data\/list/
					)
					.mockResponseOnce(
						JSON.stringify( FIXTURES ),
						{ status: 200 }
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

				expect( fetch ).toHaveBeenCalledTimes( 1 );
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

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( isActiveLoaded ).toEqual( false );
			} );

			it( 'returns undefined if a module does not exist', async () => {
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

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( isActiveLoaded ).toEqual( undefined );
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				// This triggers a network request, so ignore the error.
				muteConsole( 'error' );
				const isActive = registry.select( STORE_NAME ).isModuleActive( 'analytics' );

				expect( isActive ).toEqual( undefined );
			} );
		} );
	} );
} );
