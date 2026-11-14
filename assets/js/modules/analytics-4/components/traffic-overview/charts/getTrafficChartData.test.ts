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
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { DAY_IN_SECONDS } from '@/js/util';
import { getTrafficChartData } from './getTrafficChartData';
import { PUBLISHED_POST_POINT_STYLE } from './trafficChartOptions';

describe( 'getTrafficChartData', () => {
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
		const { chartData } = getTrafficChartData( {
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
		const { chartData } = getTrafficChartData( {
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
		const { ticks } = getTrafficChartData( {
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
		const { chartData, hasVisits } = getTrafficChartData( {
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
		const { chartData, hasVisits } = getTrafficChartData( {
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
		const { ticks } = getTrafficChartData( {
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( ticks ).toEqual( [
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( 'should find visits when a day is above zero', () => {
		const { hasVisits } = getTrafficChartData( {
			dailyTraffic,
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisits ).toBe( true );
	} );

	it( 'should find no visits when every day is at zero', () => {
		const { hasVisits } = getTrafficChartData( {
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
		const { chartData, hasVisits } = getTrafficChartData( {
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

	it( 'should draw the bounds of each day as two interval columns, and leave them empty on a day with null bounds', () => {
		const { chartData, hasTypicalTrafficRange } = getTrafficChartData( {
			dailyTraffic: withBounds( [
				null,
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
			[ new Date( 2025, 0, 13 ), 55, null, null, '55' ],
			[ new Date( 2025, 0, 14 ), 14, 10, 30, '14' ],
			[ new Date( 2025, 0, 15 ), 3, 5, 20, '3' ],
			[ new Date( 2025, 0, 16 ), 13, 8, 25, '13' ],
		] );
		expect( hasTypicalTrafficRange ).toBe( true );
	} );

	it( 'should draw the bounds as they are, with their decimals', () => {
		const { chartData } = getTrafficChartData( {
			dailyTraffic: withBounds( [ [ 39.6, 71.3 ] ] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData[ 1 ] ).toEqual( [
			new Date( 2025, 0, 13 ),
			55,
			39.6,
			71.3,
			'55',
		] );
	} );

	it( 'should leave the band empty on every day with null bounds, so it starts on the first day with bounds', () => {
		const { chartData } = getTrafficChartData( {
			dailyTraffic: withBounds( [ null, null, [ 1.5, 6 ], [ 7, 19.5 ] ] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		// The line plots every day, and the band only the last two.
		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 55, null, null, '55' ],
			[ new Date( 2025, 0, 14 ), 14, null, null, '14' ],
			[ new Date( 2025, 0, 15 ), 3, 1.5, 6, '3' ],
			[ new Date( 2025, 0, 16 ), 13, 7, 19.5, '13' ],
		] );
	} );

	it( "should give each day's tooltip the day's visits in the format Google Charts gives them", () => {
		const { chartData } = getTrafficChartData( {
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
		const { chartData, hasPublishedPosts } = getTrafficChartData( {
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
		const { chartData } = getTrafficChartData( {
			dailyTraffic: withBounds( [ null, [ 10, 30 ] ] ),
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

		const { days } = getTrafficChartData( {
			dailyTraffic: withBounds( [ null, [ 10, 30 ] ] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
			publishedPosts: [ post ],
		} );

		expect( days ).toEqual( [
			{ date: new Date( 2025, 0, 13 ), visits: 55, posts: [] },
			{
				date: new Date( 2025, 0, 14 ),
				visits: 14,
				typicalRange: { min: 10, max: 30 },
				posts: [ post ],
			},
			{ date: new Date( 2025, 0, 15 ), visits: 3, posts: [] },
			{ date: new Date( 2025, 0, 16 ), visits: 13, posts: [] },
		] );
	} );

	it( 'should leave out a post on a day the chart does not plot', () => {
		const { chartData, hasPublishedPosts } = getTrafficChartData( {
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
			getTrafficChartData( {
				// The flat line at zero plots `2025-01-13`, so the range and the
				// post would land on it.
				dailyTraffic: withBounds( [ [ 10, 30 ] ] ),
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
