/**
 * `modules/analytics-4` data store: audience settings tests.
 *
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
	freezeFetch,
	muteFetch,
	provideModules,
	unsubscribeFromAll,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

describe( 'modules/analytics-4 audience settings', () => {
	let registry;
	let store;

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/audience-settings'
	);

	const audienceSettingsResponse = {
		configuredAudiences: [ 'audienceA', 'audienceB' ],
		isAudienceSegmentationWidgetHidden: false,
	};

	const audienceSettingsSortedResponse = {
		configuredAudiences: [ 'audienceB', 'audienceA' ],
		isAudienceSegmentationWidgetHidden: false,
	};

	const availableAudiences = [
		{
			name: 'audienceA',
			description: 'Audience A',
			displayName: 'Audience A',
			audienceType: 'DEFAULT_AUDIENCE',
			audienceSlug: 'audience-a',
		},
		{
			name: 'audienceB',
			description: 'Audience B',
			displayName: 'Audience B',
			audienceType: 'SITE_KIT_AUDIENCE',
			audienceSlug: 'audience-b',
		},
	];

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		store = registry.stores[ CORE_USER ].store;
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'setConfiguredAudiences', () => {
			it( 'should throw an error if the provided audiences are not an array', () => {
				expect( () => {
					registry
						.dispatch( CORE_USER )
						.setConfiguredAudiences( 'audienceA' );
				} ).toThrow( 'Configured audiences should be an array.' );
			} );

			it( 'should set the provided audiences in the store', () => {
				registry
					.dispatch( CORE_USER )
					.setConfiguredAudiences(
						audienceSettingsResponse.configuredAudiences
					);

				expect(
					registry.select( CORE_USER ).getConfiguredAudiences()
				).toEqual( audienceSettingsResponse.configuredAudiences );
			} );
		} );

		describe( 'setAudienceSegmentationWidgetHidden', () => {
			it( 'should throw an error if the provided value is not a boolean', () => {
				expect( () => {
					registry
						.dispatch( CORE_USER )
						.setAudienceSegmentationWidgetHidden( 'audienceA' );
				} ).toThrow(
					'Audience segmentation widget visibility should be a boolean.'
				);
			} );

			it( 'should set the audience segmentation widget visibility in the store', () => {
				registry
					.dispatch( CORE_USER )
					.setAudienceSegmentationWidgetHidden( true );

				expect(
					registry
						.select( CORE_USER )
						.isAudienceSegmentationWidgetHidden()
				).toEqual( true );
			} );
		} );

		describe( 'saveAudienceSettings', () => {
			beforeEach( () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiences );
				registry
					.dispatch( CORE_USER )
					.setConfiguredAudiences(
						audienceSettingsResponse.configuredAudiences
					);
				registry
					.dispatch( CORE_USER )
					.setAudienceSegmentationWidgetHidden(
						audienceSettingsResponse.isAudienceSegmentationWidgetHidden
					);
			} );

			it( 'should save settings and add it to the store', async () => {
				fetchMock.postOnce( audienceSettingsEndpoint, {
					body: audienceSettingsResponse,
					status: 200,
				} );

				await registry.dispatch( CORE_USER ).saveAudienceSettings();

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( audienceSettingsEndpoint, {
					body: {
						data: {
							settings: audienceSettingsSortedResponse,
						},
					},
				} );

				expect( store.getState().audienceSettings ).toMatchObject( {
					settings: audienceSettingsResponse,
					savedSettings: audienceSettingsResponse,
				} );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( audienceSettingsEndpoint, {
					body: response,
					status: 500,
				} );

				await registry.dispatch( CORE_USER ).saveAudienceSettings();

				expect(
					registry
						.select( CORE_USER )
						.getErrorForAction( 'saveAudienceSettings', [] )
				).toMatchObject( response );

				expect( console ).toHaveErrored();
			} );

			it( 'optionally saves additional settings besides whatever is stored', async () => {
				const audienceSettings = {
					...audienceSettingsSortedResponse,
					isAudienceSegmentationWidgetHidden: true,
				};

				fetchMock.postOnce( audienceSettingsEndpoint, {
					body: audienceSettings,
					status: 200,
				} );

				await registry.dispatch( CORE_USER ).saveAudienceSettings( {
					isAudienceSegmentationWidgetHidden: true,
				} );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( audienceSettingsEndpoint, {
					body: {
						data: {
							settings: audienceSettings,
						},
					},
				} );

				expect( store.getState().audienceSettings ).toMatchObject( {
					settings: audienceSettings,
					savedSettings: audienceSettings,
				} );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAudienceSettings', () => {
			it( 'should return undefined while audience settings are loading', async () => {
				freezeFetch( audienceSettingsEndpoint );

				expect(
					registry.select( CORE_USER ).getAudienceSettings()
				).toBeUndefined();

				await waitForDefaultTimeouts();
			} );

			it( 'should not make a network request if audience settings exist', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetAudienceSettings( audienceSettingsResponse );

				registry.select( CORE_USER ).getAudienceSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getAudienceSettings();

				expect( fetchMock ).not.toHaveFetched(
					audienceSettingsEndpoint
				);
			} );

			it( 'should use a resolver to make a network request if data is not available', async () => {
				fetchMock.getOnce( audienceSettingsEndpoint, {
					body: audienceSettingsResponse,
					status: 200,
				} );

				registry.select( CORE_USER ).getAudienceSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getAudienceSettings();

				expect( fetchMock ).toHaveFetched( audienceSettingsEndpoint, {
					body: {
						settings: audienceSettingsResponse,
					},
				} );

				expect(
					registry.select( CORE_USER ).getAudienceSettings()
				).toMatchObject( audienceSettingsResponse );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );

		describe( 'getConfiguredAudiences', () => {
			it( 'should return undefined while audience settings are loading', async () => {
				freezeFetch( audienceSettingsEndpoint );

				expect(
					registry.select( CORE_USER ).getConfiguredAudiences()
				).toBeUndefined();

				await waitForDefaultTimeouts();
			} );

			it( 'should use a resolver to make a network request if data is not available', async () => {
				fetchMock.getOnce( audienceSettingsEndpoint, {
					body: audienceSettingsResponse,
					status: 200,
				} );

				expect(
					registry.select( CORE_USER ).getConfiguredAudiences()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_USER
				).getAudienceSettings();

				expect(
					registry.select( CORE_USER ).getConfiguredAudiences()
				).toEqual( audienceSettingsResponse.configuredAudiences );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should return the configured audiences from the audience settings', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetAudienceSettings( audienceSettingsResponse );

				expect(
					registry.select( CORE_USER ).getConfiguredAudiences()
				).toEqual( audienceSettingsResponse.configuredAudiences );
			} );
		} );

		describe( 'isAudienceSegmentationWidgetHidden', () => {
			it( 'should return undefined while audience settings are loading', async () => {
				freezeFetch( audienceSettingsEndpoint );

				expect(
					registry
						.select( CORE_USER )
						.isAudienceSegmentationWidgetHidden()
				).toBeUndefined();

				await waitForDefaultTimeouts();
			} );

			it( 'should use a resolver to make a network request if data is not available', async () => {
				fetchMock.getOnce( audienceSettingsEndpoint, {
					body: audienceSettingsResponse,
					status: 200,
				} );

				expect(
					registry
						.select( CORE_USER )
						.isAudienceSegmentationWidgetHidden()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_USER
				).getAudienceSettings();

				expect(
					registry
						.select( CORE_USER )
						.isAudienceSegmentationWidgetHidden()
				).toEqual(
					audienceSettingsResponse.isAudienceSegmentationWidgetHidden
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should return the audience segmentation widget visibility from the audience settings', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetAudienceSettings( audienceSettingsResponse );

				expect(
					registry
						.select( CORE_USER )
						.isAudienceSegmentationWidgetHidden()
				).toEqual(
					audienceSettingsResponse.isAudienceSegmentationWidgetHidden
				);
			} );
		} );

		describe( 'haveConfiguredAudiencesChanged', () => {
			it( 'should compare the current configured audiences with the saved ones', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetAudienceSettings( audienceSettingsResponse );

				const hasChanged = registry
					.select( CORE_USER )
					.haveConfiguredAudiencesChanged();

				expect( hasChanged ).toBe( false );

				// Change the settings.
				registry
					.dispatch( CORE_USER )
					.setConfiguredAudiences( [ 'audienceC' ] );

				const hasChangedAfterSet = registry
					.select( CORE_USER )
					.haveConfiguredAudiencesChanged();

				expect( hasChangedAfterSet ).toBe( true );
			} );
		} );

		describe( 'isSavingAudienceSettings', () => {
			it( 'should return false if audience settings are not being saved', () => {
				expect(
					registry.select( CORE_USER ).isSavingAudienceSettings()
				).toBe( false );
			} );

			it( 'should return true if audience settings are being saved', async () => {
				muteFetch( audienceSettingsEndpoint );

				const promise = registry
					.dispatch( CORE_USER )
					.fetchSaveAudienceSettings( audienceSettingsResponse );

				expect(
					registry.select( CORE_USER ).isSavingAudienceSettings()
				).toBe( true );

				await promise;

				expect(
					registry.select( CORE_USER ).isSavingAudienceSettings()
				).toBe( false );
			} );
		} );
	} );
} );
