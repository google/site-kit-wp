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
import {
	createTestRegistry,
	provideModules,
	untilResolved,
} from '@tests/js/utils';
import { CORE_USER } from './constants';

describe( 'core/user email reporting settings', () => {
	let registry;

	const emailReportingSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/email-reporting-settings'
	);
	const emailReportingNextReportEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/email-reporting-next-report'
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
		describe( 'invalidateEmailReportingNextReport', () => {
			it( 'keeps showing the previous timestamp until the fresh one arrives, then re-fetches exactly once', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingNextReport( {
						timestamp: 1_800_000_000,
					} );

				expect(
					registry
						.select( CORE_USER )
						.getEmailReportingNextReportTimestamp()
				).toEqual( 1_800_000_000 );

				fetchMock.getOnce( emailReportingNextReportEndpoint, {
					body: { timestamp: 1_900_000_000 },
				} );

				const dispatchPromise = registry
					.dispatch( CORE_USER )
					.invalidateEmailReportingNextReport();

				// The stale value should remain visible while the request is
				// in flight, rather than being cleared to `undefined` first,
				// so consuming components don't flash empty while refetching.
				expect(
					registry
						.select( CORE_USER )
						.getEmailReportingNextReportTimestamp()
				).toEqual( 1_800_000_000 );

				await dispatchPromise;

				expect(
					registry
						.select( CORE_USER )
						.getEmailReportingNextReportTimestamp()
				).toEqual( 1_900_000_000 );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'keeps showing the previous timestamp if the refetch fails', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingNextReport( {
						timestamp: 1_800_000_000,
					} );

				fetchMock.getOnce( emailReportingNextReportEndpoint, {
					body: {
						code: 'internal_server_error',
						message: 'Internal server error',
						data: { status: 500 },
					},
					status: 500,
				} );

				await registry
					.dispatch( CORE_USER )
					.invalidateEmailReportingNextReport();

				expect( console ).toHaveErrored();

				// A failed refetch should not wipe out the last known-good
				// value; the previous (possibly now-stale) date is still a
				// better experience than showing nothing.
				expect(
					registry
						.select( CORE_USER )
						.getEmailReportingNextReportTimestamp()
				).toEqual( 1_800_000_000 );
			} );
		} );

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

				// The frequency is changing (from unset), so saving triggers
				// an immediate refetch of the next report timestamp.
				fetchMock.getOnce( emailReportingNextReportEndpoint, {
					body: { timestamp: 1_800_000_000 },
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

			it( 'should invalidate the cached next report timestamp after a successful save', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingNextReport( {
						timestamp: 1_800_000_000,
					} );

				fetchMock.postOnce( emailReportingSettingsEndpoint, {
					body: {
						subscribed: true,
						frequency: 'weekly',
					},
					status: 200,
				} );

				// The stale timestamp should be discarded and a fresh value
				// fetched from the server, rather than continuing to display
				// the timestamp computed for the previous frequency.
				fetchMock.getOnce( emailReportingNextReportEndpoint, {
					body: { timestamp: 1_900_000_000 },
				} );

				await registry
					.dispatch( CORE_USER )
					.saveEmailReportingSettings( {
						subscribed: true,
						frequency: 'weekly',
					} );

				// Accessing the selector kicks off the (invalidated) resolver
				// so it re-fetches from the server.
				registry
					.select( CORE_USER )
					.getEmailReportingNextReportTimestamp();

				await untilResolved(
					registry,
					CORE_USER
				).getEmailReportingNextReportTimestamp();

				expect(
					registry
						.select( CORE_USER )
						.getEmailReportingNextReportTimestamp()
				).toEqual( 1_900_000_000 );
			} );

			it( 'should not invalidate the cached next report timestamp when the frequency is unchanged', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
						frequency: 'monthly',
					} );

				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingNextReport( {
						timestamp: 1_800_000_000,
					} );

				fetchMock.postOnce( emailReportingSettingsEndpoint, {
					body: {
						subscribed: true,
						frequency: 'monthly',
					},
					status: 200,
				} );

				// Only the `subscribed` flag changes here; the frequency
				// stays the same, so the cached timestamp is still accurate
				// and should not be invalidated (which would otherwise cause
				// an unnecessary network request).
				await registry
					.dispatch( CORE_USER )
					.saveEmailReportingSettings( {
						subscribed: true,
					} );

				expect(
					registry
						.select( CORE_USER )
						.getEmailReportingNextReportTimestamp()
				).toEqual( 1_800_000_000 );
				expect( fetchMock ).not.toHaveFetched(
					emailReportingNextReportEndpoint
				);
			} );

			it( 'should not invalidate the cached next report timestamp when the save fails', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
						frequency: 'monthly',
					} );

				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingNextReport( {
						timestamp: 1_800_000_000,
					} );

				fetchMock.postOnce( emailReportingSettingsEndpoint, {
					body: {
						code: 'invalid_param',
						message: 'Invalid frequency value.',
						data: {},
					},
					status: 400,
				} );

				await registry
					.dispatch( CORE_USER )
					.saveEmailReportingSettings( {
						subscribed: true,
						frequency: 'weekly',
					} );

				expect( console ).toHaveErrored();
				expect(
					registry
						.select( CORE_USER )
						.getEmailReportingNextReportTimestamp()
				).toEqual( 1_800_000_000 );
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

				// The frequency is changing (from unset), so saving triggers
				// an immediate refetch of the next report timestamp.
				fetchMock.getOnce( emailReportingNextReportEndpoint, {
					body: { timestamp: 1_800_000_000 },
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

	describe( 'getEmailReportingNextReportTimestamp', () => {
		it( 'should use a resolver to make a network request', async () => {
			fetchMock.getOnce( emailReportingNextReportEndpoint, {
				body: { timestamp: 1_800_000_000 },
			} );

			const initialTimestamp = registry
				.select( CORE_USER )
				.getEmailReportingNextReportTimestamp();

			expect( initialTimestamp ).toEqual( undefined );
			await untilResolved(
				registry,
				CORE_USER
			).getEmailReportingNextReportTimestamp();

			const timestamp = registry
				.select( CORE_USER )
				.getEmailReportingNextReportTimestamp();

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( timestamp ).toEqual( 1_800_000_000 );
		} );

		it( 'should not make a network request if the timestamp is already present', async () => {
			registry.dispatch( CORE_USER ).receiveGetEmailReportingNextReport( {
				timestamp: 1_800_000_000,
			} );

			const timestamp = registry
				.select( CORE_USER )
				.getEmailReportingNextReportTimestamp();

			await untilResolved(
				registry,
				CORE_USER
			).getEmailReportingNextReportTimestamp();

			expect( fetchMock ).not.toHaveFetched();
			expect( timestamp ).toEqual( 1_800_000_000 );
		} );

		it( 'should dispatch an error if the request fails', async () => {
			const response = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};

			fetchMock.getOnce( emailReportingNextReportEndpoint, {
				body: response,
				status: 500,
			} );

			registry.select( CORE_USER ).getEmailReportingNextReportTimestamp();
			await untilResolved(
				registry,
				CORE_USER
			).getEmailReportingNextReportTimestamp();

			expect( console ).toHaveErrored();
			expect( fetchMock ).toHaveFetchedTimes( 1 );

			const timestamp = registry
				.select( CORE_USER )
				.getEmailReportingNextReportTimestamp();
			expect( timestamp ).toEqual( undefined );
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

			// The frequency is changing (from unset), so saving triggers an
			// immediate refetch of the next report timestamp.
			fetchMock.getOnce( emailReportingNextReportEndpoint, {
				body: { timestamp: 1_800_000_000 },
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
