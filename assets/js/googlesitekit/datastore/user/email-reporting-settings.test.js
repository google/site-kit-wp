/**
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
import { CORE_USER } from './constants';
import {
	createTestRegistry,
	provideModules,
	untilResolved,
} from '../../../../../tests/js/utils';

describe( 'core/user email reporting settings', () => {
	let registry;

	const emailReportingSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/email-reporting-settings'
	);

	let emailReportingSettingsResponse;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );

		emailReportingSettingsResponse = {
			subscribed: false,
			frequency: 'monthly',
		};
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'saveEmailReportingSettings', () => {
			it( 'should save settings', async () => {
				const settings = {
					subscribed: true,
					frequency: 'weekly',
				};

				fetchMock.postOnce( emailReportingSettingsEndpoint, {
					body: settings,
					status: 200,
				} );

				await registry
					.dispatch( CORE_USER )
					.saveEmailReportingSettings( settings );

				expect( fetchMock ).toHaveFetched(
					emailReportingSettingsEndpoint,
					{
						body: {
							data: {
								settings,
							},
						},
					}
				);

				expect(
					registry.select( CORE_USER ).getEmailReportingSettings()
				).toEqual( settings );
			} );

			it( 'should handle errors when saving settings', async () => {
				const response = {
					code: 'invalid_param',
					message: 'Invalid frequency value.',
					data: {},
				};

				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
						frequency: 'monthly',
					} );

				fetchMock.postOnce( emailReportingSettingsEndpoint, {
					body: response,
					status: 400,
				} );

				const { error } = await registry
					.dispatch( CORE_USER )
					.saveEmailReportingSettings( {
						subscribed: true,
						frequency: 'weekly',
					} );

				expect( console ).toHaveErrored();
				expect( error ).toEqual( response );
			} );
		} );

		describe( 'setEmailReportingSettings', () => {
			it( 'should set the settings in the store', () => {
				const settings = {
					subscribed: true,
					frequency: 'quarterly',
				};

				registry
					.dispatch( CORE_USER )
					.setEmailReportingSettings( settings );

				expect(
					registry.select( CORE_USER ).getEmailReportingSettings()
				).toEqual( settings );
			} );
		} );

		describe( 'resetEmailReportingSettings', () => {
			it( 'should reset settings to saved values', async () => {
				const savedSettings = {
					subscribed: false,
					frequency: 'monthly',
				};
				const modifiedSettings = {
					subscribed: true,
					frequency: 'weekly',
				};

				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( savedSettings );

				// Modify the settings
				registry
					.dispatch( CORE_USER )
					.setEmailReportingSettings( modifiedSettings );

				// Verify they're modified
				expect(
					registry.select( CORE_USER ).getEmailReportingSettings()
				).toEqual( modifiedSettings );

				// Reset the settings
				await registry
					.dispatch( CORE_USER )
					.resetEmailReportingSettings();

				// Verify they're back to saved values
				expect(
					registry.select( CORE_USER ).getEmailReportingSettings()
				).toEqual( savedSettings );
			} );
		} );
	} );

	describe( 'setEmailReportingFrequency', () => {
		it( 'should set frequency in the store', () => {
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: false,
				frequency: 'monthly',
			} );

			registry
				.dispatch( CORE_USER )
				.setEmailReportingFrequency( 'quarterly' );

			expect(
				registry.select( CORE_USER ).getEmailReportingSettings()
			).toEqual( { subscribed: false, frequency: 'quarterly' } );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getEmailReportingSettings', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.getOnce( emailReportingSettingsEndpoint, {
					body: emailReportingSettingsResponse,
				} );

				const initialSettings = registry
					.select( CORE_USER )
					.getEmailReportingSettings();

				expect( initialSettings ).toEqual( undefined );
				await untilResolved(
					registry,
					CORE_USER
				).getEmailReportingSettings();

				const settings = registry
					.select( CORE_USER )
					.getEmailReportingSettings();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( settings ).toEqual( emailReportingSettingsResponse );
			} );

			it( 'should not make a network request if settings are already present', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings(
						emailReportingSettingsResponse
					);

				const settings = registry
					.select( CORE_USER )
					.getEmailReportingSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getEmailReportingSettings();

				expect( fetchMock ).not.toHaveFetched();
				expect( settings ).toEqual( emailReportingSettingsResponse );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( emailReportingSettingsEndpoint, {
					body: response,
					status: 500,
				} );

				registry.select( CORE_USER ).getEmailReportingSettings();
				await untilResolved(
					registry,
					CORE_USER
				).getEmailReportingSettings();

				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const settings = registry
					.select( CORE_USER )
					.getEmailReportingSettings();
				expect( settings ).toEqual( undefined );
			} );
		} );

		describe( 'isEmailReportingSubscribed', () => {
			it( 'should return false when subscribed is false', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
						frequency: 'monthly',
					} );

				expect(
					registry.select( CORE_USER ).isEmailReportingSubscribed()
				).toBe( false );
			} );

			it( 'should return true when subscribed is true', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: true,
						frequency: 'weekly',
					} );

				expect(
					registry.select( CORE_USER ).isEmailReportingSubscribed()
				).toBe( true );
			} );

			it( 'should return false when settings are undefined', () => {
				expect(
					registry.select( CORE_USER ).isEmailReportingSubscribed()
				).toBe( false );
			} );
		} );

		describe( 'haveEmailReportingSettingsChanged', () => {
			it( 'should return false when settings have not changed', () => {
				const settings = {
					subscribed: false,
					frequency: 'monthly',
				};

				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( settings );

				expect(
					registry
						.select( CORE_USER )
						.haveEmailReportingSettingsChanged()
				).toBe( false );
			} );

			it( 'should return true when settings have changed', () => {
				const originalSettings = {
					subscribed: false,
					frequency: 'monthly',
				};

				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( originalSettings );

				registry.dispatch( CORE_USER ).setEmailReportingSettings( {
					subscribed: true,
					frequency: 'weekly',
				} );

				expect(
					registry
						.select( CORE_USER )
						.haveEmailReportingSettingsChanged()
				).toBe( true );
			} );
		} );

		describe( 'isSavingEmailReportingSettings', () => {
			it( 'should return false when not saving', () => {
				expect(
					registry
						.select( CORE_USER )
						.isSavingEmailReportingSettings()
				).toBe( false );
			} );

			it( 'should return true when saving', async () => {
				fetchMock.postOnce( emailReportingSettingsEndpoint, {
					body: { subscribed: true, frequency: 'weekly' },
				} );

				const promise = registry
					.dispatch( CORE_USER )
					.saveEmailReportingSettings( {
						subscribed: true,
						frequency: 'weekly',
					} );

				expect(
					registry
						.select( CORE_USER )
						.isSavingEmailReportingSettings()
				).toBe( true );

				await promise;

				expect(
					registry
						.select( CORE_USER )
						.isSavingEmailReportingSettings()
				).toBe( false );
			} );
		} );

		describe( 'getEmailReportingFrequency', () => {
			it( 'should return undefined when settings are loading', () => {
				expect(
					registry.select( CORE_USER ).getEmailReportingFrequency()
				).toBe( undefined );
			} );

			it( 'should return weekly by default when frequency is not previously set', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: true,
					} );

				expect(
					registry.select( CORE_USER ).getEmailReportingFrequency()
				).toBe( 'weekly' );
			} );

			it( 'should return the stored frequency when set', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
						frequency: 'monthly',
					} );

				expect(
					registry.select( CORE_USER ).getEmailReportingFrequency()
				).toBe( 'monthly' );
			} );

			it( 'should update after setEmailReportingFrequency is dispatched', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
						frequency: 'monthly',
					} );

				registry
					.dispatch( CORE_USER )
					.setEmailReportingFrequency( 'weekly' );

				expect(
					registry.select( CORE_USER ).getEmailReportingFrequency()
				).toBe( 'weekly' );
			} );
		} );
	} );

	describe( 'getEmailReportingSavedFrequency', () => {
		it( 'should return undefined when no saved settings are present', () => {
			expect(
				registry.select( CORE_USER ).getEmailReportingSavedFrequency()
			).toBe( undefined );
		} );

		it( 'should return the saved frequency when settings have been received', () => {
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: false,
				frequency: 'monthly',
			} );

			expect(
				registry.select( CORE_USER ).getEmailReportingSavedFrequency()
			).toBe( 'monthly' );
		} );

		it( 'should not change when only the current in-store frequency is updated', () => {
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: false,
				frequency: 'monthly',
			} );

			// Update only the current working settings (not saved).
			registry
				.dispatch( CORE_USER )
				.setEmailReportingFrequency( 'weekly' );

			// Saved frequency should remain unchanged.
			expect(
				registry.select( CORE_USER ).getEmailReportingSavedFrequency()
			).toBe( 'monthly' );
		} );

		it( 'should update after saveEmailReportingSettings is dispatched', async () => {
			const newSettings = {
				subscribed: true,
				frequency: 'weekly',
			};

			fetchMock.postOnce( emailReportingSettingsEndpoint, {
				body: newSettings,
				status: 200,
			} );

			await registry
				.dispatch( CORE_USER )
				.saveEmailReportingSettings( newSettings );

			expect(
				registry.select( CORE_USER ).getEmailReportingSavedFrequency()
			).toBe( 'weekly' );
		} );
	} );
} );
