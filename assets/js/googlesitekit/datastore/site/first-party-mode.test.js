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
import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site First-Party Mode', () => {
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
									isEnabled: true,
									isFPMHealthy: false,
									isScriptAccessEnabled: false,
								},
							},
						},
					}
				);

				expect( error ).toEqual( errorResponse );

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'setFirstPartyModeEnabled', () => {
			it( 'sets the enabled status', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetFirstPartyModeSettings( {
						isEnabled: false,
						isFPMHealthy: false,
						isScriptAccessEnabled: false,
					} );

				expect(
					registry.select( CORE_SITE ).isFirstPartyModeEnabled()
				).toBe( false );

				registry.dispatch( CORE_SITE ).setFirstPartyModeEnabled( true );

				expect(
					registry.select( CORE_SITE ).isFirstPartyModeEnabled()
				).toBe( true );
			} );
		} );
	} );
} );
