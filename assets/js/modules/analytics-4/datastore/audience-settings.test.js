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

describe( 'modules/analytics-4 audience settings', () => {
	let registry;
	let store;

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/audience-settings'
	);

	const audienceSettingsResponse = {
		configuredAudiences: [ 'audienceA', 'audienceB' ],
		isAudienceSegmentationWidgetHidden: false,
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		store = registry.stores[ MODULES_ANALYTICS_4 ].store;
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
						.dispatch( MODULES_ANALYTICS_4 )
						.setConfiguredAudiences( 'audienceA' );
				} ).toThrow( 'Configured audiences should be an array.' );
			} );

			it( 'should set the provided audiences in the store', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setConfiguredAudiences(
						audienceSettingsResponse.configuredAudiences
					);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getConfiguredAudiences()
				).toEqual( audienceSettingsResponse.configuredAudiences );
			} );
		} );

		describe( 'setAudienceSegmentationWidgetHidden', () => {
			it( 'should throw an error if the provided value is not a boolean', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setAudienceSegmentationWidgetHidden( 'audienceA' );
				} ).toThrow(
					'Audience segmentation widget visibility should be a boolean.'
				);
			} );

			it( 'should set the audience segmentation widget visibility in the store', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAudienceSegmentationWidgetHidden( true );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAudienceSegmentationWidgetHidden()
				).toEqual( true );
			} );
		} );

		describe( 'saveAudienceSettings', () => {
			beforeEach( () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setConfiguredAudiences(
						audienceSettingsResponse.configuredAudiences
					);
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAudienceSegmentationWidgetHidden(
						audienceSettingsResponse.isAudienceSegmentationWidgetHidden
					);
			} );

			it( 'should save settings and add it to the store', async () => {
				fetchMock.postOnce( audienceSettingsEndpoint, {
					body: audienceSettingsResponse,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.saveAudienceSettings();

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( audienceSettingsEndpoint, {
					body: {
						data: {
							settings: audienceSettingsResponse,
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

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.saveAudienceSettings();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getErrorForAction( 'saveAudienceSettings', [] )
				).toMatchObject( response );

				expect( console ).toHaveErrored();
			} );

			it( 'optionally saves additional settings besides whatever is stored', async () => {
				const audienceSettings = {
					...audienceSettingsResponse,
					isAudienceSegmentationWidgetHidden: true,
				};

				fetchMock.postOnce( audienceSettingsEndpoint, {
					body: audienceSettings,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.saveAudienceSettings( {
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
					registry.select( MODULES_ANALYTICS_4 ).getAudienceSettings()
				).toBeUndefined();

				await waitForDefaultTimeouts();
			} );

			it( 'should not make a network request if audience settings exist', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( audienceSettingsResponse );

				registry.select( MODULES_ANALYTICS_4 ).getAudienceSettings();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
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

				registry.select( MODULES_ANALYTICS_4 ).getAudienceSettings();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAudienceSettings();

				expect( fetchMock ).toHaveFetched( audienceSettingsEndpoint, {
					body: {
						settings: audienceSettingsResponse,
					},
				} );

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getAudienceSettings()
				).toMatchObject( audienceSettingsResponse );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );

		describe( 'getConfiguredAudiences', () => {
			it( 'should return undefined while audience settings are loading', async () => {
				freezeFetch( audienceSettingsEndpoint );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getConfiguredAudiences()
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
						.select( MODULES_ANALYTICS_4 )
						.getConfiguredAudiences()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAudienceSettings();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getConfiguredAudiences()
				).toEqual( audienceSettingsResponse.configuredAudiences );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should return the configured audiences from the audience settings', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( audienceSettingsResponse );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getConfiguredAudiences()
				).toEqual( audienceSettingsResponse.configuredAudiences );
			} );
		} );

		describe( 'isAudienceSegmentationWidgetHidden', () => {
			it( 'should return undefined while audience settings are loading', async () => {
				freezeFetch( audienceSettingsEndpoint );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
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
						.select( MODULES_ANALYTICS_4 )
						.isAudienceSegmentationWidgetHidden()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAudienceSettings();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAudienceSegmentationWidgetHidden()
				).toEqual(
					audienceSettingsResponse.isAudienceSegmentationWidgetHidden
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should return the audience segmentation widget visibility from the audience settings', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( audienceSettingsResponse );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAudienceSegmentationWidgetHidden()
				).toEqual(
					audienceSettingsResponse.isAudienceSegmentationWidgetHidden
				);
			} );
		} );

		describe( 'haveConfiguredAudiencesChanged', () => {
			it( 'should compare the current configured audiences with the saved ones', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( audienceSettingsResponse );

				const hasChanged = registry
					.select( MODULES_ANALYTICS_4 )
					.haveConfiguredAudiencesChanged();

				expect( hasChanged ).toBe( false );

				// Change the settings.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setConfiguredAudiences( [ 'audienceC' ] );

				const hasChangedAfterSet = registry
					.select( MODULES_ANALYTICS_4 )
					.haveConfiguredAudiencesChanged();

				expect( hasChangedAfterSet ).toBe( true );
			} );
		} );

		describe( 'isSavingAudienceSettings', () => {
			it( 'should return false if audience settings are not being saved', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSavingAudienceSettings()
				).toBe( false );
			} );

			it( 'should return true if audience settings are being saved', async () => {
				muteFetch( audienceSettingsEndpoint );

				const promise = registry
					.dispatch( MODULES_ANALYTICS_4 )
					.fetchSaveAudienceSettings( audienceSettingsResponse );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSavingAudienceSettings()
				).toBe( true );

				await promise;

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSavingAudienceSettings()
				).toBe( false );
			} );
		} );
	} );
} );
