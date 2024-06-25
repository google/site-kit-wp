/**
 * Data mock tests.
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
	getAnalytics4MockResponse,
	getAnalytics4MockPivotResponse,
	STRATEGY_ZIP,
} from './data-mock';
import mockedReportResponse from './__fixtures__/mocked-report.json';
import mockedReportMultipleDistinctDateRangesResponse from './__fixtures__/mocked-report-multiple-distinct-date-ranges.json';
import mockedReportMultipleOverlappingDateRangesResponse from './__fixtures__/mocked-report-multiple-overlapping-date-ranges.json';
import mockedReportFixedValueDimensionResponse from './__fixtures__/mocked-report-fixed-value-dimension.json';
import mockedReportMultipleDimensionsCartesianResponse from './__fixtures__/mocked-report-multiple-dimensions-cartesian.json';
import mockedReportMultipleDimensionsZippedResponse from './__fixtures__/mocked-report-multiple-dimensions-zipped.json';
import mockedReportOrderByMetricAscendingResponse from './__fixtures__/mocked-report-order-by-metric-ascending.json';
import mockedReportOrderByMetricDescendingResponse from './__fixtures__/mocked-report-order-by-metric-descending.json';
import mockedReportOrderByDimensionAscendingResponse from './__fixtures__/mocked-report-order-by-dimension-ascending.json';
import mockedReportOrderByDimensionDescendingResponse from './__fixtures__/mocked-report-order-by-dimension-descending.json';
import mockedReportOrderByMetricsAndDimensionsResponse from './__fixtures__/mocked-report-order-by-metrics-and-dimensions.json';
import mockedPivotReportResponse from './__fixtures__/mocked-pivot-report.json';
import mockedPivotReportResponse3Dimensions from './__fixtures__/mocked-pivot-report-3-dimensions.json';
import mockedPivotReportMultiDimensionFieldNames from './__fixtures__/mocked-pivot-report-multi-dimension-fieldnames.json';

describe( 'data-mock', () => {
	describe( 'getAnalytics4MockResponse', () => {
		it( 'throws if called without report options', () => {
			expect( () => getAnalytics4MockResponse() ).toThrow(
				'report options are required'
			);
		} );

		it( 'throws if called without a valid startDate', () => {
			expect( () =>
				getAnalytics4MockResponse( { startDate: 'not-a-date' } )
			).toThrow( 'a valid startDate is required' );
		} );

		it( 'throws if called without a valid endDate', () => {
			expect( () =>
				getAnalytics4MockResponse( {
					endDate: 'not-a-date',
					startDate: '2020-12-31',
				} )
			).toThrow( 'a valid endDate is required' );
		} );

		it( 'throws if called with an invalid dimensionFilters', () => {
			expect( () =>
				getAnalytics4MockResponse( {
					startDate: '2020-12-31',
					endDate: '2020-12-31',
					dimensionFilters: { 'test-dimension': false },
				} )
			).toThrow(
				'dimensionFilters must be an object with valid keys and values.'
			);
		} );

		it( 'generates a valid report', () => {
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-29',
				endDate: '2021-01-02',
				metrics: [
					{
						name: 'sessions',
					},
					{
						name: 'engagementRate',
					},
				],
				dimensions: [ 'date' ],
			} );

			expect( report ).toEqual( mockedReportResponse );

			// Verify the correct number of rows for the date range.
			expect( report.rows ).toHaveLength( 5 );
		} );

		it( 'generates unique reports based on dimensionFilters', () => {
			const reportArgs = {
				startDate: '2020-12-29',
				endDate: '2021-01-02',
				metrics: [
					{
						name: 'sessions',
					},
					{
						name: 'engagementRate',
					},
				],
				dimensions: [ 'date', 'testDimension' ],
			};
			const report1 = getAnalytics4MockResponse( reportArgs );

			const report2 = getAnalytics4MockResponse( {
				...reportArgs,
				dimensionFilters: {
					testDimension: '1234',
				},
			} );

			expect( report1 ).not.toEqual( report2 );
		} );

		it( 'generates a valid report with multiple distinct date ranges', () => {
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-01',
				endDate: '2020-12-03',
				compareStartDate: '2020-12-06',
				compareEndDate: '2020-12-07',
				metrics: [
					{
						name: 'totalUsers',
					},
					{
						name: 'averageSessionDuration',
					},
				],
				dimensions: [ 'date' ],
			} );

			expect( report ).toEqual(
				mockedReportMultipleDistinctDateRangesResponse
			);

			// Verify the correct number of rows for the date ranges.
			expect( report.rows ).toHaveLength( 10 );
		} );

		it( 'generates a valid report with multiple overlapping date ranges', () => {
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-01',
				endDate: '2020-12-03',
				compareStartDate: '2020-12-02',
				compareEndDate: '2020-12-05',
				metrics: [
					{
						name: 'totalUsers',
					},
					{
						name: 'averageSessionDuration',
					},
				],
				dimensions: [ 'date' ],
			} );

			expect( report ).toEqual(
				mockedReportMultipleOverlappingDateRangesResponse
			);

			// Verify the correct number of rows for the date ranges.
			expect( report.rows ).toHaveLength( 10 );
		} );

		it( 'generates a valid report using a dimension with a fixed set of values', () => {
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-01',
				endDate: '2020-12-03',
				compareStartDate: '2020-12-04',
				compareEndDate: '2020-12-05',
				metrics: [
					{
						name: 'totalUsers',
					},
					{
						name: 'averageSessionDuration',
					},
				],
				dimensions: [ 'sessionDefaultChannelGrouping' ],
			} );

			expect( report ).toEqual( mockedReportFixedValueDimensionResponse );

			// Verify the correct number of rows for the date ranges.
			expect( report.rows ).toHaveLength( 20 );
		} );

		it( 'generates a valid report using the cartesian product of multiple dimensions', () => {
			// Note that the cartesian strategy is the default for mock reports.
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-01',
				endDate: '2020-12-03',
				compareStartDate: '2020-12-04',
				compareEndDate: '2020-12-05',
				metrics: [
					{
						name: 'totalUsers',
					},
					{
						name: 'averageSessionDuration',
					},
				],
				dimensions: [
					'deviceCategory',
					'sessionDefaultChannelGrouping',
				],
			} );

			expect( report ).toEqual(
				mockedReportMultipleDimensionsCartesianResponse
			);

			// Verify the correct number of rows for the date ranges.
			expect( report.rows ).toHaveLength( 60 );
		} );

		it( 'generates a valid report using zipped multiple dimensions', () => {
			const report = getAnalytics4MockResponse(
				{
					startDate: '2020-12-01',
					endDate: '2020-12-05',
					dimensions: [ 'pagePath', 'pageTitle' ],
					metrics: [ { name: 'totalUsers' } ],
				},
				{
					dimensionCombinationStrategy: STRATEGY_ZIP,
				}
			);

			expect( report ).toEqual(
				mockedReportMultipleDimensionsZippedResponse
			);
		} );

		it( 'generates the same number of rows for each date range in a multi-date range report', () => {
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-01',
				endDate: '2020-12-15',
				compareStartDate: '2020-11-26',
				compareEndDate: '2020-11-30',
				metrics: [
					{
						name: 'totalUsers',
					},
					{
						name: 'averageSessionDuration',
					},
					'sessions',
				],
				dimensions: [ 'date' ],
			} );

			const dateRangeZero = report.rows.filter( ( { dimensionValues } ) =>
				dimensionValues.find(
					( dimensionValue ) =>
						dimensionValue.value === 'date_range_0'
				)
			);

			const dateRangeOne = report.rows.filter( ( { dimensionValues } ) =>
				dimensionValues.find(
					( dimensionValue ) =>
						dimensionValue.value === 'date_range_1'
				)
			);

			expect( dateRangeZero ).toHaveLength( dateRangeOne.length );
		} );

		it( 'sorts by metric in ascending order', () => {
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-01',
				endDate: '2020-12-05',
				metrics: [
					{
						name: 'totalUsers',
					},
					{
						name: 'averageSessionDuration',
					},
				],
				dimensions: [
					{
						name: 'date',
					},
				],
				orderby: [
					{
						metric: {
							metricName: 'totalUsers',
						},
						desc: false,
					},
				],
			} );

			expect( report ).toEqual(
				mockedReportOrderByMetricAscendingResponse
			);
		} );

		it( 'sorts by metric in descending order', () => {
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-01',
				endDate: '2020-12-05',
				metrics: [
					{
						name: 'totalUsers',
					},
					{
						name: 'averageSessionDuration',
					},
				],
				dimensions: [
					{
						name: 'date',
					},
				],
				orderby: [
					{
						metric: {
							metricName: 'averageSessionDuration',
						},
						desc: true,
					},
				],
			} );

			expect( report ).toEqual(
				mockedReportOrderByMetricDescendingResponse
			);
		} );

		it( 'sorts by dimension in ascending order', () => {
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-01',
				endDate: '2020-12-05',
				metrics: [
					{
						name: 'totalUsers',
					},
				],
				dimensions: [
					{
						name: 'date',
					},
					{
						name: 'sessionDefaultChannelGrouping',
					},
				],
				orderby: [
					{
						dimension: {
							dimensionName: 'date',
						},
						desc: false,
					},
				],
			} );

			expect( report ).toEqual(
				mockedReportOrderByDimensionAscendingResponse
			);
		} );

		it( 'sorts by dimension in descending order', () => {
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-01',
				endDate: '2020-12-05',
				metrics: [
					{
						name: 'totalUsers',
					},
				],
				dimensions: [
					{
						name: 'date',
					},
					{
						name: 'sessionDefaultChannelGrouping',
					},
				],
				orderby: [
					{
						dimension: {
							dimensionName: 'sessionDefaultChannelGrouping',
						},
						desc: true,
					},
				],
			} );

			expect( report ).toEqual(
				mockedReportOrderByDimensionDescendingResponse
			);
		} );

		it( 'sorts by a combination of metrics and dimensions, with multiple date ranges', () => {
			const report = getAnalytics4MockResponse( {
				startDate: '2020-12-01',
				endDate: '2020-12-02',
				compareStartDate: '2020-12-04',
				compareEndDate: '2020-12-05',
				metrics: [
					{
						name: 'totalUsers',
					},
					{
						name: 'averageSessionDuration',
					},
				],
				dimensions: [
					{
						name: 'date',
					},
					{
						name: 'sessionDefaultChannelGrouping',
					},
				],
				orderby: [
					{
						dimension: {
							dimensionName: 'date',
						},
						desc: false,
					},
					{
						metric: {
							metricName: 'totalUsers',
						},
						desc: true,
					},
				],
			} );

			expect( report ).toEqual(
				mockedReportOrderByMetricsAndDimensionsResponse
			);
		} );
	} );

	describe( 'getAnalytics4MockPivotResponse', () => {
		it( 'generates pivot reports with the correct number of columns', () => {
			const report = getAnalytics4MockPivotResponse( {
				startDate: '2024-04-18',
				endDate: '2024-05-15',
				metrics: [
					{
						name: 'screenPageViewsPerSession',
					},
					{
						name: 'averageSessionDuration',
					},
				],
				dimensions: [ 'city', 'audienceResourceName' ],
				pivots: [
					{
						fieldNames: [ 'audienceResourceName' ],
						limit: 3,
					},
					{
						fieldNames: [ 'city' ],
						limit: 3,
						orderby: [
							{
								metric: {
									metricName: 'screenPageViewsPerSession',
								},
							},
						],
					},
				],
			} );

			expect( report ).toEqual( mockedPivotReportResponse );

			// Verify the correct number of rows for the pivot, there should be the product of the limits of each pivot.
			expect( report.rows ).toHaveLength( 3 * 3 );
			// Verify a row has just a dimensionValue and metricValue key.
			expect( report.rows[ 0 ] ).toHaveProperty( 'dimensionValues' );
			expect( report.rows[ 0 ] ).toHaveProperty( 'metricValues' );

			// Verify the correct number of pivotHeaders, there should be one for each pivot.
			expect( report.pivotHeaders ).toHaveLength( 2 );
			// And each should have a pivotDimensionHeaders and rowCount prop.
			report.pivotHeaders.forEach( ( pivotHeader ) => {
				expect( pivotHeader ).toHaveProperty( 'pivotDimensionHeaders' );
				expect( pivotHeader ).toHaveProperty( 'rowCount' );
			} );

			// Verify the aggregate should have 3 * the number of dimensions as each dimension has a total, max and min.
			expect( report.aggregates ).toHaveLength( 3 * 2 );
		} );

		it( 'generates pivot reports with the correct number of columns with three dimensions', () => {
			const report = getAnalytics4MockPivotResponse( {
				startDate: '2024-04-18',
				endDate: '2024-05-15',
				metrics: [
					{
						name: 'totalUsers',
					},
					{
						name: 'activeUsers',
					},
				],
				dimensions: [ 'city', 'audienceResourceName', 'country' ],
				pivots: [
					{
						fieldNames: [ 'audienceResourceName' ],
						limit: 2,
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
					{
						fieldNames: [ 'country' ],
						limit: 3,
					},
				],
			} );

			expect( report ).toEqual( mockedPivotReportResponse3Dimensions );

			// Verify the correct number of rows for the pivot, there should be the product of the limits of each pivot.
			expect( report.rows ).toHaveLength( 2 * 3 * 3 );
			// Verify a row has just a dimensionValue and metricValue key.
			expect( report.rows[ 0 ] ).toHaveProperty( 'dimensionValues' );
			expect( report.rows[ 0 ] ).toHaveProperty( 'metricValues' );

			// Verify the correct number of pivotHeaders, there should be one for each pivot.
			expect( report.pivotHeaders ).toHaveLength( 3 );
			// And each should have a pivotDimensionHeaders and rowCount prop.
			report.pivotHeaders.forEach( ( pivotHeader ) => {
				expect( pivotHeader ).toHaveProperty( 'pivotDimensionHeaders' );
				expect( pivotHeader ).toHaveProperty( 'rowCount' );
			} );

			// Verify the aggregate should have 3 * the number of dimensions as each dimension has a total, max and min.
			expect( report.aggregates ).toHaveLength( 3 * 3 );
		} );

		it( 'generates pivot reports with the correct number of report rows with multiple fieldNames in pivot', () => {
			const report = getAnalytics4MockPivotResponse( {
				startDate: '2024-04-18',
				endDate: '2024-05-15',
				metrics: [
					{
						name: 'totalUsers',
					},
					{
						name: 'activeUsers',
					},
				],
				dimensions: [
					'city',
					'audienceResourceName',
					'country',
					'sessionDefaultChannelGrouping',
				],
				pivots: [
					{
						fieldNames: [ 'audienceResourceName' ],
						limit: 2,
					},
					{
						fieldNames: [ 'city', 'country' ],
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
					{
						fieldNames: [ 'sessionDefaultChannelGrouping' ],
						limit: 4,
					},
				],
			} );

			expect( report ).toEqual(
				mockedPivotReportMultiDimensionFieldNames
			);

			// Verify the correct number of rows for the pivot, there should be the product pivot[ 0 ].limit * pivot[ 1 ].limit
			expect( report.rows ).toHaveLength( 2 * 3 * 4 );

			// Verify a row has just a dimensionValue and metricValue key.
			expect( report.rows[ 0 ] ).toHaveProperty( 'dimensionValues' );
			expect( report.rows[ 0 ] ).toHaveProperty( 'metricValues' );
		} );
	} );
} );
