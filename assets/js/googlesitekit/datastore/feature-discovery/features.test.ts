/**
 * `core/feature-discovery` data store: features tests.
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
import { Registry } from 'googlesitekit-data';
import { SETTINGS_DIALOG } from '@/js/components/dashboard-sharing/DashboardSharingSettings/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import { FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY } from '@/js/components/feature-discovery/constants';
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-export/constants';
import { getItem } from '@/js/googlesitekit/api/cache';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { createFeatureDiscovery } from '@/js/googlesitekit/feature-discovery';
import {
	FEATURE_DISCOVERY_SETUP_CACHE_KEY,
	consumePendingSetup,
} from '@/js/googlesitekit/feature-discovery/pending-setup';
import { registerDefaults } from '@/js/googlesitekit/feature-discovery/register-defaults';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from './constants';
import type { FeatureSettings } from './types';

function createSettings(
	overrides: Partial< FeatureSettings > = {}
): FeatureSettings {
	return {
		title: 'Test feature',
		shortDescription: 'A feature used in tests.',
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		addedInVersion: '1.100.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			moduleSlug: 'analytics-4',
		},
		...overrides,
	};
}

// Builds intentionally invalid settings to exercise the action's validation.
function createInvalidSettings(
	overrides: Record< string, unknown >
): FeatureSettings {
	return { ...createSettings(), ...overrides } as unknown as FeatureSettings;
}

describe( 'core/feature-discovery features', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'registerFeature', () => {
			it( 'should register a feature under its slug', () => {
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature( 'test-feature', createSettings() );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeature( 'test-feature' )
				).toMatchObject( {
					slug: 'test-feature',
					title: 'Test feature',
				} );
			} );

			it( 'should default prerequisiteModules and badges to empty arrays', () => {
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature( 'test-feature', createSettings() );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeature( 'test-feature' )
				).toMatchObject( {
					badges: [],
					prerequisiteModules: [],
				} );
			} );

			it( 'should preserve registration order', () => {
				[ 'first', 'second', 'third' ].forEach( ( slug ) => {
					registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.registerFeature( slug, createSettings() );
				} );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeatures()
						.map( ( { slug }: { slug: string } ) => slug )
				).toEqual( [ 'first', 'second', 'third' ] );
			} );

			it( 'should allow features to be registered from multiple call sites', () => {
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature( 'from-core', createSettings() );
				registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
					'from-module',
					createSettings( {
						goalCategories: [ FEATURE_CATEGORIES.MONETIZATION ],
					} )
				);

				expect(
					registry.select( CORE_FEATURE_DISCOVERY ).getFeatures()
				).toHaveLength( 2 );
			} );

			it( 'should warn and not overwrite when the slug is already registered', () => {
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature( 'test-feature', createSettings() );
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature(
						'test-feature',
						createSettings( { title: 'Replacement' } )
					);

				expect( console ).toHaveWarnedWith(
					'Could not register feature with slug "test-feature". Feature "test-feature" is already registered.'
				);
				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeature( 'test-feature' ).title
				).toBe( 'Test feature' );
			} );

			const invalidCases: [
				string,
				string,
				FeatureSettings | undefined
			][] = [
				[ 'no slug is provided', '', createSettings() ],
				[ 'no settings are provided', 'test-feature', undefined ],
				[
					'no title is provided',
					'test-feature',
					createInvalidSettings( { title: undefined } ),
				],
				[
					'no shortDescription is provided',
					'test-feature',
					createInvalidSettings( { shortDescription: undefined } ),
				],
				[
					'the effort is not a known level',
					'test-feature',
					createInvalidSettings( { effort: 4 } ),
				],
				[
					'goalCategories is empty',
					'test-feature',
					createInvalidSettings( { goalCategories: [] } ),
				],
				[
					'a goal category is unknown',
					'test-feature',
					createInvalidSettings( {
						goalCategories: [ 'not-a-category' ],
					} ),
				],
				[
					'no addedInVersion is provided',
					'test-feature',
					createInvalidSettings( { addedInVersion: undefined } ),
				],
				[
					'no setup descriptor is provided',
					'test-feature',
					createInvalidSettings( { setup: undefined } ),
				],
				[
					'the setup type is unknown',
					'test-feature',
					createInvalidSettings( { setup: { type: 'not-a-type' } } ),
				],
			];

			it.each( invalidCases )(
				'should throw when %s',
				( _, slug, settings ) => {
					expect( () =>
						registry
							.dispatch( CORE_FEATURE_DISCOVERY )
							.registerFeature( slug, settings )
					).toThrow();
				}
			);
		} );

		describe( 'setupFeature', () => {
			const activationEndpoint = new RegExp(
				'^/google-site-kit/v1/core/modules/data/activation'
			);

			let navigateTo: jest.SpyInstance;

			beforeEach( () => {
				navigateTo = jest
					.spyOn( registry.dispatch( CORE_LOCATION ), 'navigateTo' )
					.mockImplementation( () => ( {} ) );
				provideSiteInfo( registry );
				provideModules( registry, [
					{ slug: 'test-module', active: false, connected: false },
				] );
			} );

			afterEach( async () => {
				await consumePendingSetup();
				global.history.replaceState( {}, '', '/' );
			} );

			function registerSetupFlowFeature( moduleSlug = 'test-module' ) {
				registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
					'test-feature',
					createSettings( {
						setup: {
							type: FEATURE_SETUP_TYPES.SETUP_FLOW,
							moduleSlug,
						},
					} )
				);
			}

			function registerSetupComponent() {
				registry
					.dispatch( CORE_MODULES )
					.registerModule( 'test-module', {
						SetupComponent: () => null,
					} );
			}

			it( 'should require a slug', () => {
				expect( () =>
					registry.dispatch( CORE_FEATURE_DISCOVERY ).setupFeature()
				).toThrow( 'slug is required to set up a feature.' );
			} );

			it( 'should omit the detail panel from UI snapshots so that it does not reopen on return', async () => {
				registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
					'test-feature',
					createSettings( {
						setup: {
							type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
							activate: () => Promise.resolve( {} ),
						},
					} )
				);

				registry
					.dispatch( CORE_UI )
					.setValue(
						FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY,
						'test-feature'
					);

				await registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.setupFeature( 'test-feature' );

				await registry.dispatch( CORE_UI ).createSnapshot();

				const { value: snapshot } = await getItem(
					`datastore::cache::${ CORE_UI }`
				);

				expect( snapshot ).not.toHaveProperty(
					FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY
				);
			} );

			describe.each( [
				FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
				FEATURE_SETUP_TYPES.SETUP_FLOW,
			] )( '%s setup progress', ( setupType ) => {
				it.each( [ 'success', 'error', 'rejection' ] )(
					'should track progress for the feature and clear it on %s',
					async ( outcome ) => {
						const error = new Error( 'Setup failed' );

						let resolveSetup!: ( result: {
							error?: Error;
						} ) => void;

						let rejectSetup!: ( reason: Error ) => void;

						const activation = new Promise< { error?: Error } >(
							( resolve, reject ) => {
								resolveSetup = resolve;
								rejectSetup = reject;
							}
						);

						function activate() {
							return activation;
						}

						registry
							.dispatch( CORE_FEATURE_DISCOVERY )
							.registerFeature(
								'test-feature',
								createSettings( {
									setup: {
										type: setupType,
										moduleSlug: 'test-module',
										activate,
									},
								} )
							);

						jest.spyOn(
							registry.dispatch( CORE_MODULES ),
							'activateModule'
						).mockImplementation( activate );

						const { isSetupInProgress } = registry.select(
							CORE_FEATURE_DISCOVERY
						);

						expect( isSetupInProgress( 'test-feature' ) ).toBe(
							false
						);

						const setup = registry
							.dispatch( CORE_FEATURE_DISCOVERY )
							.setupFeature( 'test-feature' );

						expect( isSetupInProgress( 'test-feature' ) ).toBe(
							true
						);

						expect( isSetupInProgress( 'other-feature' ) ).toBe(
							false
						);

						if ( outcome === 'rejection' ) {
							rejectSetup( error );

							await expect( setup ).resolves.toEqual( { error } );
						} else {
							const result = outcome === 'error' ? { error } : {};

							resolveSetup( result );

							await expect( setup ).resolves.toEqual( result );
						}

						expect( isSetupInProgress( 'test-feature' ) ).toBe(
							false
						);

						expect(
							registry
								.select( CORE_FEATURE_DISCOVERY )
								.getErrorForAction( 'setupFeature', [
									'test-feature',
								] )
						).toEqual( outcome === 'success' ? undefined : error );
					}
				);
			} );

			it( 'should store a synchronous activation error and clear it after a successful retry', async () => {
				const error = new Error( 'Activation failed' );

				const activate = jest
					.fn()
					.mockResolvedValue( {} )
					.mockImplementationOnce( () => {
						throw error;
					} );

				registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
					'test-feature',
					createSettings( {
						setup: {
							type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
							activate,
						},
					} )
				);

				const { setupFeature } = registry.dispatch(
					CORE_FEATURE_DISCOVERY
				);

				const { getErrorForAction, isSetupInProgress } =
					registry.select( CORE_FEATURE_DISCOVERY );

				await expect( setupFeature( 'test-feature' ) ).resolves.toEqual(
					{
						error,
					}
				);

				expect(
					getErrorForAction( 'setupFeature', [ 'test-feature' ] )
				).toBe( error );

				expect( isSetupInProgress( 'test-feature' ) ).toBe( false );

				await expect( setupFeature( 'test-feature' ) ).resolves.toEqual(
					{}
				);

				expect(
					getErrorForAction( 'setupFeature', [ 'test-feature' ] )
				).toBeUndefined();

				expect( isSetupInProgress( 'test-feature' ) ).toBe( false );
			} );

			it( 'should resolve for a registered feature', async () => {
				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.registerFeature( 'test-feature', createSettings() );
				jest.spyOn(
					registry.dispatch( CORE_MODULES ),
					'activateModule'
				).mockResolvedValue( { response: { success: true } } );

				await expect(
					registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' )
				).resolves.toEqual( {} );
			} );

			it( 'should activate the module, record the pending setup and navigate to the module setup', async () => {
				registerSetupFlowFeature();
				registerSetupComponent();
				global.history.replaceState( {}, '', '/#/whats-new' );

				const reauthURL = 'http://example.com/reauth';
				jest.spyOn(
					registry.dispatch( CORE_MODULES ),
					'activateModule'
				).mockResolvedValue( {
					response: { success: true, moduleReauthURL: reauthURL },
				} );

				await expect(
					registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' )
				).resolves.toEqual( {} );

				expect(
					registry.dispatch( CORE_MODULES ).activateModule
				).toHaveBeenCalledWith( 'test-module' );
				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getErrorForAction( 'setupFeature', [ 'test-feature' ] )
				).toBeUndefined();
				expect( navigateTo ).toHaveBeenCalledWith( reauthURL );

				// The record is stored (and so would survive the OAuth round trip).
				expect( await consumePendingSetup() ).toEqual( {
					featureSlug: 'test-feature',
					returnTab: '/whats-new',
				} );
			} );

			it( 'should record the pending setup before navigating', async () => {
				registerSetupFlowFeature();
				registerSetupComponent();

				let recordedAtNavigation = null;
				navigateTo.mockImplementation( async () => {
					recordedAtNavigation = (
						await getItem( FEATURE_DISCOVERY_SETUP_CACHE_KEY )
					 ).cacheHit;
					return {};
				} );
				jest.spyOn(
					registry.dispatch( CORE_MODULES ),
					'activateModule'
				).mockResolvedValue( {
					response: {
						success: true,
						moduleReauthURL: 'http://example.com/reauth',
					},
				} );

				await registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.setupFeature( 'test-feature' );

				expect( recordedAtNavigation ).toBe( true );
			} );

			it( 'should return the activation error as-is and not record or navigate', async () => {
				registerSetupFlowFeature();
				registerSetupComponent();

				const error = {
					code: 'activation_failed',
					message: 'Could not activate.',
					data: { status: 500 },
				};
				fetchMock.postOnce( activationEndpoint, {
					body: error,
					status: 500,
				} );
				const result = await registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.setupFeature( 'test-feature' );

				expect( result ).toEqual( { error } );
				expect( console ).toHaveErrored();
				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getErrorForAction( 'setupFeature', [ 'test-feature' ] )
				).toEqual( error );
				expect( navigateTo ).not.toHaveBeenCalled();
				expect( await consumePendingSetup() ).toBeNull();
			} );

			it( 'should clear any stale setupFeature action error once setup succeeds', async () => {
				registerSetupFlowFeature();

				registry.dispatch( CORE_FEATURE_DISCOVERY ).setErrorForAction(
					{
						code: 'activation_failed',
						message: 'Old error',
						data: { status: 500 },
					},
					'setupFeature',
					[ 'test-feature' ]
				);

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getErrorForAction( 'setupFeature', [ 'test-feature' ] )
				).toBeDefined();

				jest.spyOn(
					registry.dispatch( CORE_MODULES ),
					'activateModule'
				).mockResolvedValue( {
					response: {
						success: true,
						moduleReauthURL: 'http://example.com/reauth',
					},
				} );

				await registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.setupFeature( 'test-feature' );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getErrorForAction( 'setupFeature', [ 'test-feature' ] )
				).toBeUndefined();
				expect( navigateTo ).not.toHaveBeenCalled();
			} );

			it( 'should stop without recording or navigating when the module has no setup component', async () => {
				registerSetupFlowFeature();
				jest.spyOn(
					registry.dispatch( CORE_MODULES ),
					'activateModule'
				).mockResolvedValue( {
					response: {
						success: true,
						moduleReauthURL: 'http://example.com/reauth',
					},
				} );

				await expect(
					registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' )
				).resolves.toEqual( {} );

				expect(
					registry.dispatch( CORE_MODULES ).activateModule
				).toHaveBeenCalledWith( 'test-module' );
				expect( navigateTo ).not.toHaveBeenCalled();
				expect( await consumePendingSetup() ).toBeNull();
			} );

			it( 'should record pending setup and navigate when setup provides a URL', async () => {
				global.history.replaceState( {}, '', '/#/whats-new' );
				const setupURL =
					'http://example.com/wp-admin/admin.php?page=googlesitekit-ad-blocking-recovery';
				const activateModuleSpy = jest.spyOn(
					registry.dispatch( CORE_MODULES ),
					'activateModule'
				);

				registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
					'test-feature',
					createSettings( {
						setup: {
							type: FEATURE_SETUP_TYPES.SETUP_FLOW,
							getSetupURL: () => setupURL,
						},
					} )
				);

				await expect(
					registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' )
				).resolves.toEqual( {} );

				expect( activateModuleSpy ).not.toHaveBeenCalled();
				expect( navigateTo ).toHaveBeenCalledWith( setupURL );
				expect( await consumePendingSetup() ).toEqual( {
					featureSlug: 'test-feature',
					returnTab: '/whats-new',
				} );
			} );

			it( 'should not record pending setup or navigate when setup URL is undefined', async () => {
				const activateModuleSpy = jest.spyOn(
					registry.dispatch( CORE_MODULES ),
					'activateModule'
				);

				registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
					'test-feature',
					createSettings( {
						setup: {
							type: FEATURE_SETUP_TYPES.SETUP_FLOW,
							getSetupURL: () => undefined,
						},
					} )
				);

				await expect(
					registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' )
				).resolves.toEqual( {} );

				expect( activateModuleSpy ).not.toHaveBeenCalled();
				expect( navigateTo ).not.toHaveBeenCalled();
				expect( await consumePendingSetup() ).toBeNull();
			} );

			describe( 'for a setup-flow feature with both a module and a setup URL', () => {
				const overrideURL =
					'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&expressSetup=true';
				const reauthURL = 'http://example.com/reauth';

				function registerFeatureWithOverride() {
					registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
						'test-feature',
						createSettings( {
							setup: {
								type: FEATURE_SETUP_TYPES.SETUP_FLOW,
								moduleSlug: 'test-module',
								getSetupURL: () => overrideURL,
							},
						} )
					);
				}

				it( 'should activate the module first, then navigate to the override URL', async () => {
					registerFeatureWithOverride();
					global.history.replaceState( {}, '', '/#/whats-new' );

					const activateModule = jest
						.spyOn(
							registry.dispatch( CORE_MODULES ),
							'activateModule'
						)
						.mockResolvedValue( {
							response: {
								success: true,
								moduleReauthURL: reauthURL,
							},
						} );

					await expect(
						registry
							.dispatch( CORE_FEATURE_DISCOVERY )
							.setupFeature( 'test-feature' )
					).resolves.toEqual( {} );

					expect( activateModule ).toHaveBeenCalledWith(
						'test-module'
					);
					expect( navigateTo ).toHaveBeenCalledTimes( 1 );
					expect( navigateTo ).toHaveBeenCalledWith( overrideURL );
					expect(
						activateModule.mock.invocationCallOrder[ 0 ]
					).toBeLessThan( navigateTo.mock.invocationCallOrder[ 0 ] );
					expect( await consumePendingSetup() ).toEqual( {
						featureSlug: 'test-feature',
						returnTab: '/whats-new',
					} );
				} );

				it( 'should navigate to the override URL even when the module has no setup component', async () => {
					registerFeatureWithOverride();
					jest.spyOn(
						registry.dispatch( CORE_MODULES ),
						'activateModule'
					).mockResolvedValue( {
						response: {
							success: true,
							moduleReauthURL: reauthURL,
						},
					} );

					await registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' );

					expect( navigateTo ).toHaveBeenCalledWith( overrideURL );
				} );

				it( 'should fall back to the module reauth URL when the override is undefined', async () => {
					registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
						'test-feature',
						createSettings( {
							setup: {
								type: FEATURE_SETUP_TYPES.SETUP_FLOW,
								moduleSlug: 'test-module',
								getSetupURL: () => undefined,
							},
						} )
					);
					registerSetupComponent();
					jest.spyOn(
						registry.dispatch( CORE_MODULES ),
						'activateModule'
					).mockResolvedValue( {
						response: {
							success: true,
							moduleReauthURL: reauthURL,
						},
					} );

					await registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' );

					expect( navigateTo ).toHaveBeenCalledWith( reauthURL );
				} );

				it( 'should not record or navigate when activation fails', async () => {
					registerFeatureWithOverride();

					const error = {
						code: 'activation_failed',
						message: 'Could not activate.',
						data: { status: 500 },
					};
					fetchMock.postOnce( activationEndpoint, {
						body: error,
						status: 500,
					} );

					const result = await registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' );

					expect( result ).toEqual( { error } );
					expect( console ).toHaveErrored();
					expect( navigateTo ).not.toHaveBeenCalled();
					expect( await consumePendingSetup() ).toBeNull();
				} );
			} );

			describe( 'for a background-toggle feature', () => {
				const error = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				function registerBackgroundToggleFeature(
					activate?: ( activateRegistry: Registry ) => Promise< {
						error?: typeof error;
					} >
				) {
					registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
						'test-feature',
						createSettings( {
							setup: {
								type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
								activate,
							},
						} )
					);
				}

				it( 'should run the activate routine with the registry and keep the user on the hub', async () => {
					const activate = jest.fn().mockResolvedValue( {} );
					registerBackgroundToggleFeature( activate );

					const activateModule = jest.spyOn(
						registry.dispatch( CORE_MODULES ),
						'activateModule'
					);

					await expect(
						registry
							.dispatch( CORE_FEATURE_DISCOVERY )
							.setupFeature( 'test-feature' )
					).resolves.toEqual( {} );

					expect( activate ).toHaveBeenCalledTimes( 1 );
					expect( activate ).toHaveBeenCalledWith(
						expect.objectContaining( {
							select: expect.any( Function ),
							dispatch: expect.any( Function ),
						} )
					);
					expect( activateModule ).not.toHaveBeenCalled();
					expect( navigateTo ).not.toHaveBeenCalled();
					expect( await consumePendingSetup() ).toBeNull();
				} );

				it( 'should return the error from the activate routine and store it for the setupFeature action', async () => {
					registerBackgroundToggleFeature(
						jest.fn().mockResolvedValue( { error } )
					);

					await expect(
						registry
							.dispatch( CORE_FEATURE_DISCOVERY )
							.setupFeature( 'test-feature' )
					).resolves.toEqual( { error } );

					expect(
						registry
							.select( CORE_FEATURE_DISCOVERY )
							.getErrorForAction( 'setupFeature', [
								'test-feature',
							] )
					).toEqual( error );
				} );

				it( 'should clear any stale setupFeature action error once the activate routine succeeds', async () => {
					registerBackgroundToggleFeature(
						jest.fn().mockResolvedValue( {} )
					);

					registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setErrorForAction( error, 'setupFeature', [
							'test-feature',
						] );

					await registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' );

					expect(
						registry
							.select( CORE_FEATURE_DISCOVERY )
							.getErrorForAction( 'setupFeature', [
								'test-feature',
							] )
					).toBeUndefined();
				} );

				it( 'should resolve to an empty object when the feature has no activate routine', async () => {
					registerBackgroundToggleFeature();

					await expect(
						registry
							.dispatch( CORE_FEATURE_DISCOVERY )
							.setupFeature( 'test-feature' )
					).resolves.toEqual( {} );
				} );
			} );

			describe( 'for an in-place-panel feature', () => {
				it( "should close the detail panel before opening the feature's panel", async () => {
					// Records the detail panel's state at the moment the
					// feature's panel opens.
					let detailPanelSlugOnOpen: unknown;

					registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
						'test-feature',
						createSettings( {
							setup: {
								type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
								open: ( openRegistry: Registry ) => {
									detailPanelSlugOnOpen = openRegistry
										.select( CORE_UI )
										.getValue(
											FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY
										);

									openRegistry
										.dispatch( CORE_UI )
										.setValue( 'testPanelOpened', true );
								},
							},
						} )
					);

					registry
						.dispatch( CORE_UI )
						.setValue(
							FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY,
							'test-feature'
						);

					await registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' );

					expect(
						registry.select( CORE_UI ).getValue( 'testPanelOpened' )
					).toBe( true );
					expect( detailPanelSlugOnOpen ).toBe( false );
				} );

				it( 'should not activate a module or record a pending setup', async () => {
					registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
						'test-feature',
						createSettings( {
							setup: {
								type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
								open: jest.fn(),
							},
						} )
					);
					const activateModule = jest.spyOn(
						registry.dispatch( CORE_MODULES ),
						'activateModule'
					);

					await registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' );

					expect( activateModule ).not.toHaveBeenCalled();
					expect( await consumePendingSetup() ).toBeNull();
				} );

				it( 'should keep the user on the hub even when the feature names a module with a setup screen', async () => {
					const open = jest.fn();

					registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature(
						'test-feature',
						createSettings( {
							setup: {
								type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
								moduleSlug: 'test-module',
								open,
							},
						} )
					);
					registerSetupComponent();

					// Were this treated as a `setup-flow` feature, it would
					// navigate to this URL.
					const activateModule = jest
						.spyOn(
							registry.dispatch( CORE_MODULES ),
							'activateModule'
						)
						.mockResolvedValue( {
							response: {
								success: true,
								moduleReauthURL: 'http://example.com/reauth',
							},
						} );

					await registry
						.dispatch( CORE_FEATURE_DISCOVERY )
						.setupFeature( 'test-feature' );

					expect( open ).toHaveBeenCalledTimes( 1 );
					expect( activateModule ).not.toHaveBeenCalled();
					expect( navigateTo ).not.toHaveBeenCalled();
					expect( await consumePendingSetup() ).toBeNull();
				} );

				it.each( [
					[ 'dashboard-sharing', SETTINGS_DIALOG ],
					[
						'email-reports',
						USER_SETTINGS_SELECTION_PANEL_OPENED_KEY,
					],
					[ 'pdf-report', PDF_DOWNLOAD_PANEL_OPENED_KEY ],
				] )(
					'should open the existing panel for the %s feature',
					async ( slug, uiKey ) => {
						registerDefaults( createFeatureDiscovery( registry ) );

						expect(
							registry.select( CORE_UI ).getValue( uiKey )
						).toBeUndefined();

						await registry
							.dispatch( CORE_FEATURE_DISCOVERY )
							.setupFeature( slug );

						expect(
							registry.select( CORE_UI ).getValue( uiKey )
						).toBe( true );
						expect( await consumePendingSetup() ).toBeNull();
					}
				);
			} );
		} );

		describe( 'receivePendingSetup', () => {
			it( 'should store the pending setup', () => {
				const pendingSetup = {
					featureSlug: 'adsense',
					returnTab: '/whats-new',
				};

				registry
					.dispatch( CORE_FEATURE_DISCOVERY )
					.receivePendingSetup( pendingSetup );

				expect(
					registry.select( CORE_FEATURE_DISCOVERY ).getPendingSetup()
				).toEqual( pendingSetup );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getFeatures', () => {
			it( 'should return an empty array when nothing is registered', () => {
				expect(
					registry.select( CORE_FEATURE_DISCOVERY ).getFeatures()
				).toEqual( [] );
			} );
		} );

		describe( 'getFeature', () => {
			it( 'should return null for an unregistered slug', () => {
				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeature( 'nope' )
				).toBeNull();
			} );

			it( 'should require a slug', () => {
				expect( () =>
					registry.select( CORE_FEATURE_DISCOVERY ).getFeature()
				).toThrow( 'slug is required to get a feature.' );
			} );
		} );
	} );
} );
