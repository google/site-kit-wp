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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { MODULES_ANALYTICS_4 } from './constants';
import {
	createTestRegistry,
	provideUserAuthentication,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

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
		'googlesitekit_dimension1',
		'googlesitekit_dimension2',
	];

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
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

		describe( 'syncAvailableCustomDimensions', () => {
			it( 'requires a valid propertyID to be passed', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.syncAvailableCustomDimensions();
				} ).toThrow( 'A valid GA4 propertyID is required.' );

				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.syncAvailableCustomDimensions(
							'not-valid-property-id'
						);
				} ).toThrow( 'A valid GA4 propertyID is required.' );
			} );

			it( 'fetches and returns custom dimensions for a valid propertyID', async () => {
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
					.syncAvailableCustomDimensions( propertyID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					),
					{
						body: {
							data: {
								propertyID,
							},
						},
					}
				);
				expect( response ).toEqual( customDimensionNames );
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

			it( 'uses the resolver to fetch and set available custom dimensions if they are null', async () => {
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					),
					{
						body: customDimensionNames,
						status: 200,
					}
				);

				// Simulate a scenario where availableCustomDimensions is null.
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID,
					availableCustomDimensions: null,
				} );
				provideUserAuthentication( registry );
				registry.dispatch( CORE_USER ).receiveCapabilities( {
					googlesitekit_manage_options: true,
				} );

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
	} );
} );
