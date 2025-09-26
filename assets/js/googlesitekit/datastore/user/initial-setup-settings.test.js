/**
 * `core/user` data store: initial setup settings tests.
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
import { CORE_USER } from './constants';
import {
	createTestRegistry,
	freezeFetch,
	muteFetch,
	provideModules,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';

describe( 'core/user initial setup settings', () => {
	let registry;
	let store;

	const initialSetupSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/initial-setup-settings'
	);

	let initialSetupSettingsResponse;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		store = registry.stores[ CORE_USER ].store;

		initialSetupSettingsResponse = {
			isAnalyticsSetupComplete: true,
		};
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'saveInitialSetupSettings', () => {
			beforeEach( () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetInitialSetupSettings(
						initialSetupSettingsResponse
					);
				registry
					.dispatch( CORE_USER )
					.finishResolution( 'getInitialSetupSettings', [] );
			} );

			it( 'should throw if settings is not an object', () => {
				expect( () =>
					registry
						.dispatch( CORE_USER )
						.saveInitialSetupSettings( 'invalid' )
				).toThrow(
					'Initial setup settings should be an object to save.'
				);
			} );

			it( 'should save settings from the store when no arguments are provided', async () => {
				const existingSettings = {
					isAnalyticsSetupComplete: false,
				};

				registry
					.dispatch( CORE_USER )
					.receiveGetInitialSetupSettings( existingSettings );

				registry
					.dispatch( CORE_USER )
					.finishResolution( 'getInitialSetupSettings', [] );

				registry
					.dispatch( CORE_USER )
					.setIsAnalyticsSetupComplete( true );

				const expectedSettings = {
					isAnalyticsSetupComplete: true,
				};

				fetchMock.postOnce( initialSetupSettingsEndpoint, {
					body: expectedSettings,
					status: 200,
				} );

				await registry.dispatch( CORE_USER ).saveInitialSetupSettings();

				expect( fetchMock ).toHaveFetched(
					initialSetupSettingsEndpoint,
					{
						body: {
							data: {
								settings: expectedSettings,
							},
						},
					}
				);

				expect(
					registry.select( CORE_USER ).getInitialSetupSettings()
				).toEqual( expectedSettings );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should save provided settings and update the store', async () => {
				const settingsToSave = {
					isAnalyticsSetupComplete: false,
				};

				fetchMock.postOnce( initialSetupSettingsEndpoint, {
					body: settingsToSave,
					status: 200,
				} );

				await registry
					.dispatch( CORE_USER )
					.saveInitialSetupSettings( settingsToSave );

				expect( fetchMock ).toHaveFetched(
					initialSetupSettingsEndpoint,
					{
						body: {
							data: {
								settings: settingsToSave,
							},
						},
					}
				);

				expect( store.getState().initialSetupSettings ).toEqual(
					settingsToSave
				);
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const existingSettings = {
					isAnalyticsSetupComplete: false,
				};
				const settingsToSave = {
					isAnalyticsSetupComplete: true,
				};
				const finalSettings = {
					...existingSettings,
					...settingsToSave,
				};
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				registry
					.dispatch( CORE_USER )
					.receiveGetInitialSetupSettings( existingSettings );

				registry
					.dispatch( CORE_USER )
					.finishResolution( 'getInitialSetupSettings', [] );

				fetchMock.post( initialSetupSettingsEndpoint, {
					body: response,
					status: 500,
				} );

				const { error } = await registry
					.dispatch( CORE_USER )
					.saveInitialSetupSettings( settingsToSave );

				expect( console ).toHaveErrored();
				expect( error ).toEqual( response );
				expect(
					registry
						.select( CORE_USER )
						.getErrorForAction( 'saveInitialSetupSettings', [
							finalSettings,
						] )
				).toMatchObject( response );
			} );
		} );

		describe( 'setIsAnalyticsSetupComplete', () => {
			it( 'should throw when value is not a boolean', () => {
				expect( () =>
					registry
						.dispatch( CORE_USER )
						.setIsAnalyticsSetupComplete( 'yes' )
				).toThrow(
					'Analytics setup completeness should be a boolean.'
				);
			} );

			it( 'should set the value in the store', () => {
				registry
					.dispatch( CORE_USER )
					.setIsAnalyticsSetupComplete( true );

				expect(
					registry.select( CORE_USER ).isAnalyticsSetupComplete()
				).toBe( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getInitialSetupSettings', () => {
			it( 'should return undefined while settings are loading', async () => {
				freezeFetch( initialSetupSettingsEndpoint );

				expect(
					registry.select( CORE_USER ).getInitialSetupSettings()
				).toBeUndefined();

				await waitForDefaultTimeouts();
			} );

			it( 'should not make a network request if settings are already present', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetInitialSetupSettings(
						initialSetupSettingsResponse
					);

				registry.select( CORE_USER ).getInitialSetupSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getInitialSetupSettings();

				expect( fetchMock ).not.toHaveFetched();
				expect(
					registry.select( CORE_USER ).getInitialSetupSettings()
				).toEqual( initialSetupSettingsResponse );
			} );

			it( 'should fetch settings via the resolver when not loaded', async () => {
				fetchMock.getOnce( initialSetupSettingsEndpoint, {
					body: initialSetupSettingsResponse,
					status: 200,
				} );

				registry.select( CORE_USER ).getInitialSetupSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getInitialSetupSettings();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry.select( CORE_USER ).getInitialSetupSettings()
				).toEqual( initialSetupSettingsResponse );
			} );
		} );

		describe( 'isAnalyticsSetupComplete', () => {
			it( 'should return undefined when settings are not loaded', async () => {
				freezeFetch( initialSetupSettingsEndpoint );

				expect(
					registry.select( CORE_USER ).isAnalyticsSetupComplete()
				).toBeUndefined();
				await waitForDefaultTimeouts();
			} );

			it( 'should use a resolver to make a network request if data is not available', async () => {
				fetchMock.getOnce( initialSetupSettingsEndpoint, {
					body: initialSetupSettingsResponse,
					status: 200,
				} );

				expect(
					registry.select( CORE_USER ).isAnalyticsSetupComplete()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_USER
				).getInitialSetupSettings();

				expect(
					registry.select( CORE_USER ).isAnalyticsSetupComplete()
				).toEqual(
					initialSetupSettingsResponse.isAnalyticsSetupComplete
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should return the stored value when settings are available', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetInitialSetupSettings(
						initialSetupSettingsResponse
					);

				registry
					.dispatch( CORE_USER )
					.finishResolution( 'getInitialSetupSettings', [] );

				expect(
					registry.select( CORE_USER ).isAnalyticsSetupComplete()
				).toBe( true );
			} );
		} );

		describe( 'isSavingInitialSetupSettings', () => {
			it( 'should return false when settings are not being saved', () => {
				expect(
					registry.select( CORE_USER ).isSavingInitialSetupSettings()
				).toBe( false );
			} );

			it( 'should return true while settings are being saved', async () => {
				muteFetch( initialSetupSettingsEndpoint );

				const promise = registry
					.dispatch( CORE_USER )
					.fetchSaveInitialSetupSettings(
						initialSetupSettingsResponse
					);

				expect(
					registry.select( CORE_USER ).isSavingInitialSetupSettings()
				).toBe( true );

				await promise;

				expect(
					registry.select( CORE_USER ).isSavingInitialSetupSettings()
				).toBe( false );
			} );
		} );
	} );
} );
