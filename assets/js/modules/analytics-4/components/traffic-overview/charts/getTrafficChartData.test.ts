/**
 * Traffic Overview chart data tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { getGraphReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { getAnalytics4MockResponse } from '@/js/modules/analytics-4/utils/data-mock';
import { DAY_IN_SECONDS } from '@/js/util';
import { getTrafficChartData } from './getTrafficChartData';
import { PUBLISHED_POST_POINT_STYLE } from './trafficChartOptions';

describe( 'getTrafficChartData', () => {
	const reportOptions = getGraphReportArgs( {
		startDate: '2025-01-13',
		endDate: '2025-01-16',
	} );

	it( 'names the columns "Day" and "Users"', () => {
		const { chartData } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData[ 0 ] ).toEqual( [
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Users' },
		] );
	} );

	it( 'draws one point for each day the report returns', () => {
		const { chartData } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 55 ],
			[ new Date( 2025, 0, 14 ), 14 ],
			[ new Date( 2025, 0, 15 ), 3 ],
			[ new Date( 2025, 0, 16 ), 13 ],
		] );
	} );

	it( 'shows a date label under every day except the first', () => {
		const { ticks } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( ticks ).toEqual( [
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 15 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( 'draws a flat line at zero across the whole date range when there is no report', () => {
		const { chartData, hasVisitors } = getTrafficChartData( {
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 0 ],
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( hasVisitors ).toBe( false );
	} );

	it( 'draws a flat line at zero across the whole date range when the report has no rows', () => {
		const { chartData } = getTrafficChartData( {
			report: { rows: [] },
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 0 ],
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
	} );

	it( 'shows a date label on the second day and the last day when there is no report', () => {
		const { ticks } = getTrafficChartData( {
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( ticks ).toEqual( [
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( "finds visitors when the report's total is above zero", () => {
		const { hasVisitors } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisitors ).toBe( true );
	} );

	it( "finds no visitors when the report's total is '0'", () => {
		const { hasVisitors } = getTrafficChartData( {
			report: { totals: [ { metricValues: [ { value: '0' } ] } ] },
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisitors ).toBe( false );
	} );

	it( 'finds no visitors when the report has no total', () => {
		const { hasVisitors } = getTrafficChartData( {
			report: { rows: [] },
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisitors ).toBe( false );
	} );

	it( 'should draw a flat line at zero while the property is gathering data, even though the report has visitors', () => {
		const { chartData, hasVisitors } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
			gatheringData: true,
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 0 ],
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( hasVisitors ).toBe( false );
	} );

	it( 'should show a date label under every day except the first while the property is gathering data', () => {
		const { ticks } = getTrafficChartData( {
			startDate: '2025-01-10',
			endDate: '2025-01-16',
			gatheringData: true,
		} );

		expect( ticks ).toEqual( [
			new Date( 2025, 0, 11 ),
			new Date( 2025, 0, 12 ),
			new Date( 2025, 0, 13 ),
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 15 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( 'should space the date labels one day apart across a 90 day range while the property is gathering data', () => {
		const { ticks } = getTrafficChartData( {
			startDate: '2024-10-19',
			endDate: '2025-01-16',
			gatheringData: true,
		} );

		expect( ticks ).toHaveLength( 89 );
		expect( ticks[ 0 ] ).toEqual( new Date( 2024, 9, 20 ) );
		expect( ticks[ 88 ] ).toEqual( new Date( 2025, 0, 16 ) );

		// Rounding absorbs the hour a daylight-saving change adds or removes.
		const daysBetweenTicks = ticks
			.slice( 1 )
			.map( ( tick, index ) =>
				Math.round(
					( tick.getTime() - ticks[ index ].getTime() ) /
						( DAY_IN_SECONDS * 1000 )
				)
			);

		expect( daysBetweenTicks ).toEqual( Array( 88 ).fill( 1 ) );
	} );

	it( 'should add no column for the typical range or the published posts when the range has neither', () => {
		const { chartData, hasTypicalTrafficRange, hasPublishedPosts } =
			getTrafficChartData( {
				report: getAnalytics4MockResponse( reportOptions ),
				startDate: '2025-01-13',
				endDate: '2025-01-16',
				typicalTrafficRange: [],
				publishedPosts: [],
			} );

		expect( chartData[ 0 ] ).toHaveLength( 2 );
		expect( hasTypicalTrafficRange ).toBe( false );
		expect( hasPublishedPosts ).toBe( false );
	} );

	it( 'should draw the typical range as two interval columns, and leave them empty on a day without a range', () => {
		const { chartData, hasTypicalTrafficRange } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
			typicalTrafficRange: [
				{ date: '2025-01-14', min: 10, max: 30 },
				{ date: '2025-01-15', min: 5, max: 20 },
				{ date: '2025-01-16', min: 8, max: 25 },
			],
		} );

		expect( chartData[ 0 ] ).toEqual( [
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Users' },
			{ type: 'number', role: 'interval' },
			{ type: 'number', role: 'interval' },
			{ type: 'string', role: 'tooltip' },
		] );
		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 55, null, null, '55' ],
			[ new Date( 2025, 0, 14 ), 14, 10, 30, '14' ],
			[ new Date( 2025, 0, 15 ), 3, 5, 20, '3' ],
			[ new Date( 2025, 0, 16 ), 13, 8, 25, '13' ],
		] );
		expect( hasTypicalTrafficRange ).toBe( true );
	} );

	it( "should give each day's tooltip the day's visitors in the format Google Charts gives them", () => {
		const { chartData } = getTrafficChartData( {
			report: {
				rows: [
					{
						dimensionValues: [ { value: '20250113' } ],
						metricValues: [ { value: '12345' } ],
					},
				],
			},
			startDate: '2025-01-13',
			endDate: '2025-01-13',
			typicalTrafficRange: [
				{ date: '2025-01-13', min: 9000, max: 15000 },
			],
		} );

		expect( chartData[ 1 ] ).toEqual( [
			new Date( 2025, 0, 13 ),
			12345,
			9000,
			15000,
			'12,345',
		] );
	} );

	it( 'should mark each day with a published post in a style column, once however many posts the day has', () => {
		const { chartData, hasPublishedPosts } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
			publishedPosts: [
				{
					date: '2025-01-14',
					title: 'Ice cream is good for your health',
				},
				{ date: '2025-01-14', title: 'Eat ice cream every day' },
				{ date: '2025-01-16', title: 'The best ice cream shops guide' },
			],
		} );

		expect( chartData[ 0 ] ).toEqual( [
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Users' },
			{ type: 'string', role: 'style' },
		] );
		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 55, null ],
			[ new Date( 2025, 0, 14 ), 14, PUBLISHED_POST_POINT_STYLE ],
			[ new Date( 2025, 0, 15 ), 3, null ],
			[ new Date( 2025, 0, 16 ), 13, PUBLISHED_POST_POINT_STYLE ],
		] );
		expect( hasPublishedPosts ).toBe( true );
	} );

	it( 'should put the style column after the typical range columns when the range has both', () => {
		const { chartData } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
			typicalTrafficRange: [ { date: '2025-01-14', min: 10, max: 30 } ],
			publishedPosts: [
				{
					date: '2025-01-14',
					title: 'Ice cream is good for your health',
				},
			],
		} );

		expect( chartData[ 0 ].map( ( { role } ) => role ) ).toEqual( [
			undefined,
			undefined,
			'interval',
			'interval',
			'tooltip',
			'style',
		] );
		expect( chartData[ 2 ] ).toEqual( [
			new Date( 2025, 0, 14 ),
			14,
			10,
			30,
			'14',
			PUBLISHED_POST_POINT_STYLE,
		] );
	} );

	it( 'should list each plotted day with its visitors, its typical range and the posts published on it', () => {
		const range = { date: '2025-01-14', min: 10, max: 30 };
		const post = {
			date: '2025-01-14',
			title: 'Ice cream is good for your health',
		};

		const { days } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
			typicalTrafficRange: [ range ],
			publishedPosts: [ post ],
		} );

		expect( days ).toEqual( [
			{ date: new Date( 2025, 0, 13 ), visitors: 55, posts: [] },
			{
				date: new Date( 2025, 0, 14 ),
				visitors: 14,
				typicalRange: range,
				posts: [ post ],
			},
			{ date: new Date( 2025, 0, 15 ), visitors: 3, posts: [] },
			{ date: new Date( 2025, 0, 16 ), visitors: 13, posts: [] },
		] );
	} );

	it( 'should leave out a typical range and a post on a day the chart does not plot', () => {
		const { chartData, hasTypicalTrafficRange, hasPublishedPosts } =
			getTrafficChartData( {
				report: getAnalytics4MockResponse( reportOptions ),
				startDate: '2025-01-13',
				endDate: '2025-01-16',
				typicalTrafficRange: [
					{ date: '2025-01-12', min: 10, max: 30 },
				],
				publishedPosts: [
					{
						date: '2025-01-17',
						title: 'Ice cream is good for your health',
					},
				],
			} );

		expect( chartData[ 0 ] ).toHaveLength( 2 );
		expect( hasTypicalTrafficRange ).toBe( false );
		expect( hasPublishedPosts ).toBe( false );
	} );

	it( 'should draw neither the typical range nor the published posts while the property is gathering data', () => {
		const { chartData, days, hasTypicalTrafficRange, hasPublishedPosts } =
			getTrafficChartData( {
				report: getAnalytics4MockResponse( reportOptions ),
				startDate: '2025-01-13',
				endDate: '2025-01-16',
				gatheringData: true,
				// The flat line at zero plots `2025-01-13`, so the range and the
				// post would land on it.
				typicalTrafficRange: [
					{ date: '2025-01-13', min: 10, max: 30 },
				],
				publishedPosts: [
					{
						date: '2025-01-13',
						title: 'Ice cream is good for your health',
					},
				],
			} );

		expect( chartData[ 0 ] ).toHaveLength( 2 );
		expect( days[ 0 ] ).toEqual( {
			date: new Date( 2025, 0, 13 ),
			visitors: 0,
			posts: [],
		} );
		expect( hasTypicalTrafficRange ).toBe( false );
		expect( hasPublishedPosts ).toBe( false );
	} );
} );
