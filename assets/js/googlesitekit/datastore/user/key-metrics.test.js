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
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import { CORE_USER } from './constants';

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
		store = registry.stores[ CORE_USER ].store;
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

		describe( 'setKeyMetricSetting', () => {
			it( 'should set the setting value to the store', async () => {
				await registry
					.dispatch( CORE_USER )
					.setKeyMetricSetting( settingID, settingValue );

				expect( store.getState().keyMetrics[ settingID ] ).toBe(
					settingValue
				);
			} );
		} );

		describe( 'saveKeyMetrics', () => {
			beforeEach( async () => {
				await registry
					.dispatch( CORE_USER )
					.setKeyMetricSetting( settingID, settingValue );
			} );

			it( 'should save settings and add it to the store ', async () => {
				fetchMock.postOnce( coreKeyMetricsEndpointRegExp, {
					body: coreKeyMetricsExpectedResponse,
					status: 200,
				} );

				await registry.dispatch( CORE_USER ).saveKeyMetrics();

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

				expect( store.getState().keyMetrics ).toMatchObject(
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

				await registry.dispatch( CORE_USER ).saveKeyMetrics();

				expect(
					registry
						.select( CORE_USER )
						.getErrorForAction( 'saveKeyMetrics', [] )
				).toMatchObject( response );

				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getKeyMetrics', () => {
			it( 'should fetch user key metrics from the API if none exist', async () => {
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

				registry.select( CORE_USER ).getKeyMetrics();

				await untilResolved(
					registry,
					CORE_USER
				).getUserPickedMetrics();

				expect( fetchMock ).toHaveFetched(
					coreKeyMetricsEndpointRegExp,
					{
						body: {
							settings: coreKeyMetricsExpectedResponse,
						},
					}
				);

				expect(
					registry.select( CORE_USER ).getKeyMetrics()
				).toMatchObject( coreKeyMetricsExpectedResponse.widgetSlugs );

				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it( 'should use answer-based key metrics if the user has not selected any widgets', async () => {
				fetchMock.getOnce( coreKeyMetricsEndpointRegExp, {
					body: {
						widgetSlugs: [],
						isWidgetHidden: false,
					},
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

				registry.select( CORE_USER ).getKeyMetrics();

				await untilResolved(
					registry,
					CORE_USER
				).getUserPickedMetrics();

				expect(
					registry.select( CORE_USER ).getKeyMetrics()
				).toMatchObject( [
					'kmAnalyticsLoyalVisitors',
					'kmAnalyticsNewVisitors',
					'kmAnalyticsTopTrafficSource',
					'kmAnalyticsEngagedTrafficSource',
				] );

				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );
		} );
	} );
} );
