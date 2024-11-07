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
	muteFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { provideKeyMetricsWidgetRegistrations } from '../../../components/KeyMetrics/test-utils';
import {
	CORE_USER,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_MOST_ENGAGING_PAGES,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_PAGES_PER_VISIT,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_VISITS_PER_VISITOR,
	KM_ANALYTICS_VISIT_LENGTH,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_ANALYTICS_POPULAR_AUTHORS,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
} from './constants';
import { CORE_SITE } from '../site/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import * as analytics4Fixtures from '../../../modules/analytics-4/datastore/__fixtures__';
import { enabledFeatures } from '../../../features';

describe( 'core/user key metrics', () => {
	let registry;
	let store;

	const coreKeyMetricsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/key-metrics'
	);
	const coreKeyMetricsExpectedResponse = {
		widgetSlugs: [
			KM_ANALYTICS_NEW_VISITORS,
			KM_ANALYTICS_RETURNING_VISITORS,
		],
		isWidgetHidden: false,
	};

	const coreUserAuthenticationEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/authentication'
	);
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
		provideModules( registry );
		store = registry.stores[ CORE_USER ].store;
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		const settingID = 'test-setting';
		const settingValue = 'test-value';

		describe( 'getKeyMetrics', () => {
			beforeEach( () => {
				provideUserAuthentication( registry );
			} );

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

				await registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( false );

				expect(
					registry.select( CORE_USER ).getKeyMetrics()
				).toMatchObject( [
					KM_ANALYTICS_RETURNING_VISITORS,
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
				] );

				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it( 'should use the user-selected key metrics if the user has selected any widgets', async () => {
				fetchMock.getOnce( coreKeyMetricsEndpointRegExp, {
					body: {
						widgetSlugs: [
							KM_ANALYTICS_RETURNING_VISITORS,
							KM_ANALYTICS_NEW_VISITORS,
						],
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
				).toMatchObject( [
					KM_ANALYTICS_RETURNING_VISITORS,
					KM_ANALYTICS_NEW_VISITORS,
				] );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should filter out ACR metrics from the user-selected key metrics if the conversionReporting feature flag is not enabled', async () => {
				fetchMock.getOnce( coreKeyMetricsEndpointRegExp, {
					body: {
						widgetSlugs: [
							KM_ANALYTICS_RETURNING_VISITORS,
							KM_ANALYTICS_NEW_VISITORS,
							KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
						],
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
				).toMatchObject( [
					KM_ANALYTICS_RETURNING_VISITORS,
					KM_ANALYTICS_NEW_VISITORS,
				] );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not filter out ACR metrics from the user-selected key metrics if the conversionReporting feature flag is enabled', async () => {
				enabledFeatures.add( 'conversionReporting' );

				fetchMock.getOnce( coreKeyMetricsEndpointRegExp, {
					body: {
						widgetSlugs: [
							KM_ANALYTICS_RETURNING_VISITORS,
							KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
						],
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
				).toMatchObject( [
					KM_ANALYTICS_RETURNING_VISITORS,
					KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
				] );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );

		describe( 'getAnswerBasedMetrics', () => {
			// Default to a configuration that will *not* return Conversion Tailored Metrics.
			beforeEach( async () => {
				provideUserAuthentication( registry );
				await registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( false );
				await registry
					.dispatch( CORE_USER )
					.receiveGetKeyMetricsSettings( {
						widgetSlugs: [],
						includeConversionTailoredMetrics: false,
					} );
			} );

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
				[ 'null', null ],
				[ 'an empty object', {} ],
				[ 'an object with empty purpose', { purpose: {} } ],
				[
					'an object with empty purpose values',
					{ purpose: { values: [] } },
				],
			] )(
				'should return an empty array if user input settings are %s',
				async ( _, userInputSettings ) => {
					muteFetch( coreUserInputSettingsEndpointRegExp );

					registry.select( CORE_USER ).getUserInputSettings();

					await registry
						.dispatch( CORE_USER )
						.receiveGetUserInputSettings( userInputSettings );

					expect(
						registry.select( CORE_USER ).getAnswerBasedMetrics()
					).toEqual( [] );

					await waitForDefaultTimeouts();
				}
			);

			it.each( [
				[
					'publish_blog',
					[
						KM_ANALYTICS_TOP_CATEGORIES,
						KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
						KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
						KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					],
					[
						KM_ANALYTICS_TOP_CATEGORIES,
						KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
						KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
						KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
						KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
					],
				],
				[
					'publish_news',
					[
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_ANALYTICS_POPULAR_AUTHORS,
						KM_ANALYTICS_TOP_CITIES,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
						KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					],
					[
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_ANALYTICS_POPULAR_AUTHORS,
						KM_ANALYTICS_TOP_CITIES,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
						KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
						KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
					],
				],
				[
					'monetize_content',
					[
						KM_ANALYTICS_MOST_ENGAGING_PAGES,
						KM_ANALYTICS_POPULAR_CONTENT,
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
						KM_ANALYTICS_VISIT_LENGTH,
						KM_ANALYTICS_VISITS_PER_VISITOR,
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					],
					[
						KM_ANALYTICS_MOST_ENGAGING_PAGES,
						KM_ANALYTICS_POPULAR_CONTENT,
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
						KM_ANALYTICS_VISIT_LENGTH,
						KM_ANALYTICS_VISITS_PER_VISITOR,
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					],
				],
				[
					'sell_products_or_service',
					[
						KM_ANALYTICS_POPULAR_CONTENT,
						KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
						KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					],
					[
						KM_ANALYTICS_POPULAR_CONTENT,
						KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
						KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
						KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
						KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					],
				],
				[
					'share_portfolio',
					[
						KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
						KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
						KM_ANALYTICS_POPULAR_AUTHORS,
						KM_ANALYTICS_POPULAR_CONTENT,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					],
					[
						KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
						KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
						KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
						KM_ANALYTICS_POPULAR_AUTHORS,
						KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
						KM_ANALYTICS_POPULAR_CONTENT,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					],
				],
			] )(
				'should return the correct metrics for the %s purpose',
				async (
					purpose,
					expectedMetrics,
					expectedMetricsIncludingConversionTailored
				) => {
					enabledFeatures.add( 'conversionReporting' );

					if ( purpose === 'sell_products_or_service' ) {
						registry
							.dispatch( MODULES_ANALYTICS_4 )
							.setDetectedEvents( [ 'add_to_cart', 'purchase' ] );
					}

					registry
						.dispatch( CORE_USER )
						.receiveGetUserInputSettings( {
							purpose: { values: [ purpose ] },
						} );

					expect(
						registry.select( CORE_USER ).getAnswerBasedMetrics()
					).toEqual( expectedMetrics );

					// Conversion Tailored Metrics should be included in the list if the
					// includeConversionTailoredMetrics setting is true.
					await registry
						.dispatch( CORE_USER )
						.receiveIsUserInputCompleted( false );
					await registry
						.dispatch( CORE_USER )
						.receiveGetKeyMetricsSettings( {
							widgetSlugs: [],
							includeConversionTailoredMetrics: true,
						} );

					expect(
						registry.select( CORE_USER ).isUserInputCompleted()
					).toEqual( false );
					expect(
						registry.select( CORE_USER ).getKeyMetricsSettings()
					).toEqual( {
						widgetSlugs: [],
						includeConversionTailoredMetrics: true,
					} );

					expect(
						registry.select( CORE_USER ).getAnswerBasedMetrics()
					).toEqual( expectedMetricsIncludingConversionTailored );

					enabledFeatures.delete( 'conversionReporting' );
				}
			);

			it.each( [
				[
					'publish_news',
					'publish_blog',
					[
						KM_ANALYTICS_TOP_CATEGORIES,
						KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
						KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
						KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					],
				],
				[
					'publish_blog',
					'publish_news',
					[
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_ANALYTICS_POPULAR_AUTHORS,
						KM_ANALYTICS_TOP_CITIES,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
						KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					],
				],
			] )(
				'should return the correct metrics when getAnswerBasedMetrics() is overridden',
				async ( currentPurpose, purposeOverride, expectedMetrics ) => {
					enabledFeatures.add( 'conversionReporting' );

					provideUserAuthentication( registry );
					await registry
						.dispatch( CORE_USER )
						.receiveIsUserInputCompleted( false );

					registry
						.dispatch( CORE_USER )
						.receiveGetUserInputSettings( {
							purpose: { values: [ currentPurpose ] },
						} );

					expect(
						registry
							.select( CORE_USER )
							.getAnswerBasedMetrics( purposeOverride )
					).toEqual( expectedMetrics );
				}
			);

			it( 'should return the correct metrics for the sell_products_or_service purposes when the site has a product post type', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [] );

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
			const userID = 123;
			beforeEach( async () => {
				provideUserInfo( registry, { id: userID } );
				provideUserAuthentication( registry );
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

			it( 'optionally saves additional settings besides whatever is stored', async () => {
				const settings = {
					[ settingID ]: settingValue,
					isWidgetHidden: true,
				};

				fetchMock.postOnce( coreKeyMetricsEndpointRegExp, {
					body: settings,
					status: 200,
				} );

				await registry
					.dispatch( CORE_USER )
					.saveKeyMetricsSettings( { isWidgetHidden: true } );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					coreKeyMetricsEndpointRegExp,
					{
						body: {
							data: {
								settings,
							},
						},
					}
				);

				expect( store.getState().keyMetricsSettings ).toEqual(
					settings
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should mark key metrics setup as completed by current user', async () => {
				fetchMock.postOnce( coreKeyMetricsEndpointRegExp, {
					body: coreKeyMetricsExpectedResponse,
					status: 200,
				} );

				expect(
					registry.select( CORE_SITE ).getKeyMetricsSetupCompletedBy()
				).toBe( 0 );

				await registry.dispatch( CORE_USER ).saveKeyMetricsSettings();

				expect(
					registry.select( CORE_SITE ).getKeyMetricsSetupCompletedBy()
				).toBe( userID );
			} );

			it( 'should not set the keyMetricsSetupCompleted site info setting to true if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( coreKeyMetricsEndpointRegExp, {
					body: response,
					status: 500,
				} );

				// Verify the setting is initially false.
				expect(
					registry.select( CORE_SITE ).isKeyMetricsSetupCompleted()
				).toBe( false );

				await registry.dispatch( CORE_USER ).saveKeyMetricsSettings();

				// Verify the setting is still false.
				expect(
					registry.select( CORE_SITE ).isKeyMetricsSetupCompleted()
				).toBe( false );

				expect( console ).toHaveErrored();
			} );

			it( 'should not set the keyMetricsSetupCompleted site info setting to true if only `isWidgetHidden` is changed', async () => {
				fetchMock.postOnce( coreKeyMetricsEndpointRegExp, {
					body: coreKeyMetricsExpectedResponse,
					status: 200,
				} );

				// Verify the setting is initially false.
				expect(
					registry.select( CORE_SITE ).isKeyMetricsSetupCompleted()
				).toBe( false );

				await registry
					.dispatch( CORE_USER )
					.saveKeyMetricsSettings( { isWidgetHidden: true } );

				// Verify the setting is still false.
				expect(
					registry.select( CORE_SITE ).isKeyMetricsSetupCompleted()
				).toBe( false );

				expect( console ).not.toHaveErrored();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getKeyMetricsSettings', () => {
			it( 'should fetch user key metrics settings from the API if none exist', async () => {
				provideUserAuthentication( registry );

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
				provideUserAuthentication( registry );

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
			beforeEach( () => {
				provideUserAuthentication( registry );
			} );

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

			it( 'should return the filtered widget slugs that do not require custom dimensions when the user is in a view-only dashboard', () => {
				// Set up state to simulate view-only mode.
				provideUserAuthentication( registry, { authenticated: false } );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					availableCustomDimensions: null,
				} );

				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_PAGES_PER_VISIT,
						KM_ANALYTICS_TOP_CATEGORIES,
					],
					isWidgetHidden: false,
				} );

				expect(
					registry.select( CORE_USER ).getUserPickedMetrics()
				).toEqual( [
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_PAGES_PER_VISIT,
				] );
			} );

			it( 'should return an empty array if only one widget slug is present when the user is in a view-only dashboard', () => {
				// Set up state to simulate view-only mode.
				provideUserAuthentication( registry, { authenticated: false } );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					availableCustomDimensions: null,
				} );

				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_TOP_CATEGORIES,
					],
					isWidgetHidden: false,
				} );

				expect(
					registry.select( CORE_USER ).getUserPickedMetrics()
				).toEqual( [] );
			} );
		} );

		describe( 'isKeyMetricsWidgetHidden', () => {
			beforeEach( () => {
				provideUserAuthentication( registry );
			} );

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

		describe( 'isKeyMetricAvailable', () => {
			it( 'should return an error if widget slug is not provided', () => {
				expect( () => {
					registry.select( CORE_USER ).isKeyMetricAvailable();
				} ).toThrow( 'Key metric widget slug required.' );
			} );

			it( 'should return undefined if authentication state is loading', async () => {
				freezeFetch( coreUserAuthenticationEndpointRegExp );

				const { isKeyMetricAvailable } = registry.select( CORE_USER );

				expect( isKeyMetricAvailable( 'metricA' ) ).toBeUndefined();

				await waitForDefaultTimeouts();
			} );

			it( 'should return false if a widget with the provided slug is not registered', () => {
				provideUserAuthentication( registry );

				expect(
					registry
						.select( CORE_USER )
						.isKeyMetricAvailable( 'metricA' )
				).toBe( false );
			} );

			it( 'should return true if a module that the widget depends on is not connected', () => {
				provideUserAuthentication( registry );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: false,
						connected: false,
					},
				] );

				provideKeyMetricsWidgetRegistrations( registry, {
					metricA: {
						modules: [ 'analytics-4' ],
					},
				} );

				expect(
					registry
						.select( CORE_USER )
						.isKeyMetricAvailable( 'metricA' )
				).toBe( true );
			} );

			it( 'should return false if a module that the widget depends on is not accessible by a view-only user', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );

				provideUserAuthentication( registry, {
					authenticated: false,
				} );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
						shareable: true,
					},
				] );

				provideKeyMetricsWidgetRegistrations( registry, {
					metricA: {
						modules: [ 'analytics-4' ],
					},
				} );

				registry.dispatch( CORE_USER ).receiveGetCapabilities( {
					'googlesitekit_read_shared_module_data::["analytics-4"]': false,
				} );

				expect(
					registry
						.select( CORE_USER )
						.isKeyMetricAvailable( 'metricA' )
				).toBe( false );
				await waitForDefaultTimeouts();
			} );

			it( 'should return true if modules that the widget depends on are connected and accessible by a view-only user', async () => {
				provideUserAuthentication( registry );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				provideKeyMetricsWidgetRegistrations( registry, {
					metricA: {
						modules: [ 'analytics-4' ],
					},
				} );

				registry.dispatch( CORE_USER ).receiveGetCapabilities( {
					'googlesitekit_read_shared_module_data::["analytics-4"]': true,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( analytics4Fixtures.defaultSettings );

				expect(
					registry
						.select( CORE_USER )
						.isKeyMetricAvailable( 'metricA' )
				).toBe( true );

				provideUserAuthentication( registry, { authenticated: false } );

				expect(
					registry
						.select( CORE_USER )
						.isKeyMetricAvailable( 'metricA' )
				).toBe( true );
				await waitForDefaultTimeouts();
			} );
		} );
	} );
} );
