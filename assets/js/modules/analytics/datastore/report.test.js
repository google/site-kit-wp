/**
 * `modules/analytics` data store: report tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { MODULES_ANALYTICS } from './constants';
import {
	createTestRegistry,
	untilResolved,
	unsubscribeFromAll,
	freezeFetch,
	subscribeUntil,
	muteFetch,
	waitForTimeouts,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import { isZeroReport } from '../util';

describe( 'modules/analytics report', () => {
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
		const zeroRowsReport = [ { data: { rows: [] } } ];

		const analyticsReportRegexp = new RegExp(
			'^/google-site-kit/v1/modules/analytics/data/report'
		);
		const dataAvailableRegexp = new RegExp(
			'^/google-site-kit/v1/modules/analytics/data/data-available'
		);
		const errorResponse = {
			status: 403,
			body: {
				code: 403,
				message:
					'User does not have sufficient permissions for this profile.',
				data: { status: 403, reason: 'forbidden' },
			},
		};

		const consoleError = [
			'Google Site Kit API Error',
			'method:GET',
			'datapoint:report',
			'type:modules',
			'identifier:analytics',
			'error:"User does not have sufficient permissions for this profile."',
		];

		describe( 'getReport', () => {
			const options = {
				dateRange: 'last-90-days',
				metrics: {
					expression: 'testExpression',
					alias: 'testAlias',
				},
			};

			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: fixtures.report,
					status: 200,
				} );

				const initialReport = registry
					.select( MODULES_ANALYTICS )
					.getReport( options );

				expect( initialReport ).toEqual( undefined );
				await untilResolved( registry, MODULES_ANALYTICS ).getReport(
					options
				);

				const report = registry
					.select( MODULES_ANALYTICS )
					.getReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetReport( fixtures.report, { options } );

				const report = registry
					.select( MODULES_ANALYTICS )
					.getReport( options );

				await untilResolved( registry, MODULES_ANALYTICS ).getReport(
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

				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: response,
					status: 500,
				} );

				registry.select( MODULES_ANALYTICS ).getReport( options );
				await untilResolved( registry, MODULES_ANALYTICS ).getReport(
					options
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry
					.select( MODULES_ANALYTICS )
					.getReport( options );
				expect( report ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'sets adsenseLinked to false if a 400 error is returned for AdSense metrics due to them being restricted', async () => {
				const adsenseOptions = {
					dateRange: 'last-28-days',
					metrics: 'ga:adsenseRevenue',
				};
				const restrictedMetricsError = {
					code: 400,
					message:
						'Restricted metric(s): ga:adsenseRevenue can only be queried under certain conditions.',
				};
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: restrictedMetricsError,
					status: 400,
				} );

				registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
				registry.dispatch( MODULES_ANALYTICS ).setAdsenseLinked( true );
				expect(
					registry.select( MODULES_ANALYTICS ).getAdsenseLinked()
				).toBe( true );

				registry
					.select( MODULES_ANALYTICS )
					.getReport( adsenseOptions );
				await untilResolved( registry, MODULES_ANALYTICS ).getReport(
					adsenseOptions
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect(
					registry.select( MODULES_ANALYTICS ).getAdsenseLinked()
				).toBe( false );
				expect( console ).toHaveErrored(); // fetch will trigger 400 error.
			} );

			it( 'does not modify adsenseLinked if a 400 error is returned for non-AdSense metrics', async () => {
				const nonAdsenseOptions = {
					dateRange: 'last-28-days',
					metrics: 'ga:nonadsenseMetric',
				};
				const restrictedMetricsError = {
					code: 400,
					message:
						'Restricted metric(s): ga:nonadsenseMetric can only be queried under certain conditions.',
				};
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: restrictedMetricsError,
					status: 400,
				} );

				registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
				registry.dispatch( MODULES_ANALYTICS ).setAdsenseLinked( true );
				expect(
					registry.select( MODULES_ANALYTICS ).getAdsenseLinked()
				).toBe( true );

				registry
					.select( MODULES_ANALYTICS )
					.getReport( nonAdsenseOptions );
				await untilResolved( registry, MODULES_ANALYTICS ).getReport(
					nonAdsenseOptions
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect(
					registry.select( MODULES_ANALYTICS ).getAdsenseLinked()
				).toBe( true );
				expect( console ).toHaveErrored(); // fetch will trigger 400 error.
			} );

			it( 'sets adsenseLinked to true if a successful response is returned for AdSense metrics', async () => {
				const adsenseOptions = {
					dateRange: 'last-28-days',
					metrics: 'ga:adsenseRevenue',
				};
				const restrictedMetricsSuccess = [
					{
						totals: [],
						rows: [],
					},
				];
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: restrictedMetricsSuccess,
					status: 200,
				} );

				registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setAdsenseLinked( false );
				expect(
					registry.select( MODULES_ANALYTICS ).getAdsenseLinked()
				).toBe( false );

				registry
					.select( MODULES_ANALYTICS )
					.getReport( adsenseOptions );
				await untilResolved( registry, MODULES_ANALYTICS ).getReport(
					adsenseOptions
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect(
					registry.select( MODULES_ANALYTICS ).getAdsenseLinked()
				).toBe( true );
			} );

			it( 'sets adsenseLinked to true if a 400 error is returned for AdSense metrics due to non-AdSense restricted metrics', async () => {
				const adsenseAndNonAdSenseOptions = {
					dateRange: 'last-28-days',
					metrics: [ 'ga:nonadsenseMetric', 'ga:adsenseRevenue' ],
				};
				const restrictedMetricsError = {
					code: 400,
					message:
						'Restricted metric(s): ga:nonadsenseMetric can only be queried under certain conditions.',
				};
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: restrictedMetricsError,
					status: 400,
				} );

				registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setAdsenseLinked( false );
				expect(
					registry.select( MODULES_ANALYTICS ).getAdsenseLinked()
				).toBe( false );

				registry
					.select( MODULES_ANALYTICS )
					.getReport( adsenseAndNonAdSenseOptions );
				await untilResolved( registry, MODULES_ANALYTICS ).getReport(
					adsenseAndNonAdSenseOptions
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect(
					registry.select( MODULES_ANALYTICS ).getAdsenseLinked()
				).toBe( true );
				expect( console ).toHaveErrored(); // fetch will trigger 400 error.
			} );
		} );

		describe( 'getPageTitles', () => {
			it( 'generates a map using a getReport call.', async () => {
				const startDate = '2021-01-01';
				const endDate = '2021-01-31';
				const pagePaths = [ '/', '/one/', '/two/' ];

				const pageTitlesArgs = {
					startDate,
					endDate,
					dimensions: [ 'ga:pagePath', 'ga:pageTitle' ],
					dimensionFilters: {
						'ga:pagePath': pagePaths,
					},
					metrics: [
						{
							expression: 'ga:pageviews',
							alias: 'Pageviews',
						},
					],
					orderby: [
						{ fieldName: 'ga:pageviews', sortOrder: 'DESCENDING' },
					],
					limit: 15,
				};

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetReport( fixtures.pageTitles, {
						options: pageTitlesArgs,
					} );

				const report = registry
					.select( MODULES_ANALYTICS )
					.getReport( pageTitlesArgs );

				await untilResolved( registry, MODULES_ANALYTICS ).getReport(
					pageTitlesArgs
				);

				registry
					.select( MODULES_ANALYTICS )
					.getPageTitles( report, { startDate, endDate } );

				const titles = registry
					.select( MODULES_ANALYTICS )
					.getPageTitles( report, { startDate, endDate } );

				expect( titles ).toStrictEqual( {
					'/': 'HOME',
					'/one/': 'ONE',
					'/two/': 'TWO',
				} );
			} );
		} );

		describe( 'isGatheringData', () => {
			it( 'should return undefined if getReport is not resolved yet', async () => {
				freezeFetch( new RegExp( analyticsReportRegexp ) );

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS );

				expect( isGatheringData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );
			} );

			it( 'should return TRUE if report API returns error', async () => {
				fetchMock.getOnce( analyticsReportRegexp, errorResponse );

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS );

				expect( isGatheringData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );

				expect( console ).toHaveErroredWith( ...consoleError );
				expect( isGatheringData() ).toBe( true );
				expect( fetchMock ).not.toHaveFetched( dataAvailableRegexp );
			} );

			it( 'should return TRUE if the returned report rows are null', async () => {
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: [ { data: { rows: null } } ],
				} );

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS );

				expect( isGatheringData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined
				);

				expect( isGatheringData() ).toBe( true );
			} );

			it( 'should return TRUE if the returned report is an empty array', async () => {
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: zeroRowsReport,
				} );

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS );

				expect( isGatheringData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined
				);

				expect( isGatheringData() ).toBe( true );
			} );

			it( 'should return FALSE if the returned report has rows', async () => {
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: fixtures.report,
				} );

				muteFetch( dataAvailableRegexp );

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS );

				expect( isGatheringData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined
				);

				expect( isGatheringData() ).toBe( false );
			} );
		} );

		describe( 'hasZeroData', () => {
			it( 'should return `undefined` if getReport or isGatheringData is not resolved yet', async () => {
				freezeFetch( new RegExp( analyticsReportRegexp ) );

				const { hasZeroData, isResolving } =
					registry.select( MODULES_ANALYTICS );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isResolving( 'isGatheringData', [] ) === true
				);

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );

				expect( fetchMock ).toHaveFetched( analyticsReportRegexp );
			} );

			it( 'should return TRUE if report API returns error', async () => {
				fetchMock.getOnce( analyticsReportRegexp, errorResponse );

				const { hasZeroData } = registry.select( MODULES_ANALYTICS );

				expect( hasZeroData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );

				expect( console ).toHaveErroredWith( ...consoleError );

				expect( hasZeroData() ).toBe( true );
				expect( fetchMock ).not.toHaveFetched( dataAvailableRegexp );
			} );

			it( 'should return TRUE if isGatheringData is true', async () => {
				fetchMock.getOnce(
					new RegExp( analyticsReportRegexp ),
					// When `rows` is `null` it means we're still gathering data for
					// this report.
					{ body: [ { data: { rows: null } } ] }
				);

				const { hasZeroData, isGatheringData } =
					registry.select( MODULES_ANALYTICS );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined,
					() => hasZeroData() !== undefined
				);

				expect( hasZeroData() ).toBe( true );
			} );

			it( 'should return TRUE if isZeroReport is true', async () => {
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: zeroRowsReport,
				} );

				const { hasZeroData } = registry.select( MODULES_ANALYTICS );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => hasZeroData() !== undefined
				);

				expect( hasZeroData() ).toBe( true );
			} );

			it( 'should return FALSE if isGatheringData returns FALSE', async () => {
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: fixtures.report,
				} );

				muteFetch( dataAvailableRegexp );

				const { hasZeroData, isGatheringData } =
					registry.select( MODULES_ANALYTICS );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined,
					() => hasZeroData() !== undefined
				);

				expect( isGatheringData() ).toBe( false );
				expect( hasZeroData() ).toBe( false );
			} );

			it( 'should return FALSE if isZeroReport returns FALSE', async () => {
				expect( isZeroReport( fixtures.report ) ).toBe( false );
				fetchMock.getOnce( new RegExp( analyticsReportRegexp ), {
					body: fixtures.report,
				} );

				muteFetch( dataAvailableRegexp );

				const { hasZeroData } = registry.select( MODULES_ANALYTICS );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => hasZeroData() !== undefined
				);

				expect( hasZeroData() ).toBe( false );
			} );
		} );
	} );
} );
