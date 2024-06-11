/**
 * `modules/analytics-4` data store: pivotReport tests.
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
import { MODULES_ANALYTICS_4 } from './constants';
import {
	createTestRegistry,
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 pivotReport', () => {
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
		const analytics4PivotReportRegexp = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/pivot-report'
		);

		describe( 'getPivotReport', () => {
			const options = {
				startDate: '2024-04-18',
				endDate: '2024-05-15',
				dimensions: [ 'city', 'operatingSystem' ],
				dimensionFilters: {
					operatingSystem: [ 'Windows', 'Macintosh' ],
				},
				metrics: [ { name: 'totalUsers' } ],
				pivots: [
					{
						fieldNames: [ 'operatingSystem' ],
						limit: 3,
					},
					{
						fieldNames: [ 'city' ],
						limit: 3,
						orderby: [
							{
								metric: {
									metricName: 'totalUsers',
								},
								desc: true,
							},
						],
					},
				],
			};

			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce( analytics4PivotReportRegexp, {
					body: fixtures.pivotReport,
					status: 200,
				} );

				const initialReport = registry
					.select( MODULES_ANALYTICS_4 )
					.getPivotReport( options );

				expect( initialReport ).toEqual( undefined );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getPivotReport( options );

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getPivotReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( report ).toEqual( fixtures.pivotReport );
			} );

			it( 'does not make a network request if report for given options is already present', () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetPivotReport( fixtures.pivotReport, { options } );

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getPivotReport( options );

				expect( fetchMock ).not.toHaveFetched();
				expect( report ).toEqual( fixtures.pivotReport );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( analytics4PivotReportRegexp, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getPivotReport( options );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getPivotReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getPivotReport( options );
				expect( report ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
