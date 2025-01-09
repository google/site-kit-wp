/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * External dependencies
 */
import { waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	muteFetch,
	provideUserAuthentication,
	subscribeUntil,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';
import { surveyTriggerEndpoint } from '../../../../../tests/js/mock-survey-endpoints';
import { CORE_USER } from '../user/constants';

describe( 'core/site First-party Mode', () => {
	let registry;

	const firstPartyModeSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/site/data/fpm-settings'
	);

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'saveFirstPartyModeSettings', () => {
			it( 'saves the settings and returns the response', async () => {
				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				fetchMock.postOnce( surveyTriggerEndpoint, {
					status: 200,
					body: {},
				} );

				const updatedSettings = {
					isEnabled: true,
					isFPMHealthy: false,
					isScriptAccessEnabled: false,
				};

				fetchMock.postOnce( firstPartyModeSettingsEndpointRegExp, {
					body: updatedSettings,
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetFirstPartyModeSettings( {
						isEnabled: false,
						isFPMHealthy: false,
						isScriptAccessEnabled: false,
					} );

				registry.dispatch( CORE_SITE ).setFirstPartyModeEnabled( true );

				const { response } = await registry
					.dispatch( CORE_SITE )
					.saveFirstPartyModeSettings();

				expect( fetchMock ).toHaveFetched(
					firstPartyModeSettingsEndpointRegExp,
					{
						body: {
							data: {
								settings: {
									// Only the `isEnabled` property is settable, other properties are filtered out of the request payload.
									isEnabled: true,
								},
							},
						},
					}
				);

				expect( response ).toEqual( updatedSettings );

				await waitForDefaultTimeouts();
			} );

			it( 'returns an error if the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce( firstPartyModeSettingsEndpointRegExp, {
					body: errorResponse,
					status: 500,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetFirstPartyModeSettings( {
						isEnabled: false,
						isFPMHealthy: false,
						isScriptAccessEnabled: false,
					} );

				registry.dispatch( CORE_SITE ).setFirstPartyModeEnabled( true );

				const { error } = await registry
					.dispatch( CORE_SITE )
					.saveFirstPartyModeSettings();

				expect( fetchMock ).toHaveFetched(
					firstPartyModeSettingsEndpointRegExp,
					{
						body: {
							data: {
								settings: {
									// Only the `isEnabled` property is settable, other properties are filtered out of the request payload.
									isEnabled: true,
								},
							},
						},
					}
				);

				expect( error ).toEqual( errorResponse );

				expect( console ).toHaveErrored();
			} );

			it( 'should trigger the FPM setup completed survey when FPM setting is enabled', async () => {
				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				fetchMock.postOnce( surveyTriggerEndpoint, {
					status: 200,
					body: { triggerID: 'fpm_setup_completed' },
				} );

				fetchMock.postOnce( firstPartyModeSettingsEndpointRegExp, {
					body: {
						isEnabled: true,
						isFPMHealthy: true,
						isScriptAccessEnabled: true,
					},
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetFirstPartyModeSettings( {
						isEnabled: false,
						isFPMHealthy: true,
						isScriptAccessEnabled: true,
					} );

				registry.dispatch( CORE_SITE ).setFirstPartyModeEnabled( true );

				await registry
					.dispatch( CORE_SITE )
					.saveFirstPartyModeSettings();

				// Verify survey was triggered when FPM setting is set to true.
				await waitFor( () =>
					expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
						body: {
							data: { triggerID: 'fpm_setup_completed' },
						},
					} )
				);
			} );

			it( 'should not trigger the FPM setup completed survey when FPM setting is disabled', async () => {
				fetchMock.postOnce( firstPartyModeSettingsEndpointRegExp, {
					body: {
						isEnabled: false,
						isFPMHealthy: true,
						isScriptAccessEnabled: true,
					},
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetFirstPartyModeSettings( {
						isEnabled: true,
						isFPMHealthy: true,
						isScriptAccessEnabled: true,
					} );

				registry
					.dispatch( CORE_SITE )
					.setFirstPartyModeEnabled( false );

				await registry
					.dispatch( CORE_SITE )
					.saveFirstPartyModeSettings();

				// Verify survey was not triggered when FPM setting is set to false.
				waitFor( () =>
					expect( fetchMock ).not.toHaveFetched(
						surveyTriggerEndpoint,
						{
							body: {
								data: { triggerID: 'fpm_setup_completed' },
							},
						}
					)
				);
			} );
		} );

		describe( 'setFirstPartyModeEnabled', () => {
			it( 'sets the enabled status', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetFirstPartyModeSettings( {
						isEnabled: false,
						isFPMHealthy: true,
						isScriptAccessEnabled: true,
					} );

				expect(
					registry.select( CORE_SITE ).isFirstPartyModeEnabled()
				).toBe( false );

				registry.dispatch( CORE_SITE ).setFirstPartyModeEnabled( true );

				expect(
					registry.select( CORE_SITE ).isFirstPartyModeEnabled()
				).toBe( true );

				registry
					.dispatch( CORE_SITE )
					.setFirstPartyModeEnabled( false );

				expect(
					registry.select( CORE_SITE ).isFirstPartyModeEnabled()
				).toBe( false );
			} );
		} );

		describe( 'resetFirstPartyModeSettings', () => {
			it( 'resets the settings', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetFirstPartyModeSettings( {
						isEnabled: true,
						isFPMHealthy: true,
						isScriptAccessEnabled: true,
					} );

				expect(
					registry.select( CORE_SITE ).isFirstPartyModeEnabled()
				).toBe( true );

				expect( registry.select( CORE_SITE ).isFPMHealthy() ).toBe(
					true
				);

				expect(
					registry.select( CORE_SITE ).isScriptAccessEnabled()
				).toBe( true );

				// Change the settings.
				registry
					.dispatch( CORE_SITE )
					.setFirstPartyModeEnabled( false );

				expect(
					registry.select( CORE_SITE ).isFirstPartyModeEnabled()
				).toBe( false );

				registry.dispatch( CORE_SITE ).resetFirstPartyModeSettings();

				// Reset to the original settings.
				expect(
					registry.select( CORE_SITE ).isFirstPartyModeEnabled()
				).toBe( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getFirstPartyModeSettings', () => {
			it( 'uses a resolver to make a network request', async () => {
				const firstPartyModeSettings = {
					isEnabled: false,
					isFPMHealthy: false,
					isScriptAccessEnabled: false,
				};

				fetchMock.getOnce( firstPartyModeSettingsEndpointRegExp, {
					body: firstPartyModeSettings,
					status: 200,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getFirstPartyModeSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getFirstPartyModeSettings();

				const settings = registry
					.select( CORE_SITE )
					.getFirstPartyModeSettings();

				expect( settings ).toEqual( firstPartyModeSettings );

				expect( fetchMock ).toHaveFetched(
					firstPartyModeSettingsEndpointRegExp
				);
			} );

			it( 'returns undefined if the request fails', async () => {
				fetchMock.getOnce( firstPartyModeSettingsEndpointRegExp, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getFirstPartyModeSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getFirstPartyModeSettings();

				const settings = registry
					.select( CORE_SITE )
					.getFirstPartyModeSettings();

				// Verify the settings are still undefined after the selector is resolved.
				expect( settings ).toBeUndefined();

				expect( fetchMock ).toHaveFetched(
					firstPartyModeSettingsEndpointRegExp
				);

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isFirstPartyModeEnabled', () => {
			it( 'returns undefined if the state is not loaded', async () => {
				muteFetch( firstPartyModeSettingsEndpointRegExp );

				expect(
					registry.select( CORE_SITE ).isFirstPartyModeEnabled()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getFirstPartyModeSettings();
			} );

			it.each( [ true, false ] )(
				'returns the enabled status: %s',
				( isEnabled ) => {
					registry
						.dispatch( CORE_SITE )
						.receiveGetFirstPartyModeSettings( {
							isEnabled,
							isFPMHealthy: false,
							isScriptAccessEnabled: false,
						} );

					expect(
						registry.select( CORE_SITE ).isFirstPartyModeEnabled()
					).toBe( isEnabled );
				}
			);
		} );

		describe( 'isFPMHealthy', () => {
			it( 'returns undefined if the state is not loaded', async () => {
				muteFetch( firstPartyModeSettingsEndpointRegExp );

				expect(
					registry.select( CORE_SITE ).isFPMHealthy()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getFirstPartyModeSettings();
			} );

			it.each( [ true, false ] )(
				'returns the FPM healthy status: %s',
				( isFPMHealthy ) => {
					registry
						.dispatch( CORE_SITE )
						.receiveGetFirstPartyModeSettings( {
							isEnabled: false,
							isFPMHealthy,
							isScriptAccessEnabled: false,
						} );

					expect( registry.select( CORE_SITE ).isFPMHealthy() ).toBe(
						isFPMHealthy
					);
				}
			);
		} );

		describe( 'isScriptAccessEnabled', () => {
			it( 'returns undefined if the state is not loaded', async () => {
				muteFetch( firstPartyModeSettingsEndpointRegExp );

				expect(
					registry.select( CORE_SITE ).isScriptAccessEnabled()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getFirstPartyModeSettings();
			} );

			it.each( [ true, false ] )(
				'returns the script access status: %s',
				( isScriptAccessEnabled ) => {
					registry
						.dispatch( CORE_SITE )
						.receiveGetFirstPartyModeSettings( {
							isEnabled: false,
							isFPMHealthy: false,
							isScriptAccessEnabled,
						} );

					expect(
						registry.select( CORE_SITE ).isScriptAccessEnabled()
					).toBe( isScriptAccessEnabled );
				}
			);
		} );

		describe( 'haveFirstPartyModeSettingsChanged', () => {
			it( 'informs whether client-side settings differ from server-side ones', async () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetFirstPartyModeSettings( {
						isEnabled: false,
					} );

				// Initially false.
				expect(
					registry
						.select( CORE_SITE )
						.haveFirstPartyModeSettingsChanged()
				).toEqual( false );

				const serverValues = { isEnabled: false };
				const clientValues = { isEnabled: true };

				fetchMock.getOnce( firstPartyModeSettingsEndpointRegExp, {
					body: serverValues,
					status: 200,
				} );

				registry.select( CORE_SITE ).getFirstPartyModeSettings();
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( CORE_SITE )
							.getFirstPartyModeSettings() !== undefined
				);

				// Still false after fetching settings from server.
				expect(
					registry
						.select( CORE_SITE )
						.haveFirstPartyModeSettingsChanged()
				).toEqual( false );

				// True after updating settings on client.
				registry
					.dispatch( CORE_SITE )
					.setFirstPartyModeEnabled( clientValues.isEnabled );
				expect(
					registry
						.select( CORE_SITE )
						.haveFirstPartyModeSettingsChanged()
				).toEqual( true );

				// False after updating settings back to original server value on client.
				registry
					.dispatch( CORE_SITE )
					.setFirstPartyModeEnabled( serverValues.isEnabled );
				expect(
					registry
						.select( CORE_SITE )
						.haveFirstPartyModeSettingsChanged()
				).toEqual( false );
			} );
		} );
	} );
} );
