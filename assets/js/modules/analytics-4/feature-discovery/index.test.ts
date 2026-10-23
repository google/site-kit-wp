/**
 * Analytics Feature Discovery registration tests.
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
 * Internal dependencies
 */
import { WHATS_NEW_TAB_PATH } from '@/js/components/feature-discovery/constants';
import { Registry, Select } from '@/js/googlesitekit-data';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createFeatureDiscovery } from '@/js/googlesitekit/feature-discovery';
import { consumePendingSetup } from '@/js/googlesitekit/feature-discovery/pending-setup';
import EnhancedMeasurementSetupEffect from '@/js/modules/analytics-4/components/feature-discovery/EnhancedMeasurementSetupEffect';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
	provideUserAuthentication,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { registerFeatures } from './index';

describe( 'Analytics feature discovery', () => {
	describe( 'enhanced-measurement', () => {
		const propertyID = '1000';
		const webDataStreamID = '2000';

		const settingsEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/settings'
		);
		const enhancedMeasurementSettingsEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/enhanced-measurement-settings'
		);

		const enhancedMeasurementSettings = {
			fileDownloadsEnabled: null,
			name: 'properties/1000/dataStreams/2000/enhancedMeasurementSettings',
			outboundClicksEnabled: null,
			pageChangesEnabled: null,
			scrollsEnabled: null,
			searchQueryParameter: 'q,s,search,query,keyword',
			siteSearchEnabled: null,
			streamEnabled: null,
			uriQueryParameter: null,
			videoEngagementEnabled: null,
		};

		let registry: Registry;

		function getFeature(): Feature {
			return registry
				.select( CORE_FEATURE_DISCOVERY )
				.getFeature( 'enhanced-measurement' );
		}

		function isEnabled() {
			return getFeature().setup.isEnabled?.( registry.select as Select );
		}

		function provideAnalyticsSettings() {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetSettings( { propertyID, webDataStreamID } );
		}

		function provideEnhancedMeasurementSettings( streamEnabled: boolean ) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetEnhancedMeasurementSettings(
					{
						...enhancedMeasurementSettings,
						streamEnabled: streamEnabled || null,
					},
					{ propertyID, webDataStreamID }
				);
		}

		beforeEach( () => {
			registry = createTestRegistry() as Registry;

			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );

			registerFeatures( createFeatureDiscovery( registry ) );
		} );

		afterEach( async () => {
			await consumePendingSetup();
			global.history.replaceState( {}, '', '/' );
		} );

		it( 'should register the enhanced measurement setup effect', () => {
			expect( getFeature().EffectComponent ).toBe(
				EnhancedMeasurementSetupEffect
			);
		} );

		describe( 'isEnabled', () => {
			it( 'should return undefined while the Analytics settings are loading', async () => {
				freezeFetch( settingsEndpoint );

				expect( isEnabled() ).toBeUndefined();

				// Lets the frozen request start before the test ends.
				await waitForDefaultTimeouts();
			} );

			it( 'should return undefined while the enhanced measurement settings are loading', async () => {
				provideAnalyticsSettings();
				freezeFetch( enhancedMeasurementSettingsEndpoint );

				expect( isEnabled() ).toBeUndefined();

				// Lets the frozen request start before the test ends.
				await waitForDefaultTimeouts();
			} );

			it( 'should return false when Analytics is not connected', () => {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: false,
					},
				] );

				expect( isEnabled() ).toBe( false );
			} );

			it( 'should return false when enhanced measurement is off for the web data stream', () => {
				provideAnalyticsSettings();
				provideEnhancedMeasurementSettings( false );

				expect( isEnabled() ).toBe( false );
			} );

			it( 'should return true when enhanced measurement is on for the web data stream', () => {
				provideAnalyticsSettings();
				provideEnhancedMeasurementSettings( true );

				expect( isEnabled() ).toBe( true );
			} );

			it( 'should return false while the change to turn on enhanced measurement is not saved', async () => {
				provideAnalyticsSettings();
				provideEnhancedMeasurementSettings( false );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setEnhancedMeasurementStreamEnabled( {
						propertyID,
						webDataStreamID,
						enabled: true,
					} );

				expect( isEnabled() ).toBe( false );
			} );
		} );

		describe( 'activate', () => {
			beforeEach( () => {
				provideAnalyticsSettings();
			} );

			describe( 'with the edit scope', () => {
				beforeEach( () => {
					provideUserAuthentication( registry, {
						grantedScopes: [ EDIT_SCOPE ],
					} );
					provideEnhancedMeasurementSettings( false );
				} );

				it( 'should save enhanced measurement as on', async () => {
					fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
						body: {
							...enhancedMeasurementSettings,
							streamEnabled: true,
						},
					} );

					await expect(
						getFeature().setup.activate?.( registry )
					).resolves.toEqual( {} );

					expect( fetchMock ).toHaveFetched(
						enhancedMeasurementSettingsEndpoint,
						{
							body: {
								data: {
									propertyID,
									webDataStreamID,
									enhancedMeasurementSettings: {
										...enhancedMeasurementSettings,
										streamEnabled: true,
									},
								},
							},
						}
					);
					expect( isEnabled() ).toBe( true );
				} );

				it( 'should return the error when the save fails', async () => {
					const error = {
						code: 'internal_server_error',
						message: 'Internal server error',
						data: { status: 500 },
					};

					fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
						body: error,
						status: 500,
					} );

					await expect(
						getFeature().setup.activate?.( registry )
					).resolves.toEqual( { error } );

					expect( console ).toHaveErrored();
					expect( isEnabled() ).toBe( false );
				} );
			} );

			it( 'should return the error when the enhanced measurement settings cannot be loaded', async () => {
				const error = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				provideUserAuthentication( registry, {
					grantedScopes: [ EDIT_SCOPE ],
				} );

				fetchMock.getOnce( enhancedMeasurementSettingsEndpoint, {
					body: error,
					status: 500,
				} );

				await expect(
					getFeature().setup.activate?.( registry )
				).resolves.toEqual( { error } );

				expect( console ).toHaveErrored();
				expect( fetchMock ).not.toHaveFetched(
					enhancedMeasurementSettingsEndpoint,
					{ method: 'POST' }
				);
			} );

			it( 'should wait for the granted scopes before deciding whether the edit scope is missing', async () => {
				provideEnhancedMeasurementSettings( false );
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/authentication'
					),
					{
						body: {
							authenticated: true,
							requiredScopes: [],
							grantedScopes: [ EDIT_SCOPE ],
							unsatisfiedScopes: [],
						},
					}
				);
				fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
					body: {
						...enhancedMeasurementSettings,
						streamEnabled: true,
					},
				} );

				await expect(
					getFeature().setup.activate?.( registry )
				).resolves.toEqual( {} );

				expect(
					registry.select( CORE_USER ).getPermissionScopeError()
				).toBeNull();
				expect( fetchMock ).toHaveFetched(
					enhancedMeasurementSettingsEndpoint,
					{ method: 'POST' }
				);
			} );

			describe( 'without the edit scope', () => {
				beforeEach( () => {
					provideUserAuthentication( registry, {
						grantedScopes: [],
					} );

					global.history.replaceState(
						{},
						'',
						`/wp-admin/admin.php?page=googlesitekit-features#${ WHATS_NEW_TAB_PATH }`
					);
				} );

				it( 'should send the user to grant the edit scope and return to the hub', async () => {
					await expect(
						getFeature().setup.activate?.( registry )
					).resolves.toEqual( {} );

					expect(
						registry.select( CORE_USER ).getPermissionScopeError()
					).toEqual( {
						code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
						message: expect.any( String ),
						data: {
							status: 403,
							scopes: [ EDIT_SCOPE ],
							skipModal: true,
							redirectURL: global.location.href,
						},
					} );
					expect( global.location.href ).toContain(
						'page=googlesitekit-features'
					);
					expect( fetchMock ).not.toHaveFetched(
						enhancedMeasurementSettingsEndpoint
					);
				} );

				it( 'should mark the save to resume once the user returns', async () => {
					await getFeature().setup.activate?.( registry );

					expect(
						registry
							.select( CORE_FORMS )
							.getValue( FORM_SETUP, 'autoSubmit' )
					).toBe( true );
				} );

				it( 'should record the tab the user set out from', async () => {
					await getFeature().setup.activate?.( registry );

					expect( await consumePendingSetup() ).toEqual( {
						featureSlug: 'enhanced-measurement',
						returnTab: WHATS_NEW_TAB_PATH,
					} );
				} );
			} );
		} );
	} );
} );
