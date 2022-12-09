/**
 * `modules/analytics-4` data store: report tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 report', () => {
	let registry;

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

	describe( 'selectors', () => {
		describe( 'getReport', () => {
			const options = {
				startDate: '2021-01-01',
				endDate: '2021-01-31',
				metrics: {
					expression: 'testExpression',
					alias: 'testAlias',
				},
			};

			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics-4\/data\/report/,
					{
						body: fixtures.report,
						status: 200,
					}
				);

				const initialReport = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );

				expect( initialReport ).toEqual( undefined );
				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					options
				);

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( fixtures.report, { options } );

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );

				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					options
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics-4\/data\/report/,
					{
						body: response,
						status: 500,
					}
				);

				registry.select( MODULES_ANALYTICS_4 ).getReport( options );
				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					options
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );
				expect( report ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
