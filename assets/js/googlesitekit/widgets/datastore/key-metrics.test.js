/**
 * `core/widgets` data store: key metrics tests.
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
import {
	createTestRegistry,
	freezeFetch,
	provideSiteInfo,
	unsubscribeFromAll,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { CORE_USER } from '../../datastore/user/constants';
import { CORE_WIDGETS } from './constants';

let registry;

describe( 'core/widgets key metrics', () => {
	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );
		provideSiteInfo( registry );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getAnswerBasedMetrics', () => {
			it( 'should return undefined if user input settings are not resolved', async () => {
				freezeFetch(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/user-input-settings'
					)
				);

				expect(
					registry.select( CORE_WIDGETS ).getAnswerBasedMetrics()
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
						registry.select( CORE_WIDGETS ).getAnswerBasedMetrics()
					).toEqual( [] );
				}
			);

			it.each( [
				[
					'publish_blog',
					[
						'kmAnalyticsLoyalVisitors',
						'kmAnalyticsNewVisitors',
						'kmAnalyticsTopTrafficSource',
						'kmAnalyticsEngagedTrafficSource',
					],
				],
				[
					'publish_news',
					[
						'kmAnalyticsLoyalVisitors',
						'kmAnalyticsNewVisitors',
						'kmAnalyticsTopTrafficSource',
						'kmAnalyticsEngagedTrafficSource',
					],
				],
				[
					'monetize_content',
					[
						'kmAnalyticsPopularContent',
						'kmAnalyticsEngagedTrafficSource',
						'kmAnalyticsNewVisitors',
						'kmAnalyticsTopTrafficSource',
					],
				],
				[
					'sell_products_or_service',
					[
						'kmAnalyticsPopularContent',
						'kmAnalyticsEngagedTrafficSource',
						'kmSearchConsolePopularKeywords',
						'kmAnalyticsTopTrafficSource',
					],
				],
				[
					'share_portfolio',
					[
						'kmAnalyticsNewVisitors',
						'kmAnalyticsTopTrafficSource',
						'kmAnalyticsEngagedTrafficSource',
						'kmSearchConsolePopularKeywords',
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
						registry.select( CORE_WIDGETS ).getAnswerBasedMetrics()
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
					registry.select( CORE_WIDGETS ).getAnswerBasedMetrics()
				).toEqual( [
					'kmTopPopularProducts',
					'kmAnalyticsEngagedTrafficSource',
					'kmSearchConsolePopularKeywords',
					'kmAnalyticsTopTrafficSource',
				] );
			} );
		} );
	} );
} );
