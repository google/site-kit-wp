/**
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
import {
	createTestRegistry,
	freezeFetch,
	provideSiteInfo,
	unsubscribeFromAll,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import {
	CORE_USER,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from './constants';

describe( 'core/user key metrics', () => {
	let registry;
	let store;

	const coreKeyMetricsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/key-metrics'
	);
	const coreKeyMetricsExpectedResponse = {
		widgetSlugs: [ 'widget1', 'widget2' ],
		isWidgetHidden: false,
	};

	const coreUserInputSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/user-input-settings'
	);
	const coreUserInputSettingsExpectedResponse = {
		purpose: {
			values: [ 'publish_blog' ],
			scope: 'site',
		},
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		store = registry.stores[ CORE_USER ].store;
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		const settingID = 'test-setting';
		const settingValue = 'test-value';

		describe( 'getKeyMetrics', () => {
			it( 'should use answer-based key metrics if the user has not selected any widgets', async () => {
				fetchMock.getOnce( coreKeyMetricsEndpointRegExp, {
					body: {
						widgetSlugs: [],
						isWidgetHidden: false,
					},
					status: 200,
				} );

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/user-input-settings'
					),
					{
						body: {
							purpose: {
								values: [ 'publish_blog' ],
								scope: 'site',
							},
						},
						status: 200,
					}
				);

				registry.select( CORE_USER ).getUserInputSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getUserInputSettings();

				registry.select( CORE_USER ).getKeyMetrics();

				await untilResolved(
					registry,
					CORE_USER
				).getKeyMetricsSettings();

				expect(
					registry.select( CORE_USER ).getKeyMetrics()
				).toMatchObject( [
					KM_ANALYTICS_LOYAL_VISITORS,
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
				] );

				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it( 'should use the user-selected key metrics if the user has selected any widgets', async () => {
				fetchMock.getOnce( coreKeyMetricsEndpointRegExp, {
					body: {
						widgetSlugs: [ KM_ANALYTICS_LOYAL_VISITORS ],
						isWidgetHidden: false,
					},
					status: 200,
				} );

				registry.select( CORE_USER ).getKeyMetrics();

				await untilResolved(
					registry,
					CORE_USER
				).getKeyMetricsSettings();

				expect(
					registry.select( CORE_USER ).getKeyMetrics()
				).toMatchObject( [ KM_ANALYTICS_LOYAL_VISITORS ] );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );

		describe( 'getAnswerBasedMetrics', () => {
			it( 'should return undefined if user input settings are not resolved', async () => {
				freezeFetch(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/user-input-settings'
					)
				);

				expect(
					registry.select( CORE_USER ).getAnswerBasedMetrics()
				).toBeUndefined();

				// Wait for resolvers to run.
				await waitForDefaultTimeouts();
			} );

			it.each( [
				[ 'undefined', undefined ],
				[ 'null', null ],
				[ 'an empty object', {} ],
				[ 'an object with empty purpose', { purpose: {} } ],
				[
					'an object with empty purpose values',
					{ purpose: { values: [] } },
				],
			] )(
				'should return an empty array if user input settings are %s',
				( userInputSettings ) => {
					registry
						.dispatch( CORE_USER )
						.receiveGetUserInputSettings( userInputSettings );

					expect(
						registry.select( CORE_USER ).getAnswerBasedMetrics()
					).toEqual( [] );
				}
			);

			it.each( [
				[
					'publish_blog',
					[
						KM_ANALYTICS_LOYAL_VISITORS,
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
					],
				],
				[
					'publish_news',
					[
						KM_ANALYTICS_LOYAL_VISITORS,
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
					],
				],
				[
					'monetize_content',
					[
						KM_ANALYTICS_POPULAR_CONTENT,
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					],
				],
				[
					'sell_products_or_service',
					[
						KM_ANALYTICS_POPULAR_CONTENT,
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					],
				],
				[
					'share_portfolio',
					[
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					],
				],
			] )(
				'should return the correct metrics for the %s purpose',
				( purpose, expectedMetrics ) => {
					registry
						.dispatch( CORE_USER )
						.receiveGetUserInputSettings( {
							purpose: { values: [ purpose ] },
						} );

					expect(
						registry.select( CORE_USER ).getAnswerBasedMetrics()
					).toEqual( expectedMetrics );
				}
			);

			it( 'should return the correct metrics for the sell_products_or_service purposes when the site has a product post type', () => {
				provideSiteInfo( registry, {
					postTypes: [ { slug: 'product', label: 'Product' } ],
				} );

				registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
					purpose: { values: [ 'sell_products_or_service' ] },
				} );

				expect(
					registry.select( CORE_USER ).getAnswerBasedMetrics()
				).toEqual( [
					KM_ANALYTICS_POPULAR_PRODUCTS,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
					KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
				] );
			} );
		} );

		describe( 'setKeyMetricsSetting', () => {
			it( 'should set the setting value to the store', async () => {
				await registry
					.dispatch( CORE_USER )
					.setKeyMetricsSetting( settingID, settingValue );

				expect( store.getState().keyMetricsSettings[ settingID ] ).toBe(
					settingValue
				);
			} );
		} );

		describe( 'saveKeyMetricsSettings', () => {
			beforeEach( async () => {
				await registry
					.dispatch( CORE_USER )
					.setKeyMetricsSetting( settingID, settingValue );
			} );

			it( 'should save settings and add it to the store ', async () => {
				fetchMock.postOnce( coreKeyMetricsEndpointRegExp, {
					body: coreKeyMetricsExpectedResponse,
					status: 200,
				} );

				await registry.dispatch( CORE_USER ).saveKeyMetricsSettings();

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					coreKeyMetricsEndpointRegExp,
					{
						body: {
							data: {
								settings: {
									[ settingID ]: settingValue,
								},
							},
						},
					}
				);

				expect( store.getState().keyMetricsSettings ).toMatchObject(
					coreKeyMetricsExpectedResponse
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( coreKeyMetricsEndpointRegExp, {
					body: response,
					status: 500,
				} );

				await registry.dispatch( CORE_USER ).saveKeyMetricsSettings();

				expect(
					registry
						.select( CORE_USER )
						.getErrorForAction( 'saveKeyMetricsSettings', [] )
				).toMatchObject( response );

				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getKeyMetricsSettings', () => {
			it( 'should fetch user key metrics settings from the API if none exist', async () => {
				fetchMock.getOnce( coreKeyMetricsEndpointRegExp, {
					body: coreKeyMetricsExpectedResponse,
					status: 200,
				} );

				fetchMock.getOnce( coreUserInputSettingsEndpointRegExp, {
					body: coreUserInputSettingsExpectedResponse,
					status: 200,
				} );

				registry.select( CORE_USER ).getUserInputSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getUserInputSettings();

				registry.select( CORE_USER ).getKeyMetricsSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getKeyMetricsSettings();

				expect( fetchMock ).toHaveFetched(
					coreKeyMetricsEndpointRegExp,
					{
						body: {
							settings: coreKeyMetricsExpectedResponse,
						},
					}
				);

				expect(
					registry.select( CORE_USER ).getKeyMetricsSettings()
				).toMatchObject( coreKeyMetricsExpectedResponse );

				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it( 'should not make a network request if settings exist', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetKeyMetricsSettings(
						coreKeyMetricsExpectedResponse
					);

				registry.select( CORE_USER ).getKeyMetricsSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getKeyMetricsSettings();

				expect( fetchMock ).not.toHaveFetched(
					coreKeyMetricsEndpointRegExp
				);
			} );
		} );

		describe( 'getUserPickedMetrics', () => {
			it( 'should return undefined while settings are loading', async () => {
				freezeFetch( coreKeyMetricsEndpointRegExp );

				const { getUserPickedMetrics } = registry.select( CORE_USER );

				expect( getUserPickedMetrics() ).toBeUndefined();

				await waitForDefaultTimeouts();
			} );

			it( 'uses a resolver to make a network request if settings are not available', async () => {
				fetchMock.getOnce( coreKeyMetricsEndpointRegExp, {
					body: coreKeyMetricsExpectedResponse,
					status: 200,
				} );

				const { getUserPickedMetrics } = registry.select( CORE_USER );

				expect( getUserPickedMetrics() ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_USER
				).getKeyMetricsSettings();

				expect(
					registry.select( CORE_USER ).getUserPickedMetrics()
				).toEqual( coreKeyMetricsExpectedResponse.widgetSlugs );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should return user picked metrics', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetKeyMetricsSettings(
						coreKeyMetricsExpectedResponse
					);

				expect(
					registry.select( CORE_USER ).getUserPickedMetrics()
				).toEqual( coreKeyMetricsExpectedResponse.widgetSlugs );
			} );
		} );

		describe( 'isKeyMetricsWidgetHidden', () => {
			it( 'should return undefined while settings are loading', async () => {
				freezeFetch( coreKeyMetricsEndpointRegExp );

				const { isKeyMetricsWidgetHidden } =
					registry.select( CORE_USER );

				expect( isKeyMetricsWidgetHidden() ).toBeUndefined();

				await waitForDefaultTimeouts();
			} );

			it( 'uses a resolver to make a network request if settings are not available', async () => {
				fetchMock.getOnce( coreKeyMetricsEndpointRegExp, {
					body: coreKeyMetricsExpectedResponse,
					status: 200,
				} );

				const { isKeyMetricsWidgetHidden } =
					registry.select( CORE_USER );

				expect( isKeyMetricsWidgetHidden() ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_USER
				).getKeyMetricsSettings();

				expect(
					registry.select( CORE_USER ).isKeyMetricsWidgetHidden()
				).toEqual( coreKeyMetricsExpectedResponse.isWidgetHidden );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );
	} );
} );
