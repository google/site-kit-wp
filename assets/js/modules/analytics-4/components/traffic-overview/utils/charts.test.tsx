/**
 * Traffic Overview chart utility tests.
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
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getAnalytics4MockResponse } from '@/js/modules/analytics-4/utils/data-mock';
import { DAY_IN_SECONDS, getDateString } from '@/js/util';
import { render } from '@tests/js/test-utils';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import {
	PUBLISHED_POST_POINT_STYLE,
	getPlaceholderDailyTraffic,
	getPlaceholderPublishedPosts,
	getPublishedPosts,
	getTrafficChartData,
	getTrafficLegendItem,
	getTypicalTrafficChartData,
	getTypicalTrafficLegendItem,
} from './charts';

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
} );

describe( 'getTypicalTrafficChartData', () => {
	const dailyTraffic: BenchmarkingDailyTrafficRow[] = [
		{
			date: '2025-01-13',
			visits: 55,
			expectedMin: null,
			expectedMax: null,
		},
		{
			date: '2025-01-14',
			visits: 14,
			expectedMin: null,
			expectedMax: null,
		},
		{ date: '2025-01-15', visits: 3, expectedMin: null, expectedMax: null },
		{
			date: '2025-01-16',
			visits: 13,
			expectedMin: null,
			expectedMax: null,
		},
	];

	/**
	 * Gives the days of `dailyTraffic` the bounds of their typical range.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array.<Array>} bounds The bounds of each day, as `[ expectedMin, expectedMax ]`, or `null` for a day without a typical range.
	 * @return {Array.<Object>} The days, each with its bounds.
	 */
	function withBounds(
		bounds: ( [ number, number ] | null )[]
	): BenchmarkingDailyTrafficRow[] {
		return dailyTraffic.map( ( day, index ) => ( {
			...day,
			expectedMin: bounds[ index ]?.[ 0 ] ?? null,
			expectedMax: bounds[ index ]?.[ 1 ] ?? null,
		} ) );
	}

	it( 'should name the columns "Day" and "Visits"', () => {
		const { chartData } = getTypicalTrafficChartData( {
			dailyTraffic,
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData[ 0 ] ).toEqual( [
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Visits' },
		] );
	} );

	it( 'should draw one point for each day of the daily traffic', () => {
		const { chartData } = getTypicalTrafficChartData( {
			dailyTraffic,
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
		const { ticks } = getTypicalTrafficChartData( {
			dailyTraffic,
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( ticks ).toEqual( [
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 15 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( 'should draw a flat line at zero across the whole date range when there is no daily traffic', () => {
		const { chartData, hasVisits } = getTypicalTrafficChartData( {
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 0 ],
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( hasVisits ).toBe( false );
	} );

	it( 'should draw a flat line at zero across the whole date range when the daily traffic has no days', () => {
		const { chartData, hasVisits } = getTypicalTrafficChartData( {
			dailyTraffic: [],
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 0 ],
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( hasVisits ).toBe( false );
	} );

	it( 'should show a date label on the second day and the last day when there is no daily traffic', () => {
		const { ticks } = getTypicalTrafficChartData( {
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( ticks ).toEqual( [
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( 'should find visits when a day is above zero', () => {
		const { hasVisits } = getTypicalTrafficChartData( {
			dailyTraffic,
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisits ).toBe( true );
	} );

	it( 'should find no visits when every day is at zero', () => {
		const { hasVisits } = getTypicalTrafficChartData( {
			dailyTraffic: dailyTraffic.map( ( day ) => ( {
				...day,
				visits: 0,
			} ) ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisits ).toBe( false );
	} );

	it( 'should draw a flat line at zero while the property is gathering data, even though the daily traffic has visits', () => {
		const { chartData, hasVisits } = getTypicalTrafficChartData( {
			dailyTraffic,
			startDate: '2025-01-13',
			endDate: '2025-01-16',
			gatheringData: true,
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 0 ],
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( hasVisits ).toBe( false );
	} );

	it( 'should show a date label under every day except the first while the property is gathering data', () => {
		const { ticks } = getTypicalTrafficChartData( {
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
		const { ticks } = getTypicalTrafficChartData( {
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
			getTypicalTrafficChartData( {
				// Every day has null bounds.
				dailyTraffic,
				startDate: '2025-01-13',
				endDate: '2025-01-16',
				publishedPosts: [],
			} );

		expect( chartData[ 0 ] ).toHaveLength( 2 );
		expect( hasTypicalTrafficRange ).toBe( false );
		expect( hasPublishedPosts ).toBe( false );
	} );

	it( 'should draw the bounds of each day as two interval columns', () => {
		const { chartData, hasTypicalTrafficRange } =
			getTypicalTrafficChartData( {
				dailyTraffic: withBounds( [
					[ 40, 70 ],
					[ 10, 30 ],
					[ 5, 20 ],
					[ 8, 25 ],
				] ),
				startDate: '2025-01-13',
				endDate: '2025-01-16',
			} );

		expect( chartData[ 0 ] ).toEqual( [
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Visits' },
			{ type: 'number', role: 'interval' },
			{ type: 'number', role: 'interval' },
			{ type: 'string', role: 'tooltip' },
		] );
		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 55, 40, 70, '55' ],
			[ new Date( 2025, 0, 14 ), 14, 10, 30, '14' ],
			[ new Date( 2025, 0, 15 ), 3, 5, 20, '3' ],
			[ new Date( 2025, 0, 16 ), 13, 8, 25, '13' ],
		] );
		expect( hasTypicalTrafficRange ).toBe( true );
	} );

	it( 'should draw the bounds as they are, with their decimals', () => {
		const { chartData } = getTypicalTrafficChartData( {
			dailyTraffic: withBounds( [
				[ 39.6, 71.3 ],
				[ 10.4, 31.6 ],
				[ 1.5, 6 ],
				[ 7, 19.5 ],
			] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 55, 39.6, 71.3, '55' ],
			[ new Date( 2025, 0, 14 ), 14, 10.4, 31.6, '14' ],
			[ new Date( 2025, 0, 15 ), 3, 1.5, 6, '3' ],
			[ new Date( 2025, 0, 16 ), 13, 7, 19.5, '13' ],
		] );
	} );

	it( 'should draw no typical range when a day has null bounds, as the band covers the whole range or none of it', () => {
		const { chartData, days, hasTypicalTrafficRange } =
			getTypicalTrafficChartData( {
				dailyTraffic: withBounds( [
					null,
					null,
					[ 1.5, 6 ],
					[ 7, 19.5 ],
				] ),
				startDate: '2025-01-13',
				endDate: '2025-01-16',
			} );

		// The line plots every day, and no day gets a typical range.
		expect( chartData[ 0 ] ).toHaveLength( 2 );
		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 55 ],
			[ new Date( 2025, 0, 14 ), 14 ],
			[ new Date( 2025, 0, 15 ), 3 ],
			[ new Date( 2025, 0, 16 ), 13 ],
		] );
		expect( days ).toEqual( [
			{ date: new Date( 2025, 0, 13 ), visits: 55, posts: [] },
			{ date: new Date( 2025, 0, 14 ), visits: 14, posts: [] },
			{ date: new Date( 2025, 0, 15 ), visits: 3, posts: [] },
			{ date: new Date( 2025, 0, 16 ), visits: 13, posts: [] },
		] );
		expect( hasTypicalTrafficRange ).toBe( false );
	} );

	it( "should give each day's tooltip the day's visits in the format Google Charts gives them", () => {
		const { chartData } = getTypicalTrafficChartData( {
			dailyTraffic: [
				{
					date: '2025-01-13',
					visits: 12345,
					expectedMin: 9000,
					expectedMax: 15000,
				},
			],
			startDate: '2025-01-13',
			endDate: '2025-01-13',
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
		const { chartData, hasPublishedPosts } = getTypicalTrafficChartData( {
			dailyTraffic,
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
			{ type: 'number', label: 'Visits' },
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
		const { chartData } = getTypicalTrafficChartData( {
			dailyTraffic: withBounds( [
				[ 40, 70 ],
				[ 10, 30 ],
				[ 5, 20 ],
				[ 8, 25 ],
			] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
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

	it( 'should list each plotted day with its visits, its typical range and the posts published on it', () => {
		const post = {
			date: '2025-01-14',
			title: 'Ice cream is good for your health',
		};

		const { days } = getTypicalTrafficChartData( {
			dailyTraffic: withBounds( [
				[ 40, 70 ],
				[ 10, 30 ],
				[ 5, 20 ],
				[ 8, 25 ],
			] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
			publishedPosts: [ post ],
		} );

		expect( days ).toEqual( [
			{
				date: new Date( 2025, 0, 13 ),
				visits: 55,
				typicalRange: { min: 40, max: 70 },
				posts: [],
			},
			{
				date: new Date( 2025, 0, 14 ),
				visits: 14,
				typicalRange: { min: 10, max: 30 },
				posts: [ post ],
			},
			{
				date: new Date( 2025, 0, 15 ),
				visits: 3,
				typicalRange: { min: 5, max: 20 },
				posts: [],
			},
			{
				date: new Date( 2025, 0, 16 ),
				visits: 13,
				typicalRange: { min: 8, max: 25 },
				posts: [],
			},
		] );
	} );

	it( 'should leave out a post on a day the chart does not plot', () => {
		const { chartData, hasPublishedPosts } = getTypicalTrafficChartData( {
			dailyTraffic,
			startDate: '2025-01-13',
			endDate: '2025-01-16',
			publishedPosts: [
				{
					date: '2025-01-17',
					title: 'Ice cream is good for your health',
				},
			],
		} );

		expect( chartData[ 0 ] ).toHaveLength( 2 );
		expect( hasPublishedPosts ).toBe( false );
	} );

	it( 'should draw neither the typical range nor the published posts while the property is gathering data', () => {
		const { chartData, days, hasTypicalTrafficRange, hasPublishedPosts } =
			getTypicalTrafficChartData( {
				// Every day has a typical range, and the flat line at zero plots
				// `2025-01-13`, so the band and the post would land on it.
				dailyTraffic: withBounds( [
					[ 10, 30 ],
					[ 10, 30 ],
					[ 10, 30 ],
					[ 10, 30 ],
				] ),
				startDate: '2025-01-13',
				endDate: '2025-01-16',
				gatheringData: true,
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
			visits: 0,
			posts: [],
		} );
		expect( hasTypicalTrafficRange ).toBe( false );
		expect( hasPublishedPosts ).toBe( false );
	} );
} );

describe( 'getPublishedPosts', () => {
	it( "should list each post of each marker with its marker's day and its URL on the site", () => {
		expect(
			getPublishedPosts(
				[
					{
						date: '2025-01-12',
						posts: [
							{
								title: 'Ice cream is good for your health',
								url: '/ice-cream/',
							},
						],
					},
					{
						date: '2025-01-22',
						posts: [
							{
								title: 'Eat ice cream every day',
								url: '/every-day/',
							},
							{
								title: 'The best ice cream shops guide',
								url: '/shops/',
							},
						],
					},
				],
				'http://example.com'
			)
		).toEqual( [
			{
				date: '2025-01-12',
				title: 'Ice cream is good for your health',
				url: 'http://example.com/ice-cream/',
			},
			{
				date: '2025-01-22',
				title: 'Eat ice cream every day',
				url: 'http://example.com/every-day/',
			},
			{
				date: '2025-01-22',
				title: 'The best ice cream shops guide',
				url: 'http://example.com/shops/',
			},
		] );
	} );

	it( "should resolve a post's path from the root of a site in a subdirectory", () => {
		// Analytics reports the whole path, which already starts with the
		// site's subdirectory.
		expect(
			getPublishedPosts(
				[
					{
						date: '2025-01-12',
						posts: [ { title: 'Garlic', url: '/blog/garlic/' } ],
					},
				],
				'http://example.com/blog'
			)
		).toEqual( [
			{
				date: '2025-01-12',
				title: 'Garlic',
				url: 'http://example.com/blog/garlic/',
			},
		] );
	} );

	it( 'should list no post when there are no markers', () => {
		expect( getPublishedPosts( [], 'http://example.com' ) ).toEqual( [] );
		expect( getPublishedPosts( undefined, 'http://example.com' ) ).toEqual(
			[]
		);
	} );
} );

describe( 'getTrafficLegendItem', () => {
	it( 'should return the "Last 28 days traffic" label and the `#462083` line color for a 28-day range', () => {
		expect( getTrafficLegendItem( 28 ) ).toEqual( {
			label: 'Last 28 days traffic',
			color: '#462083',
		} );
	} );

	it( 'should return the "Last 1 day traffic" label for a one-day range', () => {
		expect( getTrafficLegendItem( 1 ).label ).toBe( 'Last 1 day traffic' );
	} );
} );

/**
 * Renders the tooltip of a legend item, with the site's info, which its
 * "Learn more" link reads the support URL from.
 *
 * @since n.e.x.t
 *
 * @param {Object} item The legend item.
 * @return {Object} The render result.
 */
function renderInfo( item: ReturnType< typeof getTypicalTrafficLegendItem > ) {
	const registry = createTestRegistry();
	provideSiteInfo( registry );

	return render( <div>{ item.info }</div>, { registry } );
}

/**
 * Renders the tooltip text of a legend item.
 *
 * @since n.e.x.t
 *
 * @param {Object} item The legend item.
 * @return {string|null} The text of its tooltip.
 */
function getInfoText( item: ReturnType< typeof getTypicalTrafficLegendItem > ) {
	return renderInfo( item ).container.textContent;
}

describe( 'getTypicalTrafficLegendItem', () => {
	it( 'should return the "Typical traffic range" label, the `#e3d1ff` area color and a "Beta" badge', () => {
		expect( getTypicalTrafficLegendItem( { referenceDays: 364 } ) ).toEqual(
			expect.objectContaining( {
				label: 'Typical traffic range',
				color: '#e3d1ff',
				swatch: 'area',
				isBeta: true,
			} )
		);
	} );

	it( 'should say how many weeks of traffic the range is based on', () => {
		expect(
			getInfoText( getTypicalTrafficLegendItem( { referenceDays: 364 } ) )
		).toBe(
			'Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on 52 weeks of your traffic. Learn more'
		);
	} );

	it.each( [
		// The fewest days a band of 28 days is fitted on.
		[ 83, 11 ],
		[ 84, 12 ],
		// The most days a band is fitted on.
		[ 365, 52 ],
	] )(
		'should name %d days of traffic as %d whole weeks, never more than the band read',
		( referenceDays, weeks ) => {
			expect(
				getInfoText( getTypicalTrafficLegendItem( { referenceDays } ) )
			).toContain( `Based on ${ weeks } weeks of your traffic.` );
		}
	);

	it( 'should mention the same time last year only when the history reaches it', () => {
		expect(
			getInfoText(
				getTypicalTrafficLegendItem( {
					referenceDays: 365,
					lastYearAvailable: true,
				} )
			)
		).toContain(
			'Based on 52 weeks of your traffic, including the same time last year.'
		);

		expect(
			getInfoText(
				getTypicalTrafficLegendItem( {
					referenceDays: 365,
					lastYearAvailable: false,
				} )
			)
		).not.toContain( 'last year' );
	} );

	it( 'should end the tooltip with a "Learn more" link to the typical traffic range\'s support page', () => {
		const { getByRole } = renderInfo(
			getTypicalTrafficLegendItem( { referenceDays: 364 } )
		);

		const learnMoreLink = getByRole( 'link', { name: /Learn more/ } );

		expect( learnMoreLink ).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?doc=typical-traffic-range'
		);
		expect( learnMoreLink ).toHaveAttribute( 'target', '_blank' );
	} );

	it.each( [
		[ 'null', null ],
		[ 'undefined', undefined ],
	] )(
		'should have no tooltip when the days of traffic are %s',
		( _label, referenceDays ) => {
			expect(
				getTypicalTrafficLegendItem( { referenceDays } )
			).not.toHaveProperty( 'info' );
		}
	);
} );

/**
 * Builds the daily traffic with one row for each count, from `2025-01-10` on.
 *
 * @since n.e.x.t
 *
 * @param {Array.<number>} visits The visits on each day, oldest first.
 * @return {Array.<Object>} The daily traffic.
 */
function createDailyTraffic( visits: number[] ): BenchmarkingDailyTrafficRow[] {
	return visits.map( ( value, index ) => ( {
		date: getDateString( new Date( 2025, 0, 10 + index ) ),
		visits: value,
		expectedMin: null,
		expectedMax: null,
	} ) );
}

describe( 'getPlaceholderDailyTraffic', () => {
	it( "should give each day of a 28 day range the design's visits for that day", () => {
		const dailyTraffic = getPlaceholderDailyTraffic(
			'2025-01-09',
			'2025-02-05'
		);

		expect( dailyTraffic ).toHaveLength( 28 );
		expect( dailyTraffic[ 0 ] ).toEqual( {
			date: '2025-01-09',
			visits: 39,
			expectedMin: null,
			expectedMax: null,
		} );
		// The dip under the first post.
		expect( dailyTraffic[ 3 ] ).toEqual( {
			date: '2025-01-12',
			visits: 25,
			expectedMin: null,
			expectedMax: null,
		} );
		expect( dailyTraffic[ 27 ] ).toEqual( {
			date: '2025-02-05',
			visits: 152,
			expectedMin: null,
			expectedMax: null,
		} );
	} );

	it( "should stretch the design's visits over a shorter range, keeping its first and last days", () => {
		const dailyTraffic = getPlaceholderDailyTraffic(
			'2025-01-30',
			'2025-02-05'
		);

		expect( dailyTraffic.map( ( { date } ) => date ) ).toEqual( [
			'2025-01-30',
			'2025-01-31',
			'2025-02-01',
			'2025-02-02',
			'2025-02-03',
			'2025-02-04',
			'2025-02-05',
		] );
		// The second day sits halfway between the design's fifth and sixth
		// days, 42 and 41, so it takes 41.5, rounded to 42.
		expect( dailyTraffic.map( ( { visits } ) => visits ) ).toEqual( [
			39, 42, 38, 71, 76, 128, 152,
		] );
	} );

	it( 'should give one row for each day of a 90 day range', () => {
		// The range takes in the March start of daylight saving time, in the
		// time zones that have it.
		const dailyTraffic = getPlaceholderDailyTraffic(
			'2025-01-01',
			'2025-03-31'
		);
		const dates = dailyTraffic.map( ( { date } ) => date );

		expect( dailyTraffic ).toHaveLength( 90 );
		expect( new Set( dates ).size ).toBe( 90 );
		expect( dailyTraffic[ 0 ] ).toEqual( {
			date: '2025-01-01',
			visits: 39,
			expectedMin: null,
			expectedMax: null,
		} );
		expect( dailyTraffic[ 89 ] ).toEqual( {
			date: '2025-03-31',
			visits: 152,
			expectedMin: null,
			expectedMax: null,
		} );
	} );

	it( "should give a range of one day the design's last visits", () => {
		expect(
			getPlaceholderDailyTraffic( '2025-02-05', '2025-02-05' )
		).toEqual( [
			{
				date: '2025-02-05',
				visits: 152,
				expectedMin: null,
				expectedMax: null,
			},
		] );
	} );

	it( 'should give no day a typical range', () => {
		expect(
			getPlaceholderDailyTraffic( '2025-01-09', '2025-02-05' ).filter(
				( { expectedMin, expectedMax } ) =>
					expectedMin !== null || expectedMax !== null
			)
		).toEqual( [] );
	} );
} );

describe( 'getPlaceholderPublishedPosts', () => {
	it( 'should place three posts 12%, 48% and 75% of the way through the days of the daily traffic', () => {
		// 28 days, from `2025-01-10` to `2025-02-06`, put the posts on the
		// days at the positions 3, 13 and 20.
		const dailyTraffic = createDailyTraffic( Array( 28 ).fill( 10 ) );

		expect( getPlaceholderPublishedPosts( dailyTraffic ) ).toEqual( [
			{ date: '2025-01-13', title: 'Ice cream is good for your health' },
			{ date: '2025-01-23', title: 'Eat ice cream every day' },
			{ date: '2025-01-30', title: 'The best ice cream shops guide' },
		] );
	} );

	it( 'should give no posts without daily traffic', () => {
		expect( getPlaceholderPublishedPosts() ).toEqual( [] );
		expect( getPlaceholderPublishedPosts( [] ) ).toEqual( [] );
	} );
} );
