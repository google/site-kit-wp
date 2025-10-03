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

describe( 'core/user proactive user engagement settings', () => {
	let registry;

	const proactiveUserEngagementSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/proactive-user-engagement-settings'
	);

	let proactiveUserEngagementSettingsResponse;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );

		proactiveUserEngagementSettingsResponse = {
			subscribed: false,
			frequency: 'monthly',
		};
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'saveProactiveUserEngagementSettings', () => {
			it( 'should save settings', async () => {
				const settings = {
					subscribed: true,
					frequency: 'weekly',
				};

				fetchMock.postOnce( proactiveUserEngagementSettingsEndpoint, {
					body: settings,
					status: 200,
				} );

				await registry
					.dispatch( CORE_USER )
					.saveProactiveUserEngagementSettings( settings );

				expect( fetchMock ).toHaveFetched(
					proactiveUserEngagementSettingsEndpoint,
					{
						body: {
							data: {
								settings,
							},
						},
					}
				);

				expect(
					registry
						.select( CORE_USER )
						.getProactiveUserEngagementSettings()
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
					.receiveGetProactiveUserEngagementSettings( {
						subscribed: false,
						frequency: 'monthly',
					} );

				fetchMock.postOnce( proactiveUserEngagementSettingsEndpoint, {
					body: response,
					status: 400,
				} );

				const { error } = await registry
					.dispatch( CORE_USER )
					.saveProactiveUserEngagementSettings( {
						subscribed: true,
						frequency: 'weekly',
					} );

				expect( console ).toHaveErrored();
				expect( error ).toEqual( response );
			} );
		} );

		describe( 'setProactiveUserEngagementSettings', () => {
			it( 'should set the settings in the store', () => {
				const settings = {
					subscribed: true,
					frequency: 'quarterly',
				};

				registry
					.dispatch( CORE_USER )
					.setProactiveUserEngagementSettings( settings );

				expect(
					registry
						.select( CORE_USER )
						.getProactiveUserEngagementSettings()
				).toEqual( settings );
			} );
		} );

		describe( 'resetProactiveUserEngagementSettings', () => {
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
					.receiveGetProactiveUserEngagementSettings( savedSettings );

				// Modify the settings
				registry
					.dispatch( CORE_USER )
					.setProactiveUserEngagementSettings( modifiedSettings );

				// Verify they're modified
				expect(
					registry
						.select( CORE_USER )
						.getProactiveUserEngagementSettings()
				).toEqual( modifiedSettings );

				// Reset the settings
				await registry
					.dispatch( CORE_USER )
					.resetProactiveUserEngagementSettings();

				// Verify they're back to saved values
				expect(
					registry
						.select( CORE_USER )
						.getProactiveUserEngagementSettings()
				).toEqual( savedSettings );
			} );
		} );
	} );

	describe( 'setProactiveUserEngagementFrequency', () => {
		it( 'should set frequency in the store', () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetProactiveUserEngagementSettings( {
					subscribed: false,
					frequency: 'monthly',
				} );

			registry
				.dispatch( CORE_USER )
				.setProactiveUserEngagementFrequency( 'quarterly' );

			expect(
				registry
					.select( CORE_USER )
					.getProactiveUserEngagementSettings()
			).toEqual( { subscribed: false, frequency: 'quarterly' } );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getProactiveUserEngagementSettings', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.getOnce( proactiveUserEngagementSettingsEndpoint, {
					body: proactiveUserEngagementSettingsResponse,
				} );

				const initialSettings = registry
					.select( CORE_USER )
					.getProactiveUserEngagementSettings();

				expect( initialSettings ).toEqual( undefined );
				await untilResolved(
					registry,
					CORE_USER
				).getProactiveUserEngagementSettings();

				const settings = registry
					.select( CORE_USER )
					.getProactiveUserEngagementSettings();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( settings ).toEqual(
					proactiveUserEngagementSettingsResponse
				);
			} );

			it( 'should not make a network request if settings are already present', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetProactiveUserEngagementSettings(
						proactiveUserEngagementSettingsResponse
					);

				const settings = registry
					.select( CORE_USER )
					.getProactiveUserEngagementSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getProactiveUserEngagementSettings();

				expect( fetchMock ).not.toHaveFetched();
				expect( settings ).toEqual(
					proactiveUserEngagementSettingsResponse
				);
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( proactiveUserEngagementSettingsEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( CORE_USER )
					.getProactiveUserEngagementSettings();
				await untilResolved(
					registry,
					CORE_USER
				).getProactiveUserEngagementSettings();

				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const settings = registry
					.select( CORE_USER )
					.getProactiveUserEngagementSettings();
				expect( settings ).toEqual( undefined );
			} );
		} );

		describe( 'isProactiveUserEngagementSubscribed', () => {
			it( 'should return false when subscribed is false', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetProactiveUserEngagementSettings( {
						subscribed: false,
						frequency: 'monthly',
					} );

				expect(
					registry
						.select( CORE_USER )
						.isProactiveUserEngagementSubscribed()
				).toBe( false );
			} );

			it( 'should return true when subscribed is true', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetProactiveUserEngagementSettings( {
						subscribed: true,
						frequency: 'weekly',
					} );

				expect(
					registry
						.select( CORE_USER )
						.isProactiveUserEngagementSubscribed()
				).toBe( true );
			} );

			it( 'should return false when settings are undefined', () => {
				expect(
					registry
						.select( CORE_USER )
						.isProactiveUserEngagementSubscribed()
				).toBe( false );
			} );
		} );

		describe( 'haveProactiveUserEngagementSettingsChanged', () => {
			it( 'should return false when settings have not changed', () => {
				const settings = {
					subscribed: false,
					frequency: 'monthly',
				};

				registry
					.dispatch( CORE_USER )
					.receiveGetProactiveUserEngagementSettings( settings );

				expect(
					registry
						.select( CORE_USER )
						.haveProactiveUserEngagementSettingsChanged()
				).toBe( false );
			} );

			it( 'should return true when settings have changed', () => {
				const originalSettings = {
					subscribed: false,
					frequency: 'monthly',
				};

				registry
					.dispatch( CORE_USER )
					.receiveGetProactiveUserEngagementSettings(
						originalSettings
					);

				registry
					.dispatch( CORE_USER )
					.setProactiveUserEngagementSettings( {
						subscribed: true,
						frequency: 'weekly',
					} );

				expect(
					registry
						.select( CORE_USER )
						.haveProactiveUserEngagementSettingsChanged()
				).toBe( true );
			} );
		} );

		describe( 'isSavingProactiveUserEngagementSettings', () => {
			it( 'should return false when not saving', () => {
				expect(
					registry
						.select( CORE_USER )
						.isSavingProactiveUserEngagementSettings()
				).toBe( false );
			} );

			it( 'should return true when saving', async () => {
				fetchMock.postOnce( proactiveUserEngagementSettingsEndpoint, {
					body: { subscribed: true, frequency: 'weekly' },
				} );

				const promise = registry
					.dispatch( CORE_USER )
					.saveProactiveUserEngagementSettings( {
						subscribed: true,
						frequency: 'weekly',
					} );

				expect(
					registry
						.select( CORE_USER )
						.isSavingProactiveUserEngagementSettings()
				).toBe( true );

				await promise;

				expect(
					registry
						.select( CORE_USER )
						.isSavingProactiveUserEngagementSettings()
				).toBe( false );
			} );
		} );

		describe( 'getProactiveUserEngagementFrequency', () => {
			it( 'should return weekly by default when frequency is not previously set', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetProactiveUserEngagementSettings( {
						subscribed: true,
					} );

				expect(
					registry
						.select( CORE_USER )
						.getProactiveUserEngagementFrequency()
				).toBe( 'weekly' );
			} );

			it( 'should return the stored frequency when set', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetProactiveUserEngagementSettings( {
						subscribed: false,
						frequency: 'monthly',
					} );

				expect(
					registry
						.select( CORE_USER )
						.getProactiveUserEngagementFrequency()
				).toBe( 'monthly' );
			} );

			it( 'should update after setProactiveUserEngagementFrequency is dispatched', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetProactiveUserEngagementSettings( {
						subscribed: false,
						frequency: 'monthly',
					} );

				registry
					.dispatch( CORE_USER )
					.setProactiveUserEngagementFrequency( 'weekly' );

				expect(
					registry
						.select( CORE_USER )
						.getProactiveUserEngagementFrequency()
				).toBe( 'weekly' );
			} );
		} );
	} );

	describe( 'getProactiveUserEngagementSavedFrequency', () => {
		it( 'should return undefined when no saved settings are present', () => {
			expect(
				registry
					.select( CORE_USER )
					.getProactiveUserEngagementSavedFrequency()
			).toBe( undefined );
		} );

		it( 'should return the saved frequency when settings have been received', () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetProactiveUserEngagementSettings( {
					subscribed: false,
					frequency: 'monthly',
				} );

			expect(
				registry
					.select( CORE_USER )
					.getProactiveUserEngagementSavedFrequency()
			).toBe( 'monthly' );
		} );

		it( 'should not change when only the current in-store frequency is updated', () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetProactiveUserEngagementSettings( {
					subscribed: false,
					frequency: 'monthly',
				} );

			// Update only the current working settings (not saved).
			registry
				.dispatch( CORE_USER )
				.setProactiveUserEngagementFrequency( 'weekly' );

			// Saved frequency should remain unchanged.
			expect(
				registry
					.select( CORE_USER )
					.getProactiveUserEngagementSavedFrequency()
			).toBe( 'monthly' );
		} );

		it( 'should update after saveProactiveUserEngagementSettings is dispatched', async () => {
			const newSettings = {
				subscribed: true,
				frequency: 'weekly',
			};

			fetchMock.postOnce( proactiveUserEngagementSettingsEndpoint, {
				body: newSettings,
				status: 200,
			} );

			await registry
				.dispatch( CORE_USER )
				.saveProactiveUserEngagementSettings( newSettings );

			expect(
				registry
					.select( CORE_USER )
					.getProactiveUserEngagementSavedFrequency()
			).toBe( 'weekly' );
		} );
	} );
} );
