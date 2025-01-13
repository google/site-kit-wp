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
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site Consent Mode', () => {
	let registry;

	const consentModeSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/site/data/consent-mode'
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
		describe( 'saveConsentModeSettings', () => {
			it( 'saves the settings and returns the response', async () => {
				const updatedSettings = {
					enabled: true,
					regions: [ 'AT' ],
				};

				fetchMock.postOnce( consentModeSettingsEndpointRegExp, {
					body: updatedSettings,
					status: 200,
				} );

				registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
					enabled: false,
					regions: [ 'AT' ],
				} );

				registry.dispatch( CORE_SITE ).setConsentModeEnabled( true );

				const { response } = await registry
					.dispatch( CORE_SITE )
					.saveConsentModeSettings();

				expect( fetchMock ).toHaveFetched(
					consentModeSettingsEndpointRegExp,
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

				fetchMock.postOnce( consentModeSettingsEndpointRegExp, {
					body: errorResponse,
					status: 500,
				} );

				registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
					enabled: false,
					regions: [ 'AT' ],
				} );

				registry.dispatch( CORE_SITE ).setConsentModeEnabled( true );

				const { error } = await registry
					.dispatch( CORE_SITE )
					.saveConsentModeSettings();

				expect( fetchMock ).toHaveFetched(
					consentModeSettingsEndpointRegExp,
					{
						body: {
							data: {
								settings: { enabled: true, regions: [ 'AT' ] },
							},
						},
					}
				);

				expect( error ).toEqual( errorResponse );

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'setConsentModeEnabled', () => {
			it( 'sets the enabled status', () => {
				registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
					enabled: false,
					regions: [ 'AT' ],
				} );

				expect(
					registry.select( CORE_SITE ).isConsentModeEnabled()
				).toBe( false );

				registry.dispatch( CORE_SITE ).setConsentModeEnabled( true );

				expect(
					registry.select( CORE_SITE ).isConsentModeEnabled()
				).toBe( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getConsentModeSettings', () => {
			it( 'uses a resolver to make a network request', async () => {
				const consentModeSettings = {
					enabled: false,
					regions: [ 'AT' ],
				};

				fetchMock.getOnce( consentModeSettingsEndpointRegExp, {
					body: consentModeSettings,
					status: 200,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getConsentModeSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getConsentModeSettings();

				const settings = registry
					.select( CORE_SITE )
					.getConsentModeSettings();

				expect( settings ).toEqual( consentModeSettings );

				expect( fetchMock ).toHaveFetched(
					consentModeSettingsEndpointRegExp
				);
			} );

			it( 'returns undefined if the request fails', async () => {
				fetchMock.getOnce( consentModeSettingsEndpointRegExp, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getConsentModeSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getConsentModeSettings();

				const settings = registry
					.select( CORE_SITE )
					.getConsentModeSettings();

				// Verify the settings are still undefined after the selector is resolved.
				expect( settings ).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetched(
					consentModeSettingsEndpointRegExp
				);

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isConsentModeEnabled', () => {
			it( 'returns the enabled status', () => {
				registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
					enabled: true,
					regions: [ 'AT' ],
				} );

				expect(
					registry.select( CORE_SITE ).isConsentModeEnabled()
				).toBe( true );
			} );
		} );

		describe( 'getConsentAPIInfo', () => {
			const consentAPIInfoEndpointRegExp = new RegExp(
				'^/google-site-kit/v1/core/site/data/consent-api-info'
			);

			it( 'uses a resolver to make a network request', async () => {
				const consentAPIInfo = {
					hasConsentAPI: false,
					wpConsentPlugin: {
						installed: false,
						activateURL:
							'http://example.com/wp-admin/plugins.php?action=activate&plugin=some-plugin',
						installURL:
							'http://example.com/wp-admin/update.php?action=install-plugin&plugin=some-plugin',
					},
				};

				fetchMock.getOnce( consentAPIInfoEndpointRegExp, {
					body: consentAPIInfo,
					status: 200,
				} );

				const initialAPIInfo = registry
					.select( CORE_SITE )
					.getConsentAPIInfo();

				expect( initialAPIInfo ).toBeUndefined();

				await untilResolved( registry, CORE_SITE ).getConsentAPIInfo();

				const apiInfo = registry
					.select( CORE_SITE )
					.getConsentAPIInfo();

				expect( apiInfo ).toEqual( consentAPIInfo );

				expect( fetchMock ).toHaveFetched(
					consentAPIInfoEndpointRegExp
				);
			} );

			it( 'returns undefined if the request fails', async () => {
				fetchMock.getOnce( consentAPIInfoEndpointRegExp, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				const initialAPIInfo = registry
					.select( CORE_SITE )
					.getConsentAPIInfo();

				expect( initialAPIInfo ).toBeUndefined();

				await untilResolved( registry, CORE_SITE ).getConsentAPIInfo();

				const apiInfo = registry
					.select( CORE_SITE )
					.getConsentAPIInfo();

				// Verify the API info is still undefined after the selector is resolved.
				expect( apiInfo ).toBeUndefined();

				expect( fetchMock ).toHaveFetched(
					consentAPIInfoEndpointRegExp
				);

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isAdsConnected', () => {
			const adsMeasurementStatusEndpointRegExp = new RegExp(
				'^/google-site-kit/v1/core/site/data/ads-measurement-status'
			);

			it( 'uses a resolver to make a network request', async () => {
				const response = { connected: true };

				fetchMock.getOnce( adsMeasurementStatusEndpointRegExp, {
					body: response,
					status: 200,
				} );

				const initialIsAdsConnected = registry
					.select( CORE_SITE )
					.isAdsConnected();

				expect( initialIsAdsConnected ).toBeUndefined();

				await untilResolved( registry, CORE_SITE ).isAdsConnected();

				const isAdsConnected = registry
					.select( CORE_SITE )
					.isAdsConnected();

				expect( isAdsConnected ).toEqual( response.connected );

				expect( fetchMock ).toHaveFetched(
					adsMeasurementStatusEndpointRegExp
				);
			} );

			it( 'returns undefined if the request fails', async () => {
				fetchMock.getOnce( adsMeasurementStatusEndpointRegExp, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				const initialIsAdsConnected = registry
					.select( CORE_SITE )
					.isAdsConnected();

				expect( initialIsAdsConnected ).toBeUndefined();

				await untilResolved( registry, CORE_SITE ).isAdsConnected();

				const isAdsConnected = registry
					.select( CORE_SITE )
					.isAdsConnected();

				// Verify the API info is still undefined after the selector is resolved.
				expect( isAdsConnected ).toBeUndefined();

				expect( fetchMock ).toHaveFetched(
					adsMeasurementStatusEndpointRegExp
				);

				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
