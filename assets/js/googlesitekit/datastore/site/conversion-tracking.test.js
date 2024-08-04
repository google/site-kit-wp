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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	subscribeUntil,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site Conversion Tracking', () => {
	let registry;

	const conversionTrackingSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/site/data/conversion-tracking'
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
		describe( 'saveConversionTrackingSettings', () => {
			it( 'saves the settings and returns the response', async () => {
				const updatedSettings = {
					enabled: true,
				};

				fetchMock.postOnce( conversionTrackingSettingsEndpointRegExp, {
					body: updatedSettings,
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetConversionTrackingSettings( {
						enabled: false,
					} );

				registry
					.dispatch( CORE_SITE )
					.setConversionTrackingEnabled( true );

				const { response } = await registry
					.dispatch( CORE_SITE )
					.saveConversionTrackingSettings();

				expect( fetchMock ).toHaveFetched(
					conversionTrackingSettingsEndpointRegExp,
					{
						body: {
							data: {
								settings: updatedSettings,
							},
						},
					}
				);

				expect( response ).toEqual( updatedSettings );
			} );

			it( 'returns an error if the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce( conversionTrackingSettingsEndpointRegExp, {
					body: errorResponse,
					status: 500,
				} );

				registry
					.dispatch( CORE_SITE )
					.setConversionTrackingEnabled( true );

				const { error } = await registry
					.dispatch( CORE_SITE )
					.saveConversionTrackingSettings();

				expect( fetchMock ).toHaveFetched(
					conversionTrackingSettingsEndpointRegExp,
					{
						body: {
							data: {
								settings: { enabled: true },
							},
						},
					}
				);

				expect( error ).toEqual( errorResponse );

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'setConversionTrackingEnabled', () => {
			it( 'sets the enabled status', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetConversionTrackingSettings( {
						enabled: false,
					} );

				expect(
					registry.select( CORE_SITE ).isConversionTrackingEnabled()
				).toBe( false );

				registry
					.dispatch( CORE_SITE )
					.setConversionTrackingEnabled( true );

				expect(
					registry.select( CORE_SITE ).isConversionTrackingEnabled()
				).toBe( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getConversionTrackingSettings', () => {
			it( 'uses a resolver to make a network request', async () => {
				const conversionTrackingettings = {
					enabled: false,
				};

				fetchMock.getOnce( conversionTrackingSettingsEndpointRegExp, {
					body: conversionTrackingettings,
					status: 200,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getConversionTrackingSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getConversionTrackingSettings();

				const settings = registry
					.select( CORE_SITE )
					.getConversionTrackingSettings();

				expect( settings ).toEqual( conversionTrackingettings );

				expect( fetchMock ).toHaveFetched(
					conversionTrackingSettingsEndpointRegExp
				);
			} );

			it( 'returns undefined if the request fails', async () => {
				fetchMock.getOnce( conversionTrackingSettingsEndpointRegExp, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getConversionTrackingSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getConversionTrackingSettings();

				const settings = registry
					.select( CORE_SITE )
					.getConversionTrackingSettings();

				// Verify the settings are still undefined after the selector is resolved.
				expect( settings ).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetched(
					conversionTrackingSettingsEndpointRegExp
				);

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isConversionTrackingEnabled', () => {
			it( 'returns the enabled status', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetConversionTrackingSettings( {
						enabled: true,
					} );

				expect(
					registry.select( CORE_SITE ).isConversionTrackingEnabled()
				).toBe( true );
			} );
		} );

		describe( 'haveConversionTrackingSettingsChanged', () => {
			it( 'informs whether client-side settings differ from server-side ones', async () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetConversionTrackingSettings( {
						enabled: false,
					} );

				// Initially false.
				expect(
					registry
						.select( CORE_SITE )
						.haveConversionTrackingSettingsChanged()
				).toEqual( false );

				const serverValues = { enabled: false };
				const clientValues = { enabled: true };

				fetchMock.getOnce( conversionTrackingSettingsEndpointRegExp, {
					body: serverValues,
					status: 200,
				} );

				registry.select( CORE_SITE ).getConversionTrackingSettings();
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( CORE_SITE )
							.getConversionTrackingSettings() !== undefined
				);

				// Still false after fetching settings from server.
				expect(
					registry
						.select( CORE_SITE )
						.haveConversionTrackingSettingsChanged()
				).toEqual( false );

				// True after updating settings on client.
				registry
					.dispatch( CORE_SITE )
					.setConversionTrackingEnabled( clientValues.enabled );
				expect(
					registry
						.select( CORE_SITE )
						.haveConversionTrackingSettingsChanged()
				).toEqual( true );

				// False after updating settings back to original server value on client.
				registry
					.dispatch( CORE_SITE )
					.setConversionTrackingEnabled( serverValues.enabled );
				expect(
					registry
						.select( CORE_SITE )
						.haveConversionTrackingSettingsChanged()
				).toEqual( false );
			} );
		} );
	} );
} );
