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
	unsubscribeFromAll,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { coreKeyMetricsEndpointRegExp } from '../../../util/key-metrics';
import { CORE_USER } from './constants';

describe( 'core/user key metrics', () => {
	let registry;
	let store;

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
