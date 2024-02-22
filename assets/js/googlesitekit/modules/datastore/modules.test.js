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
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	unsubscribeFromAll,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { sortByProperty } from '../../../util/sort-by-property';
import { convertArrayListToKeyedObjectMap } from '../../../util/convert-array-to-keyed-object-map';
import {
	CORE_MODULES,
	ERROR_CODE_INSUFFICIENT_MODULE_DEPENDENCIES,
} from './constants';
import FIXTURES, { withActive } from './__fixtures__';
import { MODULES_SEARCH_CONSOLE } from '../../../modules/search-console/datastore/constants';
import { CORE_USER } from '../../datastore/user/constants';
import * as analytics4fixtures from '../../../modules/analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';

describe( 'core/modules modules', () => {
	const dashboardSharingDataBaseVar = '_googlesitekitDashboardSharingData';
	const sharedOwnershipModulesList = {
		sharedOwnershipModules: [
			'analytics-4',
			'search-console',
			'tagmanager',
		],
	};

	const allModules = [
		{
			slug: 'analytics-4',
			name: 'Analytics-4',
			active: true,
			connected: true,
			shareable: true,
			recoverable: true,
			internal: true,
		},
		{
			slug: 'search-console',
			name: 'Search Console',
			active: true,
			connected: true,
			shareable: true,
			recoverable: true,
			internal: false,
		},
		{
			slug: 'tagmanager',
			name: 'Tag Manager',
			active: true,
			connected: true,
			shareable: true,
			recoverable: true,
			internal: false,
		},
	];

	const expectedRecoverableModules = [
		{
			slug: 'search-console',
			name: 'Search Console',
			active: true,
			connected: true,
			shareable: true,
			recoverable: true,
			internal: false,
		},
		{
			slug: 'tagmanager',
			name: 'Tag Manager',
			active: true,
			connected: true,
			shareable: true,
			recoverable: true,
			internal: false,
		},
	];

	const sortedFixtures = sortByProperty( FIXTURES, 'order' );
	const fixturesKeyValue = convertArrayListToKeyedObjectMap(
		sortedFixtures,
		'slug'
	);

	const getModulesBySlugList = ( slugList, modules ) => {
		return Object.values( modules ).reduce(
			( recoverableModules, module ) => {
				if ( slugList.includes( module.slug ) ) {
					return {
						...recoverableModules,
						[ module.slug ]: module,
					};
				}

				return recoverableModules;
			},
			{}
		);
	};

	let registry;
	let store;

	beforeEach( async () => {
		// Invalidate the cache before every request, but keep it enabled to
		// make sure we're opting-out of the cache for the correct requests.
		await API.invalidateCache();

		registry = createTestRegistry();
		store = registry.stores[ CORE_MODULES ].store;
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		delete global[ dashboardSharingDataBaseVar ];
	} );

	describe( 'actions', () => {
		describe( 'activateModule', () => {
			it( 'dispatches a request to activate this module', async () => {
				// In our fixtures, tag manager is off by default.
				const slug = 'tagmanager';
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES }
				);

				// Call a selector that triggers an HTTP request to get the modules.
				registry.select( CORE_MODULES ).isModuleActive( slug );
				// Wait until the modules have been loaded.
				await untilResolved( registry, CORE_MODULES ).getModules();
				const isActiveBefore = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );

				expect( isActiveBefore ).toEqual( false );

				// Activate the module.
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/activation'
					),
					{ body: { success: true } }
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/authentication'
					),
					{ body: {} }
				);

				await registry.dispatch( CORE_MODULES ).activateModule( slug );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/activation'
					),
					{
						body: {
							data: {
								slug,
								active: true,
							},
						},
					}
				);

				// Tag Manager should stay inactive.
				const isActiveAfter = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );

				expect( fetchMock ).toHaveFetchedTimes( 3 );
				expect( isActiveAfter ).toBe( false );
			} );

			it( 'includes the `moduleReauthURL` when activation requires reauthentication', async () => {
				const connectURL = 'http://example.com/connect';
				global._googlesitekitUserData.connectURL = connectURL;
				provideUserAuthentication( registry );
				provideModuleRegistrations( registry );
				provideSiteInfo( registry );
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/activation'
					),
					{ body: { success: true } }
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/authentication'
					),
					{
						body: {
							authenticated: true,
							requiredScopes: [
								'https://www.googleapis.com/auth/analytics.readonly',
							],
							grantedScopes: [],
							unsatisfiedScopes: [
								'https://www.googleapis.com/auth/analytics.readonly',
							],
							needsReauthentication: true,
						},
					}
				);
				fetchMock.get(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: withActive( 'analytics-4' ) }
				);

				const { response } = await registry
					.dispatch( CORE_MODULES )
					.activateModule( 'analytics-4' );

				expect( response.moduleReauthURL ).toContain( connectURL );
				expect(
					response.moduleReauthURL.startsWith( connectURL )
				).toBe( true );
			} );

			it( 'does not update status if the API encountered a failure', async () => {
				// In our fixtures, tag manager is off by default.
				const slug = 'tagmanager';
				registry.dispatch( CORE_MODULES ).receiveGetModules( FIXTURES );

				const isActiveBefore = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );

				expect( isActiveBefore ).toEqual( false );

				// Try to activate the module—this will fail.
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/activation'
					),
					{ body: response, status: 500 }
				);

				await registry.dispatch( CORE_MODULES ).activateModule( slug );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/activation'
					),
					{
						body: {
							data: {
								slug,
								active: true,
							},
						},
					}
				);

				// Tag manager should be active.
				const isActiveAfter = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );

				// The fourth request to update the modules shouldn't be called, because the
				// activation request failed.
				expect( fetchMock ).toHaveBeenCalledTimes( 1 );
				expect( isActiveAfter ).toEqual( false );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'recoverModules', () => {
			it( 'dispatches requests to recover modules', async () => {
				provideModuleRegistrations( registry );
				const slugs = [ 'analytics-4', 'tagmanager' ];

				const recoverModulesResponse = {
					success: {
						'analytics-4': true,
						tagmanager: true,
					},
					error: {},
				};

				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{
						body: [ ...FIXTURES, ...allModules ],
						status: 200,
					}
				);
				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/recover-modules'
					),
					{ body: recoverModulesResponse }
				);

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/settings'
					),
					{
						body: getModulesBySlugList( [ slugs ], FIXTURES ),
						status: 200,
					}
				);

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/settings'
					),
					{
						body: getModulesBySlugList( [ slugs ], FIXTURES ),
						status: 200,
					}
				);

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/permissions'
					),
					{
						body: {},
						status: 200,
					}
				);

				const initialModules = registry
					.select( CORE_MODULES )
					.getModules();
				// The modules info will be its initial value while the modules
				// info is fetched.
				expect( initialModules ).toBeUndefined();
				await untilResolved( registry, CORE_MODULES ).getModules();

				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{
						body: [
							...FIXTURES,
							{
								slug: 'analytics-4',
								name: 'Analytics',
								active: true,
								connected: true,
								shareable: true,
								recoverable: false,
								storeName: 'modules/analytics-4',
							},
							{
								slug: 'search-console',
								name: 'Search Console',
								active: true,
								connected: true,
								shareable: true,
								recoverable: true,
								storeName: 'modules/search-console',
							},
							{
								slug: 'tagmanager',
								name: 'Tag Manager',
								active: true,
								connected: true,
								shareable: true,
								recoverable: false,
								storeName: 'modules/tagmanager',
							},
						],
						status: 200,
					}
				);

				const { response } = await registry
					.dispatch( CORE_MODULES )
					.recoverModules( slugs );

				expect( response.success ).toStrictEqual( {
					'analytics-4': true,
					tagmanager: true,
				} );

				expect( fetchMock ).toHaveFetchedTimes( 6 );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/recover-modules'
					),
					{
						body: {
							data: {
								slugs: [ 'analytics-4', 'tagmanager' ],
							},
						},
					}
				);

				// Ensure fetchGetSettings have been called.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/settings'
					),
					{
						body: {
							data: {
								slug: 'analytics-4',
							},
						},
					}
				);

				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/settings'
					),
					{
						body: {
							data: {
								slug: 'tagmanager',
							},
						},
					}
				);

				// Ensure fetchGetModules have been called.
				expect( fetchMock ).toHaveFetched(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' )
				);

				// Ensure `refreshCapabilities` has been called.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/permissions'
					)
				);

				const initialRecoverableModules = registry
					.select( CORE_MODULES )
					.getRecoverableModules();
				expect( initialRecoverableModules ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_MODULES
				).getRecoverableModules();

				// Ensure the module has been removed from the recoverable modules list.
				const recoverableModules = registry
					.select( CORE_MODULES )
					.getRecoverableModules();

				expect( Object.keys( recoverableModules ) ).toEqual( [
					'search-console',
				] );
			} );

			it( 'encounters an error if the any module is not recoverable', async () => {
				provideModuleRegistrations( registry );
				const slugs = [ 'analytics-4', 'tagmanager' ];

				const recoverModulesResponse = {
					success: {
						'analytics-4': true,
						tagmanager: false,
					},
					error: {
						tagmanager: {
							code: 'module_not_recoverable',
							message: 'Module is not recoverable.',
							data: { status: 403 },
						},
					},
				};

				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{
						body: [ ...FIXTURES, ...allModules ],
						status: 200,
					}
				);

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/recover-modules'
					),
					{ body: recoverModulesResponse, status: 200 }
				);

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/settings'
					),
					{
						body: getModulesBySlugList( [ slugs ], FIXTURES ),
						status: 200,
					}
				);

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/permissions'
					),
					{
						body: {},
						status: 200,
					}
				);

				const initialModules = registry
					.select( CORE_MODULES )
					.getModules();
				// The modules info will be its initial value while the modules
				// info is fetched.
				expect( initialModules ).toBeUndefined();
				await untilResolved( registry, CORE_MODULES ).getModules();

				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{
						body: [
							...FIXTURES,
							{
								slug: 'analytics-4',
								name: 'Analytics',
								active: true,
								connected: true,
								shareable: true,
								recoverable: false,
								storeName: 'modules/analytics-4',
							},
							{
								slug: 'search-console',
								name: 'Search Console',
								active: true,
								connected: true,
								shareable: true,
								recoverable: true,
								storeName: 'modules/search-console',
							},
							{
								slug: 'tagmanager',
								name: 'Tag Manager',
								active: true,
								connected: true,
								shareable: true,
								recoverable: true,
								storeName: 'modules/tagmanager',
							},
						],
						status: 200,
					}
				);

				const { response } = await registry
					.dispatch( CORE_MODULES )
					.recoverModules( slugs );

				expect( response.success ).toStrictEqual( {
					'analytics-4': true,
					tagmanager: false,
				} );
				expect( response.error.tagmanager.message ).toBe(
					recoverModulesResponse.error.tagmanager.message
				);

				expect( fetchMock ).toHaveFetchedTimes( 5 );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/recover-modules'
					),
					{
						body: {
							data: {
								slugs: [ 'analytics-4', 'tagmanager' ],
							},
						},
					}
				);

				// Ensure fetchGetSettings has been called for Analytics.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/settings'
					),
					{
						body: {
							data: {
								slug: 'analytics-4',
							},
						},
					}
				);

				// Ensure fetchGetSettings haven't been called for Tag Manager.
				expect( fetchMock ).not.toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/settings'
					),
					{
						body: {
							data: {
								slug: 'tagmanager',
							},
						},
					}
				);

				// Ensure fetchGetModules have been called.
				expect( fetchMock ).toHaveFetched(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' )
				);

				const initialRecoverableModules = registry
					.select( CORE_MODULES )
					.getRecoverableModules();
				expect( initialRecoverableModules ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_MODULES
				).getRecoverableModules();

				// Ensure the module has been removed from the recoverable modules list.
				const recoverableModules = registry
					.select( CORE_MODULES )
					.getRecoverableModules();

				expect( Object.keys( recoverableModules ) ).toEqual( [
					'search-console',
					'tagmanager',
				] );
			} );
		} );

		describe( 'deactivateModule', () => {
			it( 'dispatches a request to deactivate this module', async () => {
				// In our fixtures, analytics is off by default.
				const slug = 'analytics-4';
				registry
					.dispatch( CORE_MODULES )
					.receiveGetModules( withActive( slug ) );

				const isActiveBefore = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );
				expect( isActiveBefore ).toEqual( true );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/activation'
					),
					{ body: { success: true }, status: 200 }
				);

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/authentication'
					),
					{ body: {}, status: 200 }
				);

				await registry
					.dispatch( CORE_MODULES )
					.deactivateModule( slug );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/activation'
					),
					{
						body: {
							data: {
								slug,
								active: false,
							},
						},
					}
				);

				// Analytics should stay active.
				const isActiveAfter = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );
				expect( isActiveAfter ).toBe( true );
				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it( 'does not update status if the API encountered a failure', async () => {
				// In our fixtures, analytics is off by default.
				const slug = 'analytics-4';
				registry
					.dispatch( CORE_MODULES )
					.receiveGetModules( withActive( slug ) );

				const isActiveBefore = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );
				expect( isActiveBefore ).toEqual( true );

				// Try to deactivate the module—this will fail.
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/activation'
					),
					{ body: response, status: 500 }
				);

				await registry
					.dispatch( CORE_MODULES )
					.deactivateModule( slug );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/activation'
					),
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
				const isActiveAfter = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );

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
				registry.dispatch( CORE_MODULES ).receiveGetModules( [] );
			} );

			it( 'registers a module', () => {
				registry
					.dispatch( CORE_MODULES )
					.registerModule( moduleSlug, moduleSettings );
				const modules = registry.select( CORE_MODULES ).getModules();
				expect( modules[ moduleSlug ] ).not.toBeUndefined();
				expect( modules[ moduleSlug ] ).toMatchObject( moduleSettings );
			} );

			it( 'does not allow active or connected properties to be set to true', () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( FIXTURES );
				registry.dispatch( CORE_MODULES ).registerModule( moduleSlug, {
					active: true,
					connected: true,
					...moduleSettings,
				} );
				const modules = registry.select( CORE_MODULES ).getModules();
				expect( modules[ moduleSlug ] ).toMatchObject( {
					active: false,
					connected: false,
				} );
			} );

			it( 'does not allow the same module to be registered more than once on the client', () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [] );

				registry
					.dispatch( CORE_MODULES )
					.registerModule( 'test-module', { name: 'Original Name' } );

				expect( console ).not.toHaveWarned();

				registry
					.dispatch( CORE_MODULES )
					.registerModule( 'test-module', { name: 'New Name' } );

				expect(
					store.getState().clientDefinitions[ 'test-module' ].name
				).toBe( 'Original Name' );
				expect( console ).toHaveWarned();
			} );

			it( 'accepts settings components for the module', () => {
				const SettingsViewComponent = () => 'view';
				const SettingsEditComponent = () => 'edit';

				registry.dispatch( CORE_MODULES ).registerModule( moduleSlug, {
					SettingsViewComponent,
					SettingsEditComponent,
				} );

				expect(
					store.getState().clientDefinitions[ moduleSlug ]
						.SettingsViewComponent
				).toEqual( SettingsViewComponent );
				expect(
					store.getState().clientDefinitions[ moduleSlug ]
						.SettingsEditComponent
				).toEqual( SettingsEditComponent );
			} );
		} );

		describe( 'fetchGetModules', () => {
			it( 'does not require any params', () => {
				expect( () => {
					muteFetch(
						new RegExp(
							'^/google-site-kit/v1/core/modules/data/list'
						),
						[]
					);
					registry.dispatch( CORE_MODULES ).fetchGetModules();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveGetModules', () => {
			it( 'requires the response param', () => {
				expect( () => {
					registry.dispatch( CORE_MODULES ).receiveGetModules();
				} ).toThrow( 'response is required.' );
			} );

			it( 'receives and sets server definitions', () => {
				const modules = FIXTURES;
				registry.dispatch( CORE_MODULES ).receiveGetModules( modules );

				const state = store.getState();

				expect( state.serverDefinitions ).toMatchObject(
					fixturesKeyValue
				);
			} );
		} );

		describe( 'receiveCheckRequirementsError', () => {
			it( 'requires the error and slug params', () => {
				expect( () => {
					registry
						.dispatch( CORE_MODULES )
						.receiveCheckRequirementsError();
				} ).toThrow( 'slug is required' );
				expect( () => {
					registry
						.dispatch( CORE_MODULES )
						.receiveCheckRequirementsError( 'slug' );
				} ).toThrow( 'error is required' );
			} );

			it( 'receives and sets the error', () => {
				const slug = 'slug1';
				const error = {
					code: 'error_code',
					message: 'Error Message',
					data: null,
				};
				const state = { ...store.getState().checkRequirementsResults };
				registry
					.dispatch( CORE_MODULES )
					.receiveCheckRequirementsError( slug, error );
				expect(
					store.getState().checkRequirementsResults
				).toMatchObject( { ...state, [ slug ]: error } );
			} );
		} );

		describe( 'receiveCheckRequirementsSuccess', () => {
			it( 'requires the slug param', () => {
				expect( () => {
					registry
						.dispatch( CORE_MODULES )
						.receiveCheckRequirementsSuccess();
				} ).toThrow( 'slug is required' );
			} );

			it( 'receives and sets success', () => {
				const slug = 'test-module';
				const state = { ...store.getState().checkRequirementsResults };
				registry
					.dispatch( CORE_MODULES )
					.receiveCheckRequirementsSuccess( slug );
				expect(
					store.getState().checkRequirementsResults
				).toMatchObject( { ...state, [ slug ]: true } );
			} );
		} );

		describe( 'receiveCheckModuleAccess', () => {
			it( 'requires the response param', () => {
				expect( () => {
					registry
						.dispatch( CORE_MODULES )
						.receiveCheckModuleAccess();
				} ).toThrow( 'response is required.' );
			} );

			it( 'requires the `params` param', () => {
				expect( () => {
					registry
						.dispatch( CORE_MODULES )
						.receiveCheckModuleAccess( { access: true } );
				} ).toThrow( 'params is required.' );
			} );

			it( 'receives and sets module access state', () => {
				registry
					.dispatch( CORE_MODULES )
					.receiveCheckModuleAccess(
						{ access: true },
						{ slug: 'search-console' }
					);

				const state = store.getState();

				expect( state.moduleAccess ).toMatchObject( {
					'search-console': true,
				} );
			} );
		} );

		describe( 'receiveSharedOwnershipModules', () => {
			it( 'requires the sharedOwnershipModules param', () => {
				expect( () => {
					registry
						.dispatch( CORE_MODULES )
						.receiveSharedOwnershipModules();
				} ).toThrow( 'sharedOwnershipModules is required' );
			} );

			it( 'receives sharedOwnershipModules and sets it to the state', () => {
				registry
					.dispatch( CORE_MODULES )
					.receiveSharedOwnershipModules(
						sharedOwnershipModulesList.sharedOwnershipModules
					);

				expect( store.getState().sharedOwnershipModules ).toMatchObject(
					sharedOwnershipModulesList.sharedOwnershipModules
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		// We need a module set where one dependency is active, and the other inactive.
		const bootStrapActivateModulesTests = async () => {
			const moduleFixtures = [
				{
					slug: 'slug1',
					active: true,
					dependencies: [],
					dependants: [ 'slug1dependant' ],
				},
				{
					slug: 'slug2',
					active: false,
					dependencies: [],
					dependants: [ 'slug2dependant' ],
				},
				{
					slug: 'slug1dependant',
					active: false,
					dependencies: [ 'slug1' ],
					dependants: [],
				},
				{
					slug: 'slug2dependant',
					active: false,
					dependencies: [ 'slug2' ],
					dependants: [],
				},
			];

			fetchMock.getOnce(
				new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
				{ body: moduleFixtures, status: 200 }
			);
			const slug1 = 'slug1';
			const slug2 = 'slug2';
			const slug1Dependant = 'slug1dependant';
			const slug2Dependant = 'slug2dependant';
			registry.dispatch( CORE_MODULES ).registerModule( slug1 );
			registry.dispatch( CORE_MODULES ).registerModule( slug2 );
			registry.dispatch( CORE_MODULES ).registerModule( slug1Dependant );
			registry.dispatch( CORE_MODULES ).registerModule( slug2Dependant );

			registry.select( CORE_MODULES ).getModule( slug1 );

			// Wait for loading to complete.
			await untilResolved( registry, CORE_MODULES ).getModules();
		};

		describe( 'getModules', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);

				const initialModules = registry
					.select( CORE_MODULES )
					.getModules();
				// The modules info will be its initial value while the modules
				// info is fetched.
				expect( initialModules ).toBeUndefined();
				await untilResolved( registry, CORE_MODULES ).getModules();

				const modules = registry.select( CORE_MODULES ).getModules();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( modules ).toMatchObject( fixturesKeyValue );
			} );

			it( 'does not make a network request if data is already in state', async () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( FIXTURES );

				const modules = registry.select( CORE_MODULES ).getModules();

				await untilResolved( registry, CORE_MODULES ).getModules();

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
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: response, status: 500 }
				);

				registry.select( CORE_MODULES ).getModules();

				await untilResolved( registry, CORE_MODULES ).getModules();

				expect( console ).toHaveErrored();

				const modules = registry.select( CORE_MODULES ).getModules();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( modules ).toBeUndefined();
			} );

			it( 'combines `serverDefinitions` with `clientDefinitions`', () => {
				registry
					.dispatch( CORE_MODULES )
					.receiveGetModules( [ { slug: 'server-module' } ] );
				registry
					.dispatch( CORE_MODULES )
					.registerModule( 'client-module' );

				const modules = registry.select( CORE_MODULES ).getModules();

				expect( Object.keys( modules ) ).toEqual(
					expect.arrayContaining( [
						'server-module',
						'client-module',
					] )
				);
			} );

			it( 'merges `serverDefinitions` of the same module with `clientDefinitions`', () => {
				registry
					.dispatch( CORE_MODULES )
					.receiveGetModules( [
						{ slug: 'test-module', name: 'Server Name' },
					] );
				registry
					.dispatch( CORE_MODULES )
					.registerModule( 'test-module', { name: 'Client Name' } );

				const modules = registry.select( CORE_MODULES ).getModules();

				expect( modules[ 'test-module' ] ).toMatchObject( {
					name: 'Client Name',
				} );
			} );

			it( 'does not overwrite `serverDefinitions` of the same module with undefined settings from client registration', () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'test-module',
						name: 'Server Name',
						description: 'Server description',
					},
				] );
				registry
					.dispatch( CORE_MODULES )
					.registerModule( 'test-module', {
						description: 'Client description',
					} );

				const modules = registry.select( CORE_MODULES ).getModules();

				expect( modules[ 'test-module' ] ).toMatchObject( {
					name: 'Server Name',
					description: 'Client description',
				} );
			} );

			it( 'returns an object with keys set in module order', () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [] );
				registry
					.dispatch( CORE_MODULES )
					.registerModule( 'second-module', { order: 2 } );
				registry
					.dispatch( CORE_MODULES )
					.registerModule( 'first-module', { order: 1 } );
				registry
					.dispatch( CORE_MODULES )
					.registerModule( 'third-module', { order: 3 } );

				const modules = registry.select( CORE_MODULES ).getModules();

				expect( Object.keys( modules ) ).toEqual( [
					'first-module',
					'second-module',
					'third-module',
				] );
			} );

			it( 'defaults settings components to `null` if not provided', () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [] );
				registry
					.dispatch( CORE_MODULES )
					.registerModule( 'test-module' );

				const module = registry
					.select( CORE_MODULES )
					.getModule( 'test-module' );

				expect( module.SettingsViewComponent ).toEqual( null );
				expect( module.SettingsEditComponent ).toEqual( null );
			} );
		} );

		describe( 'getModule', () => {
			it( 'uses a resolver get all modules when one is requested', async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'analytics-4';
				const module = registry
					.select( CORE_MODULES )
					.getModule( slug );

				// The modules will be undefined whilst loading.
				expect( module ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, CORE_MODULES ).getModules();

				const moduleLoaded = registry
					.select( CORE_MODULES )
					.getModule( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( moduleLoaded ).toMatchObject(
					fixturesKeyValue[ slug ]
				);
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				const slug = 'analytics-4';

				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: response, status: 500 }
				);

				registry.select( CORE_MODULES ).getModule( slug );

				await untilResolved( registry, CORE_MODULES ).getModules();

				const module = registry
					.select( CORE_MODULES )
					.getModule( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( module ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				// This triggers a network request, so ignore the error.
				muteFetch(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					[]
				);

				const module = registry
					.select( CORE_MODULES )
					.getModule( 'analytics-4' );

				expect( module ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();
			} );

			it( 'returns null if the module does not exist', async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);

				const slug = 'analytics-4';
				const module = registry
					.select( CORE_MODULES )
					.getModule( slug );
				// The modules will be undefined whilst loading.
				expect( module ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, CORE_MODULES ).getModules();

				const moduleLoaded = registry
					.select( CORE_MODULES )
					.getModule( 'not-a-real-module' );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( moduleLoaded ).toEqual( null );
			} );
		} );

		describe( 'canActivateModule', () => {
			it.each( [
				[ 'active', 'slug1dependant', true ],
				[ 'inactive', 'slug2dependant', false ],
			] )(
				'checks that we can activate modules with an %s dependency',
				async ( _, slug, expected ) => {
					await bootStrapActivateModulesTests();

					registry.select( CORE_MODULES ).canActivateModule( slug );
					await untilResolved(
						registry,
						CORE_MODULES
					).canActivateModule( slug );

					const canActivate = registry
						.select( CORE_MODULES )
						.canActivateModule( slug );
					expect( canActivate ).toEqual( expected );
				}
			);
		} );

		describe( 'getCheckRequirementsError', () => {
			it( 'has no error message when we can activate a module', async () => {
				await bootStrapActivateModulesTests();
				const slug = 'slug1dependant';
				registry.select( CORE_MODULES ).canActivateModule( slug );
				await untilResolved( registry, CORE_MODULES ).canActivateModule(
					slug
				);

				const error = registry
					.select( CORE_MODULES )
					.getCheckRequirementsError( slug );
				expect( error ).toEqual( null );
			} );

			it( 'has an error when we can not activate a module', async () => {
				await bootStrapActivateModulesTests();
				const slug = 'slug2dependant';
				registry.select( CORE_MODULES ).canActivateModule( slug );
				await untilResolved( registry, CORE_MODULES ).canActivateModule(
					slug
				);

				const error = registry
					.select( CORE_MODULES )
					.getCheckRequirementsError( slug );
				expect( error ).toEqual( {
					code: ERROR_CODE_INSUFFICIENT_MODULE_DEPENDENCIES,
					data: {
						inactiveModules: [ 'slug2' ],
					},
					message:
						'You need to set up slug2 to gain access to slug2dependant.',
				} );
			} );
		} );

		describe.each( [
			[ 'getModuleDependencyNames', 'dependencies' ],
			[ 'getModuleDependantNames', 'dependants' ],
		] )( '%s', ( selector, collectionName ) => {
			it( 'returns undefined when no modules are loaded', async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'tagmanager';
				const namesLoaded = registry
					.select( CORE_MODULES )
					[ selector ]( slug );

				// The modules will be undefined whilst loading.
				expect( namesLoaded ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();
			} );

			it( `returns ${ collectionName } module names when modules are loaded`, async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'tagmanager';
				registry.select( CORE_MODULES )[ selector ]( slug );

				// Wait for loading to complete.
				await untilResolved( registry, CORE_MODULES ).getModules();

				const namesLoaded = registry
					.select( CORE_MODULES )
					[ selector ]( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( namesLoaded ).toMatchObject(
					fixturesKeyValue[ slug ][ collectionName ].map(
						( key ) => fixturesKeyValue[ key ].name
					)
				);
			} );

			it( `returns an empty array when requesting ${ collectionName } for a non-existent module`, async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);
				const slug = 'non-existent-slug';
				registry.select( CORE_MODULES )[ selector ]( slug );

				// Wait for loading to complete.
				await untilResolved( registry, CORE_MODULES ).getModules();

				const namesLoaded = registry
					.select( CORE_MODULES )
					[ selector ]( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( namesLoaded ).toMatchObject( {} );
			} );
		} );

		describe( 'isModuleAvailable', () => {
			beforeEach( () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{
						body: FIXTURES.filter(
							( { slug } ) => slug !== 'analytics-4'
						),
						status: 200,
					}
				);
			} );

			it( 'returns true if a module is available', async () => {
				// Search console is available in our fixtures.
				const slug = 'search-console';
				const isAvailable = registry
					.select( CORE_MODULES )
					.isModuleAvailable( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isAvailable ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, CORE_MODULES ).getModules();

				const isAvailableLoaded = registry
					.select( CORE_MODULES )
					.isModuleAvailable( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isAvailableLoaded ).toEqual( true );
			} );

			it( 'returns false if a module is not available', async () => {
				const slug = 'analytics-4';
				const isAvailable = registry
					.select( CORE_MODULES )
					.isModuleAvailable( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isAvailable ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, CORE_MODULES ).getModules();

				const isAvailableLoaded = registry
					.select( CORE_MODULES )
					.isModuleAvailable( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isAvailableLoaded ).toEqual( false );
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				muteFetch(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					[]
				);

				const isAvailable = registry
					.select( CORE_MODULES )
					.isModuleAvailable( 'analytics-4' );

				expect( isAvailable ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();
			} );
		} );

		describe( 'isModuleActive', () => {
			beforeEach( () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);
			} );

			it( 'returns true if a module is active', async () => {
				// Search console is active in our fixtures.
				const slug = 'search-console';
				const isActive = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isActive ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, CORE_MODULES ).getModules();

				const isActiveLoaded = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isActiveLoaded ).toEqual( true );
			} );

			it( 'returns false if a module is not active', async () => {
				// Tag manager in our fixtures is not active.
				const slug = 'tagmanager';
				const isActive = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isActive ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, CORE_MODULES ).getModules();

				const isActiveLoaded = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isActiveLoaded ).toEqual( false );
			} );

			it( 'returns null if a module does not exist', async () => {
				const slug = 'not-a-real-module';
				const isActive = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );
				// The modules will be undefined whilst loading, so this will return `undefined`.
				expect( isActive ).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved( registry, CORE_MODULES ).getModules();

				const isActiveLoaded = registry
					.select( CORE_MODULES )
					.isModuleActive( slug );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( isActiveLoaded ).toEqual( null );
			} );

			it( 'returns undefined if modules is not yet available', async () => {
				muteFetch(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					[]
				);

				const isActive = registry
					.select( CORE_MODULES )
					.isModuleActive( 'analytics-4' );

				expect( isActive ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();
			} );
		} );

		describe( 'isModuleConnected', () => {
			it.each( [
				[
					'true if a module is connected',
					'analytics-4',
					true,
					{ connected: true },
				],
				[
					'false if a module is not active',
					'tagmanager',
					false,
					{ active: false },
				],
				[
					'false if a module is active but not connected',
					'adsense',
					false,
				],
				[
					'null if a module does not exist',
					'not-a-real-module',
					null,
				],
			] )(
				'should return %s',
				async ( _, slug, expected, extraData = {} ) => {
					fetchMock.getOnce(
						new RegExp(
							'^/google-site-kit/v1/core/modules/data/list'
						),
						{
							status: 200,
							body: withActive( slug ).map( ( module ) =>
								module.slug === slug
									? { ...module, ...extraData }
									: module
							),
						}
					);

					// The modules will be undefined whilst loading, so this will
					// return `undefined`.
					const isConnected = registry
						.select( CORE_MODULES )
						.isModuleConnected( slug );
					expect( isConnected ).toBeUndefined();

					// Wait for loading to complete.
					await untilResolved( registry, CORE_MODULES ).getModules();

					const isConnectedLoaded = registry
						.select( CORE_MODULES )
						.isModuleConnected( slug );
					expect( fetchMock ).toHaveFetchedTimes( 1 );
					expect( isConnectedLoaded ).toEqual( expected );
				}
			);

			it( 'returns undefined if modules is not yet available', async () => {
				muteFetch(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					[]
				);

				const isConnected = registry
					.select( CORE_MODULES )
					.isModuleConnected( 'analytics-4' );

				expect( isConnected ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();
			} );
		} );

		describe( 'getModuleFeatures', () => {
			it( 'returns undefined when no modules are loaded', async () => {
				muteFetch(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					[]
				);
				const featuresLoaded = registry
					.select( CORE_MODULES )
					.getModuleFeatures( 'analytics-4' );

				// The modules will be undefined whilst loading.
				expect( featuresLoaded ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();
			} );

			it( 'returns features when modules are loaded', () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( FIXTURES );

				const featuresLoaded = registry
					.select( CORE_MODULES )
					.getModuleFeatures( 'analytics-4' );

				expect( featuresLoaded ).toMatchObject(
					fixturesKeyValue[ 'analytics-4' ].features
				);
			} );

			it( 'returns an empty object when requesting features for a non-existent module', () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( FIXTURES );

				const featuresLoaded = registry
					.select( CORE_MODULES )
					.getModuleFeatures( 'non-existent-slug' );

				expect( featuresLoaded ).toMatchObject( {} );
			} );
		} );

		describe( 'hasModuleAccess', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/check-access'
					),
					{ body: { access: true } }
				);

				let moduleAccess;

				moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleAccess( 'search-console' );

				// The modules info will be its initial value while the modules info is fetched.
				expect( moduleAccess ).toBeUndefined();
				await untilResolved( registry, CORE_MODULES ).hasModuleAccess(
					'search-console'
				);

				moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleAccess( 'search-console' );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( moduleAccess ).toBe( true );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/check-access'
					),
					{ body: response, status: 500 }
				);

				registry
					.select( CORE_MODULES )
					.hasModuleAccess( 'search-console' );

				await untilResolved( registry, CORE_MODULES ).hasModuleAccess(
					'search-console'
				);

				const moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleAccess( 'search-console' );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( moduleAccess ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'should return undefined if module access is not resolved yet', async () => {
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/check-access'
					),
					{ body: { access: true } }
				);

				const moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleAccess( 'search-console' );

				expect( moduleAccess ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).hasModuleAccess(
					'search-console'
				);
			} );
		} );

		describe( 'hasModuleOwnershipOrAccess', () => {
			it( 'should return undefined if `getModules` is not resolved yet', async () => {
				muteFetch(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					[]
				);

				const moduleStoreName = registry
					.select( CORE_MODULES )
					.getModuleStoreName( 'search-console' );

				expect( moduleStoreName ).toBeUndefined();

				const moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleOwnershipOrAccess( 'search-console' );

				expect( moduleAccess ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();
			} );

			it( 'should return undefined if `moduleOwnerID` is not resolved yet', async () => {
				provideModules( registry );
				provideModuleRegistrations( registry );
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/search-console/data/settings'
					),
					{
						body: {
							ownerID: 1,
						},
					}
				);

				const moduleOwnerID = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getOwnerID();

				expect( moduleOwnerID ).toBeUndefined();

				const moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleOwnershipOrAccess( 'search-console' );

				expect( moduleAccess ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getSettings();
			} );

			it( 'should return undefined if `getID` is not resolved yet', () => {
				provideModules( registry );
				provideModuleRegistrations( registry );
				registry.dispatch( MODULES_SEARCH_CONSOLE ).setOwnerID( 1 );

				const loggedInUserID = registry.select( CORE_USER ).getID();

				expect( loggedInUserID ).toBeUndefined();

				const moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleOwnershipOrAccess( 'search-console' );

				expect( moduleAccess ).toBeUndefined();
			} );

			it( 'should return true if `moduleOwnerID` and `loggedInUserID` are equal', () => {
				provideModules( registry );
				provideModuleRegistrations( registry );
				provideUserInfo( registry, { id: 1 } );
				registry.dispatch( MODULES_SEARCH_CONSOLE ).setOwnerID( 1 );

				const moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleOwnershipOrAccess( 'search-console' );

				expect( moduleAccess ).toBe( true );
			} );

			it( 'should return false if access check is false when `moduleOwnerID` and `loggedInUserID` are not equal', async () => {
				provideModules( registry );
				provideModuleRegistrations( registry );
				provideUserInfo( registry, { id: 1 } );
				registry.dispatch( MODULES_SEARCH_CONSOLE ).setOwnerID( 2 );
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/check-access'
					),
					{ body: { access: false } }
				);

				let moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleOwnershipOrAccess( 'search-console' );

				expect( moduleAccess ).toBe( undefined );

				await untilResolved( registry, CORE_MODULES ).hasModuleAccess(
					'search-console'
				);

				moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleOwnershipOrAccess( 'search-console' );

				expect( moduleAccess ).toBe( false );
			} );

			it( 'should return false if the module store cannot be found', () => {
				provideModules( registry );
				provideModuleRegistrations( registry );
				provideUserInfo( registry );

				const moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleOwnershipOrAccess( 'not-a-module' );

				expect( moduleAccess ).toBe( false );
			} );

			it( 'should request the check-access endpoint if `moduleOwnerID` and `loggedInUserID` are not equal', async () => {
				provideModules( registry );
				provideModuleRegistrations( registry );
				provideUserInfo( registry, { id: 1 } );
				registry.dispatch( MODULES_SEARCH_CONSOLE ).setOwnerID( 2 );
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/modules/data/check-access'
					),
					{ body: { access: true } }
				);

				// `hasModuleAccess` not resolved yet.
				let moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleOwnershipOrAccess( 'search-console' );

				expect( moduleAccess ).toBe( undefined );

				await untilResolved( registry, CORE_MODULES ).hasModuleAccess(
					'search-console'
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				// `hasModuleAccess` resolved.
				moduleAccess = registry
					.select( CORE_MODULES )
					.hasModuleOwnershipOrAccess( 'search-console' );

				expect( moduleAccess ).toBe( true );
			} );
		} );

		describe( 'getRecoverableModules', () => {
			it( 'should return undefined if the call to retrieve modules fails', async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: {}, status: 400 }
				);

				const initialRecoverableModules = registry
					.select( CORE_MODULES )
					.getRecoverableModules();
				expect( initialRecoverableModules ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_MODULES
				).getRecoverableModules();

				const recoverableModules = registry
					.select( CORE_MODULES )
					.getRecoverableModules();

				expect( console ).toHaveErrored();
				expect( recoverableModules ).toBeUndefined();
			} );

			it( 'should return an empty object if there are no recoverable modules', async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);

				const initialRecoverableModules = registry
					.select( CORE_MODULES )
					.getRecoverableModules();
				expect( initialRecoverableModules ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_MODULES
				).getRecoverableModules();

				const recoverableModules = registry
					.select( CORE_MODULES )
					.getRecoverableModules();

				expect( recoverableModules ).toMatchObject( {} );
			} );

			it( 'should return the modules object for each recoverable module', async () => {
				provideModuleRegistrations( registry );
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{
						body: [ ...FIXTURES, ...allModules ],
						status: 200,
					}
				);

				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/settings'
					)
				);

				const initialRecoverableModules = registry
					.select( CORE_MODULES )
					.getRecoverableModules();
				expect( initialRecoverableModules ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_MODULES
				).getRecoverableModules();

				const recoverableModules = registry
					.select( CORE_MODULES )
					.getRecoverableModules();

				expect( recoverableModules ).toMatchObject(
					convertArrayListToKeyedObjectMap(
						expectedRecoverableModules,
						'slug'
					)
				);
			} );
		} );

		describe( 'getSharedOwnershipModules', () => {
			it( 'should return undefined if `sharedOwnershipModules` cannot be loaded', async () => {
				global[ dashboardSharingDataBaseVar ] = undefined;

				provideModules( registry, FIXTURES );

				const sharedOwnershipModules = registry
					.select( CORE_MODULES )
					.getSharedOwnershipModules();

				await untilResolved( registry, CORE_MODULES ).getModules();

				expect( console ).toHaveErrored();
				expect( sharedOwnershipModules ).toBeUndefined();
			} );

			it( 'should return undefined if `modules` list cannot be loaded', async () => {
				global[ dashboardSharingDataBaseVar ] =
					sharedOwnershipModulesList;

				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);

				registry.select( CORE_MODULES ).getSharedOwnershipModules();

				const modules = registry.select( CORE_MODULES ).getModules();

				expect( modules ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();
			} );

			it( 'should return an empty object if there is no `sharedOwnershipModules`', async () => {
				global[ dashboardSharingDataBaseVar ] = {
					sharedOwnershipModules: [],
				};

				provideModules( registry, FIXTURES );

				const sharedOwnershipModules = await registry
					.__experimentalResolveSelect( CORE_MODULES )
					.getSharedOwnershipModules();

				expect( sharedOwnershipModules ).toMatchObject( {} );
			} );

			it( 'should return the modules object for each shared ownership module', async () => {
				global[ dashboardSharingDataBaseVar ] =
					sharedOwnershipModulesList;

				provideModules( registry, FIXTURES );

				const sharedOwnershipModules = await registry
					.__experimentalResolveSelect( CORE_MODULES )
					.getSharedOwnershipModules();

				expect( sharedOwnershipModules ).toMatchObject(
					getModulesBySlugList(
						sharedOwnershipModulesList.sharedOwnershipModules,
						fixturesKeyValue
					)
				);
			} );
		} );

		describe( 'getShareableModules', () => {
			it( 'should return undefined if the call to retrieve modules fails', async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: {}, status: 400 }
				);

				const initialShareableModules = registry
					.select( CORE_MODULES )
					.getShareableModules();
				expect( initialShareableModules ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();

				const shareableModules = registry
					.select( CORE_MODULES )
					.getShareableModules();

				expect( console ).toHaveErrored();
				expect( shareableModules ).toBeUndefined();
			} );

			it( 'should return an empty object if there are no shareable modules', async () => {
				// Create a version of the module fixtures where every module is
				// marked as an internal module.
				const fixturesWithAllModulesInternal = FIXTURES.map(
					( module ) => {
						return { ...module, shareable: false };
					}
				);

				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: fixturesWithAllModulesInternal, status: 200 }
				);

				const initialShareableModules = registry
					.select( CORE_MODULES )
					.getShareableModules();
				expect( initialShareableModules ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();

				const shareableModules = registry
					.select( CORE_MODULES )
					.getShareableModules();

				expect( Object.values( shareableModules ) ).toHaveLength( 0 );
				expect( shareableModules ).toEqual( {} );
			} );

			it( 'should not care if a module is internal when showing shared modules', async () => {
				provideModuleRegistrations( registry );
				registry
					.dispatch( CORE_MODULES )
					.receiveGetModules( [ ...FIXTURES, ...allModules ] );

				const shareableModules = registry
					.select( CORE_MODULES )
					.getShareableModules();

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( analytics4fixtures.defaultSettings );

				expect(
					Object.values( shareableModules ).every(
						( module ) => module.shareable
					)
				).toBeTruthy();

				expect(
					Object.values( shareableModules ).filter(
						( module ) => module.shareable
					).length
				).toEqual( Object.values( shareableModules ).length );
				await waitForDefaultTimeouts();
			} );
		} );
	} );
} );
