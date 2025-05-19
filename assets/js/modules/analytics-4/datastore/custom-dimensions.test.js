/**
 * `modules/analytics-4` data store: custom-dimensions tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * External dependencies
 */
import { times } from 'lodash';

/**
 * Internal dependencies
 */
import { setUsingCache } from 'googlesitekit-api';
import { MODULES_ANALYTICS_4 } from './constants';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	untilResolved,
} from '../../../../../tests/js/utils';
import {
	CORE_USER,
	KM_ANALYTICS_POPULAR_AUTHORS,
	KM_ANALYTICS_TOP_CATEGORIES,
} from '../../../googlesitekit/datastore/user/constants';
import { provideCustomDimensionError } from '../utils/custom-dimensions';

describe( 'modules/analytics-4 custom-dimensions', () => {
	let registry;

	const propertyID = '123456';
	const customDimension = {
		parameterName: 'googlesitekit_post_author',
		displayName: 'Test Custom Dimension',
		description: 'Test Custom Dimension Description',
		scope: 'EVENT',
		disallowAdsPersonalization: false,
	};
	const customDimensionNames = [
		'googlesitekit_post_author',
		'googlesitekit_post_categories',
	];

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideModules( registry );
		registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_manage_options: true,
		} );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'fetchCreateCustomDimension', () => {
			it( 'requires a `propertyID` parameter', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.fetchCreateCustomDimension();
				} ).toThrow( 'A valid GA4 propertyID is required.' );
			} );

			it( 'requires a `customDimension` object parameter', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.fetchCreateCustomDimension( propertyID );
				} ).toThrow( 'Custom dimension must be a plain object.' );
			} );

			it( 'requires valid keys in the `customDimension` object parameter', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.fetchCreateCustomDimension( propertyID, {
							invalidKey: 'invalidValue',
						} );
				} ).toThrow(
					'Custom dimension must contain only valid keys. Invalid key: "invalidKey"'
				);
			} );

			it( 'creates a custom dimension for the provided property with valid parameters', async () => {
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
					),
					{
						body: customDimension,
						status: 200,
					}
				);

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.fetchCreateCustomDimension( propertyID, customDimension );

				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
					),
					{
						body: {
							data: {
								propertyID,
								customDimension,
							},
						},
					}
				);
			} );
		} );

		describe( 'fetchSyncAvailableCustomDimensions', () => {
			it( 'fetches and returns custom dimensions', async () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
				} );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					),
					{
						body: customDimensionNames,
						status: 200,
					}
				);

				const { response } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.fetchSyncAvailableCustomDimensions();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					)
				);
				expect( response ).toEqual( customDimensionNames );
			} );
		} );

		describe( 'createCustomDimensions', () => {
			const keyMetricsSettings = {
				widgetSlugs: [
					KM_ANALYTICS_POPULAR_AUTHORS,
					KM_ANALYTICS_TOP_CATEGORIES,
				],
				isWidgetHidden: false,
			};
			const coreUserInputSettings = {
				purpose: {
					values: [ 'purpose1' ],
					scope: 'site',
				},
				postFrequency: {
					values: [ 'daily' ],
					scope: 'user',
				},
				goals: {
					values: [ 'goal1', 'goal2' ],
					scope: 'user',
				},
			};
			it( 'does not make a network request if there are no missing custom dimensions', async () => {
				provideSiteInfo( registry, {
					postTypes: [ { slug: 'product', label: 'Product' } ],
				} );
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
					availableCustomDimensions: customDimensionNames,
				} );
				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [ 'non-existent-widget-slug' ],
					isWidgetHidden: false,
				} );
				registry
					.dispatch( CORE_USER )
					.receiveGetUserInputSettings( coreUserInputSettings );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.createCustomDimensions();

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'creates missing custom dimensions and syncs them in the Analytics 4 module settings', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetUserInputSettings( coreUserInputSettings );
				registry
					.dispatch( CORE_USER )
					.receiveGetKeyMetricsSettings( keyMetricsSettings );
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
					availableCustomDimensions: [],
				} );

				// Mock the network requests for creating custom dimension and syncing
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
					),
					{
						body: customDimension,
						status: 200,
					}
				);
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
					),
					{
						body: {
							...customDimension,
							parameterName: 'googlesitekit_post_categories',
						},
						status: 200,
					}
				);
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					),
					{
						body: customDimensionNames,
						status: 200,
					}
				);

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.createCustomDimensions();

				expect( fetchMock ).toHaveFetchedTimes( 3 );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableCustomDimensions()
				).toEqual( customDimensionNames );

				// Verify that the created custom dimensions are in a gathering data state.
				customDimensionNames.forEach( ( customDimensionName ) => {
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.isCustomDimensionGatheringData(
								customDimensionName
							)
					).toBe( true );
				} );
			} );
		} );

		describe( 'scheduleSyncAvailableCustomDimensions', () => {
			beforeEach( () => {
				jest.useFakeTimers();
			} );

			it( 'schedules a sync request to run after two seconds', async () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
				} );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					),
					{
						body: customDimensionNames,
						status: 200,
					}
				);

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.scheduleSyncAvailableCustomDimensions();

				jest.runAllTimers();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					)
				);
			} );

			it( 'runs a sync request once even if the action is called multiple times when each call is made before the two second duration has elapsed', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
				} );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					),
					{
						body: customDimensionNames,
						status: 200,
					}
				);

				// Dispatch action 5 times.
				times( 5, () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.scheduleSyncAvailableCustomDimensions();
				} );

				jest.runAllTimers();

				// Verify that it only fetched once.
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					)
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAvailableCustomDimensions', () => {
			it( 'does not make a network request if available custom dimensions is not null', () => {
				// Simulate a scenario where availableCustomDimensions is already set.
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
					availableCustomDimensions: customDimensionNames,
				} );

				// Trigger the resolver by invoking the selector.
				const dimensions = registry
					.select( MODULES_ANALYTICS_4 )
					.getAvailableCustomDimensions();

				expect( dimensions ).toEqual( customDimensionNames );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'does not make a network request if the user is not authenticated or cannot manage options', () => {
				provideUserAuthentication( registry, { authenticated: false } );
				registry.dispatch( CORE_USER ).receiveCapabilities( {
					googlesitekit_manage_options: false,
				} );
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
					availableCustomDimensions: null,
				} );

				// Trigger the resolver by invoking the selector.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableCustomDimensions()
				).toBeNull();

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'does not make a network request if the analytics-4 module is not connected', async () => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: false,
						connected: false,
					},
				] );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
					availableCustomDimensions: null,
				} );

				// Trigger the resolver by invoking the selector.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableCustomDimensions()
				).toBeNull();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAvailableCustomDimensions();

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'uses the resolver to fetch and set available custom dimensions if they are null', async () => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				// Simulate a scenario where availableCustomDimensions is null.
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
					availableCustomDimensions: null,
				} );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					),
					{
						body: customDimensionNames,
						status: 200,
					}
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableCustomDimensions()
				).toBeNull();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAvailableCustomDimensions();

				const dimensions = registry
					.select( MODULES_ANALYTICS_4 )
					.getAvailableCustomDimensions();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( dimensions ).toEqual( customDimensionNames );
			} );
		} );

		describe( 'hasCustomDimensions', () => {
			it( 'returns undefined when available custom dimensions have not loaded', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
				} );

				const hasCustomDimensions = registry
					.select( MODULES_ANALYTICS_4 )
					.hasCustomDimensions( [ 'googlesitekit_post_author' ] );

				expect( hasCustomDimensions ).toBe( undefined );
			} );

			it( 'returns undefined when available custom dimensions are null', () => {
				provideUserAuthentication( registry, { authenticated: false } );
				registry.dispatch( CORE_USER ).receiveCapabilities( {
					googlesitekit_manage_options: false,
				} );
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					availableCustomDimensions: null,
				} );

				const hasCustomDimensions = registry
					.select( MODULES_ANALYTICS_4 )
					.hasCustomDimensions( [ 'googlesitekit_post_author' ] );

				expect( hasCustomDimensions ).toBe( undefined );
			} );

			it( 'returns false when available custom dimensions are empty or not set', () => {
				provideUserAuthentication( registry, { authenticated: false } );
				registry.dispatch( CORE_USER ).receiveCapabilities( {
					googlesitekit_manage_options: false,
				} );
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					availableCustomDimensions: [],
				} );

				const hasCustomDimensions = registry
					.select( MODULES_ANALYTICS_4 )
					.hasCustomDimensions( [ 'googlesitekit_post_author' ] );

				expect( hasCustomDimensions ).toBe( false );
			} );

			it( 'returns true when all provided custom dimensions are available', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
					availableCustomDimensions: customDimensionNames,
				} );

				const hasCustomDimensions = registry
					.select( MODULES_ANALYTICS_4 )
					.hasCustomDimensions( [
						'googlesitekit_post_author',
						'googlesitekit_post_categories',
					] );

				expect( hasCustomDimensions ).toBe( true );
			} );

			it( 'returns false when some or all provided custom dimensions are not available', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
					availableCustomDimensions: customDimensionNames,
				} );

				const hasCustomDimensions = registry
					.select( MODULES_ANALYTICS_4 )
					.hasCustomDimensions( 'googlesitekit_dimension3' );

				expect( hasCustomDimensions ).toBe( false );
			} );

			it( 'returns false when some or all provided custom dimensions are not available (array input)', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
					availableCustomDimensions: customDimensionNames,
				} );

				const hasCustomDimensions = registry
					.select( MODULES_ANALYTICS_4 )
					.hasCustomDimensions( [ 'dimension1', 'dimension3' ] );

				expect( hasCustomDimensions ).toBe( false );
			} );
		} );

		describe( 'getCustomDimensionCreationError', () => {
			it( 'gets error set in the datastore for the provided custom dimension', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
				} );

				const error = {
					code: 'test-error-code',
					message: 'Test error message',
					data: {
						reason: 'test-error-reason',
					},
				};

				provideCustomDimensionError( registry, {
					customDimension: 'googlesitekit_post_categories',
					error,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getCreateCustomDimensionError(
							'googlesitekit_post_categories'
						)
				).toEqual( error );
			} );
		} );
	} );
} );
