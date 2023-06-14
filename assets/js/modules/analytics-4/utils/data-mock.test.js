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
import { getAnalytics4MockResponse, STRATEGY_ZIP } from './data-mock';

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

		expect( report ).toMatchSnapshot();

		// Verify the correct number of rows for the date range.
		expect( report.rows ).toHaveLength( 5 );
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

		expect( report ).toMatchSnapshot();

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

		expect( report ).toMatchSnapshot();

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

		expect( report ).toMatchSnapshot();

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
			dimensions: [ 'deviceCategory', 'sessionDefaultChannelGrouping' ],
		} );

		expect( report ).toMatchSnapshot();

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

		expect( report ).toMatchSnapshot();
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
				( dimensionValue ) => dimensionValue.value === 'current_range'
			)
		);

		const dateRangeOne = report.rows.filter( ( { dimensionValues } ) =>
			dimensionValues.find(
				( dimensionValue ) => dimensionValue.value === 'compare_range'
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

		expect( report ).toMatchSnapshot();
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

		expect( report ).toMatchSnapshot();
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

		expect( report ).toMatchSnapshot();
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

		expect( report ).toMatchSnapshot();
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

		expect( report ).toMatchSnapshot();
	} );
} );
