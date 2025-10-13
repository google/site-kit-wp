/**
 * `core/site` data store: Email Reporting settings tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { setUsingCache } from 'googlesitekit-api';
import {
	createTestRegistry,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site Email Reporting', () => {
	let registry;

	const emailReportingSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting'
	);

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'saveEmailReportingSettings', () => {
			it( 'saves the settings and returns the response', async () => {
				const updatedSettings = {
					enabled: true,
				};

				fetchMock.postOnce( emailReportingSettingsEndpointRegExp, {
					body: updatedSettings,
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: false,
					} );

				registry
					.dispatch( CORE_SITE )
					.setProactiveUserEngagementEnabled( true );

				const { response } = await registry
					.dispatch( CORE_SITE )
					.saveEmailReportingSettings();

				expect( fetchMock ).toHaveFetched(
					emailReportingSettingsEndpointRegExp,
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

				fetchMock.postOnce( emailReportingSettingsEndpointRegExp, {
					body: errorResponse,
					status: 500,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: false,
					} );

				registry
					.dispatch( CORE_SITE )
					.setProactiveUserEngagementEnabled( true );

				const { error } = await registry
					.dispatch( CORE_SITE )
					.saveEmailReportingSettings();

				expect( fetchMock ).toHaveFetched(
					emailReportingSettingsEndpointRegExp,
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

		describe( 'setProactiveUserEngagementEnabled', () => {
			it( 'sets the enabled status', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: false,
					} );

				expect(
					registry.select( CORE_SITE ).isEmailReportingEnabled()
				).toBe( false );

				registry
					.dispatch( CORE_SITE )
					.setProactiveUserEngagementEnabled( true );

				expect(
					registry.select( CORE_SITE ).isEmailReportingEnabled()
				).toBe( true );
			} );

			it( 'requires a boolean argument', () => {
				expect( () => {
					registry
						.dispatch( CORE_SITE )
						.setProactiveUserEngagementEnabled();
				} ).toThrow( 'enabled should be a boolean.' );

				expect( () => {
					registry
						.dispatch( CORE_SITE )
						.setProactiveUserEngagementEnabled( undefined );
				} ).toThrow( 'enabled should be a boolean.' );

				expect( () => {
					registry
						.dispatch( CORE_SITE )
						.setProactiveUserEngagementEnabled( 'true' );
				} ).toThrow( 'enabled should be a boolean.' );

				expect( () => {
					registry
						.dispatch( CORE_SITE )
						.setProactiveUserEngagementEnabled( true );

					registry
						.dispatch( CORE_SITE )
						.setProactiveUserEngagementEnabled( false );
				} ).not.toThrow( 'enabled should be a boolean.' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getEmailReportingSettings', () => {
			it( 'uses a resolver to make a network request', async () => {
				const emailReportingSettings = {
					enabled: false,
				};

				fetchMock.getOnce( emailReportingSettingsEndpointRegExp, {
					body: emailReportingSettings,
					status: 200,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getEmailReportingSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getEmailReportingSettings();

				const settings = registry
					.select( CORE_SITE )
					.getEmailReportingSettings();

				expect( settings ).toEqual( emailReportingSettings );

				expect( fetchMock ).toHaveFetched(
					emailReportingSettingsEndpointRegExp
				);
			} );

			it( 'returns undefined if the request fails', async () => {
				fetchMock.getOnce( emailReportingSettingsEndpointRegExp, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getEmailReportingSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getEmailReportingSettings();

				const settings = registry
					.select( CORE_SITE )
					.getEmailReportingSettings();

				// Verify the settings are still undefined after the selector is resolved.
				expect( settings ).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetched(
					emailReportingSettingsEndpointRegExp
				);

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isEmailReportingEnabled', () => {
			it( 'returns false when settings are not loaded', () => {
				expect(
					registry.select( CORE_SITE ).isEmailReportingEnabled()
				).toBe( false );
			} );

			it( 'returns the enabled status when settings are loaded', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: true,
					} );

				expect(
					registry.select( CORE_SITE ).isEmailReportingEnabled()
				).toBe( true );
			} );

			it( 'returns false when enabled is false', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: false,
					} );

				expect(
					registry.select( CORE_SITE ).isEmailReportingEnabled()
				).toBe( false );
			} );
		} );
	} );
} );
