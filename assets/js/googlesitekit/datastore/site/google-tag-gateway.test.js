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
import { setUsingCache } from 'googlesitekit-api';
import {
	createTestRegistry,
	muteFetch,
	provideSiteInfo,
	provideUserAuthentication,
	subscribeUntil,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';
import { surveyTriggerEndpoint } from '../../../../../tests/js/mock-survey-endpoints';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

describe( 'core/site Google tag gateway', () => {
	let registry;

	const googleTagGatewaySettingsEndpointRegExp = new RegExp(
		'/google-site-kit/v1/core/site/data/gtg-settings'
	);

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'saveGoogleTagGatewaySettings', () => {
			it( 'saves the settings and returns the response', async () => {
				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				fetchMock.postOnce( surveyTriggerEndpoint, {
					status: 200,
					body: {},
				} );

				const updatedSettings = {
					isEnabled: true,
					isGTGHealthy: false,
					isScriptAccessEnabled: false,
				};

				fetchMock.postOnce( googleTagGatewaySettingsEndpointRegExp, {
					body: updatedSettings,
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetGoogleTagGatewaySettings( {
						isEnabled: false,
						isGTGHealthy: false,
						isScriptAccessEnabled: false,
					} );

				registry
					.dispatch( CORE_SITE )
					.setGoogleTagGatewayEnabled( true );

				const { response } = await registry
					.dispatch( CORE_SITE )
					.saveGoogleTagGatewaySettings();

				expect( fetchMock ).toHaveFetched(
					googleTagGatewaySettingsEndpointRegExp,
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

				fetchMock.postOnce( googleTagGatewaySettingsEndpointRegExp, {
					body: errorResponse,
					status: 500,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetGoogleTagGatewaySettings( {
						isEnabled: false,
						isGTGHealthy: false,
						isScriptAccessEnabled: false,
					} );

				registry
					.dispatch( CORE_SITE )
					.setGoogleTagGatewayEnabled( true );

				const { error } = await registry
					.dispatch( CORE_SITE )
					.saveGoogleTagGatewaySettings();

				expect( fetchMock ).toHaveFetched(
					googleTagGatewaySettingsEndpointRegExp,
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

			it( 'should trigger the GTG setup completed survey when GTG setting is enabled', async () => {
				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				fetchMock.postOnce( surveyTriggerEndpoint, {
					status: 200,
					body: { triggerID: 'gtg_setup_completed' },
				} );

				fetchMock.postOnce( googleTagGatewaySettingsEndpointRegExp, {
					body: {
						isEnabled: true,
						isGTGHealthy: true,
						isScriptAccessEnabled: true,
					},
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetGoogleTagGatewaySettings( {
						isEnabled: false,
						isGTGHealthy: true,
						isScriptAccessEnabled: true,
					} );

				registry
					.dispatch( CORE_SITE )
					.setGoogleTagGatewayEnabled( true );

				await registry
					.dispatch( CORE_SITE )
					.saveGoogleTagGatewaySettings();

				// Verify survey was triggered when GTG setting is set to true.
				await waitFor( () =>
					expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
						body: {
							data: { triggerID: 'gtg_setup_completed' },
						},
					} )
				);
			} );

			it( 'should not trigger the GTG setup completed survey when GTG setting is disabled', async () => {
				fetchMock.postOnce( googleTagGatewaySettingsEndpointRegExp, {
					body: {
						isEnabled: false,
						isGTGHealthy: true,
						isScriptAccessEnabled: true,
					},
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetGoogleTagGatewaySettings( {
						isEnabled: true,
						isGTGHealthy: true,
						isScriptAccessEnabled: true,
					} );

				registry
					.dispatch( CORE_SITE )
					.setGoogleTagGatewayEnabled( false );

				await registry
					.dispatch( CORE_SITE )
					.saveGoogleTagGatewaySettings();

				// Verify survey was not triggered when GTG setting is set to false.
				expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint, {
					body: {
						data: { triggerID: 'gtg_setup_completed' },
					},
				} );
			} );
		} );

		describe( 'setGoogleTagGatewayEnabled', () => {
			it( 'sets the enabled status', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetGoogleTagGatewaySettings( {
						isEnabled: false,
						isGTGHealthy: true,
						isScriptAccessEnabled: true,
					} );

				expect(
					registry.select( CORE_SITE ).isGoogleTagGatewayEnabled()
				).toBe( false );

				registry
					.dispatch( CORE_SITE )
					.setGoogleTagGatewayEnabled( true );

				expect(
					registry.select( CORE_SITE ).isGoogleTagGatewayEnabled()
				).toBe( true );

				registry
					.dispatch( CORE_SITE )
					.setGoogleTagGatewayEnabled( false );

				expect(
					registry.select( CORE_SITE ).isGoogleTagGatewayEnabled()
				).toBe( false );
			} );
		} );

		describe( 'resetGoogleTagGatewaySettings', () => {
			it( 'resets the settings', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetGoogleTagGatewaySettings( {
						isEnabled: true,
						isGTGHealthy: true,
						isScriptAccessEnabled: true,
					} );

				expect(
					registry.select( CORE_SITE ).isGoogleTagGatewayEnabled()
				).toBe( true );

				expect( registry.select( CORE_SITE ).isGTGHealthy() ).toBe(
					true
				);

				expect(
					registry.select( CORE_SITE ).isScriptAccessEnabled()
				).toBe( true );

				// Change the settings.
				registry
					.dispatch( CORE_SITE )
					.setGoogleTagGatewayEnabled( false );

				expect(
					registry.select( CORE_SITE ).isGoogleTagGatewayEnabled()
				).toBe( false );

				registry.dispatch( CORE_SITE ).resetGoogleTagGatewaySettings();

				// Reset to the original settings.
				expect(
					registry.select( CORE_SITE ).isGoogleTagGatewayEnabled()
				).toBe( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getGoogleTagGatewaySettings', () => {
			it( 'uses a resolver to make a network request', async () => {
				const googleTagGatewaySettings = {
					isEnabled: false,
					isGTGHealthy: false,
					isScriptAccessEnabled: false,
				};

				fetchMock.getOnce( googleTagGatewaySettingsEndpointRegExp, {
					body: googleTagGatewaySettings,
					status: 200,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getGoogleTagGatewaySettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getGoogleTagGatewaySettings();

				const settings = registry
					.select( CORE_SITE )
					.getGoogleTagGatewaySettings();

				expect( settings ).toEqual( googleTagGatewaySettings );

				expect( fetchMock ).toHaveFetched(
					googleTagGatewaySettingsEndpointRegExp
				);
			} );

			it( 'returns undefined if the request fails', async () => {
				fetchMock.getOnce( googleTagGatewaySettingsEndpointRegExp, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getGoogleTagGatewaySettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getGoogleTagGatewaySettings();

				const settings = registry
					.select( CORE_SITE )
					.getGoogleTagGatewaySettings();

				// Verify the settings are still undefined after the selector is resolved.
				expect( settings ).toBeUndefined();

				expect( fetchMock ).toHaveFetched(
					googleTagGatewaySettingsEndpointRegExp
				);

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isGoogleTagGatewayEnabled', () => {
			it( 'returns undefined if the state is not loaded', async () => {
				muteFetch( googleTagGatewaySettingsEndpointRegExp );

				expect(
					registry.select( CORE_SITE ).isGoogleTagGatewayEnabled()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getGoogleTagGatewaySettings();
			} );

			it.each( [ true, false ] )(
				'returns the enabled status: %s',
				( isEnabled ) => {
					registry
						.dispatch( CORE_SITE )
						.receiveGetGoogleTagGatewaySettings( {
							isEnabled,
							isGTGHealthy: false,
							isScriptAccessEnabled: false,
						} );

					expect(
						registry.select( CORE_SITE ).isGoogleTagGatewayEnabled()
					).toBe( isEnabled );
				}
			);
		} );

		describe( 'isGTGHealthy', () => {
			it( 'returns undefined if the state is not loaded', async () => {
				muteFetch( googleTagGatewaySettingsEndpointRegExp );

				expect(
					registry.select( CORE_SITE ).isGTGHealthy()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getGoogleTagGatewaySettings();
			} );

			it.each( [ true, false ] )(
				'returns the GTG healthy status: %s',
				( isGTGHealthy ) => {
					registry
						.dispatch( CORE_SITE )
						.receiveGetGoogleTagGatewaySettings( {
							isEnabled: false,
							isGTGHealthy,
							isScriptAccessEnabled: false,
						} );

					expect( registry.select( CORE_SITE ).isGTGHealthy() ).toBe(
						isGTGHealthy
					);
				}
			);
		} );

		describe( 'isScriptAccessEnabled', () => {
			it( 'returns undefined if the state is not loaded', async () => {
				muteFetch( googleTagGatewaySettingsEndpointRegExp );

				expect(
					registry.select( CORE_SITE ).isScriptAccessEnabled()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getGoogleTagGatewaySettings();
			} );

			it.each( [ true, false ] )(
				'returns the script access status: %s',
				( isScriptAccessEnabled ) => {
					registry
						.dispatch( CORE_SITE )
						.receiveGetGoogleTagGatewaySettings( {
							isEnabled: false,
							isGTGHealthy: false,
							isScriptAccessEnabled,
						} );

					expect(
						registry.select( CORE_SITE ).isScriptAccessEnabled()
					).toBe( isScriptAccessEnabled );
				}
			);
		} );

		describe( 'haveGoogleTagGatewaySettingsChanged', () => {
			it( 'informs whether client-side settings differ from server-side ones', async () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetGoogleTagGatewaySettings( {
						isEnabled: false,
					} );

				// Initially false.
				expect(
					registry
						.select( CORE_SITE )
						.haveGoogleTagGatewaySettingsChanged()
				).toEqual( false );

				const serverValues = { isEnabled: false };
				const clientValues = { isEnabled: true };

				fetchMock.getOnce( googleTagGatewaySettingsEndpointRegExp, {
					body: serverValues,
					status: 200,
				} );

				registry.select( CORE_SITE ).getGoogleTagGatewaySettings();
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( CORE_SITE )
							.getGoogleTagGatewaySettings() !== undefined
				);

				// Still false after fetching settings from server.
				expect(
					registry
						.select( CORE_SITE )
						.haveGoogleTagGatewaySettingsChanged()
				).toEqual( false );

				// True after updating settings on client.
				registry
					.dispatch( CORE_SITE )
					.setGoogleTagGatewayEnabled( clientValues.isEnabled );
				expect(
					registry
						.select( CORE_SITE )
						.haveGoogleTagGatewaySettingsChanged()
				).toEqual( true );

				// False after updating settings back to original server value on client.
				registry
					.dispatch( CORE_SITE )
					.setGoogleTagGatewayEnabled( serverValues.isEnabled );
				expect(
					registry
						.select( CORE_SITE )
						.haveGoogleTagGatewaySettingsChanged()
				).toEqual( false );
			} );
		} );
	} );
} );
