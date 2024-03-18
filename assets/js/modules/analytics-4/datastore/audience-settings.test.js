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
	// freezeFetch,
	// muteFetch,
	provideModules,
	// provideSiteInfo,
	// provideUserAuthentication,
	// provideUserInfo,
	unsubscribeFromAll,
	// untilResolved,
	// waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'core/user key metrics', () => {
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

			it( 'should set the provided audiences in the store ', () => {
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

			it( 'should set the audience segmentation widget visibility in the store ', () => {
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

			it( 'should save settings and add it to the store ', async () => {
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

			it( 'dispatches an error if the request fails ', async () => {
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
} );
