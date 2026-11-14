/**
 * Traffic Overview chart data.
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
 * External dependencies
 */
import { groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { DAY_IN_SECONDS, getLocale, stringToDate } from '@/js/util';
import { PUBLISHED_POST_POINT_STYLE } from './trafficChartOptions';

export interface TypicalTrafficRange {
	/** The fewest visits that are typical for the day. */
	min: number;
	/** The most visits that are typical for the day. */
	max: number;
}

export interface PublishedPost {
	/** The day the post was published, as `YYYY-MM-DD`. */
	date: string;
	/** The post's title. */
	title: string;
}

export interface TrafficChartColumn {
	/** The column type: `date` for the day, `number` for the visits and the typical range, `string` for the tooltip and the point style. */
	type: 'date' | 'number' | 'string';
	/** The column heading a person sees in a day's tooltip. */
	label?: string;
	/** What Google Charts does with a column that follows the visits column: `interval` for a bound of the typical range, `tooltip` for the value a day's tooltip shows, and `style` for a day's point. */
	role?: 'interval' | 'tooltip' | 'style';
}

export type TrafficChartPoint = [ Date, number ];

/** A day and its visits, then the day's value in each role column the table has. */
export type TrafficChartRow = [ Date, number, ...( number | string | null )[] ];

export type TrafficChartTable = [ TrafficChartColumn[], ...TrafficChartRow[] ];

export interface TrafficChartDay {
	/** The day. */
	date: Date;
	/** The visits on the day. */
	visits: number;
	/** The typical range of visits for the day, when the day has one. */
	typicalRange?: TypicalTrafficRange;
	/** The posts published on the day. */
	posts: PublishedPost[];
}

export interface TrafficChartDataOptions {
	/** The visits on each day of the range, oldest first, each with the bounds of the day's typical range, or null bounds on a day without one. */
	dailyTraffic?: BenchmarkingDailyTrafficRow[];
	/** The first day of the selected range, as `YYYY-MM-DD`. */
	startDate: string;
	/** The last day of the selected range, as `YYYY-MM-DD`. */
	endDate: string;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
	/** The posts published in the selected range. */
	publishedPosts?: PublishedPost[];
}

export interface TrafficChartData {
	/** The table `GoogleChart` reads as `data`. */
	chartData: TrafficChartTable;
	/** The days the chart plots, oldest first. */
	days: TrafficChartDay[];
	/** The days the horizontal axis shows a date label under. */
	ticks: Date[];
	/** Whether a day the chart plots is above zero. */
	hasVisits: boolean;
	/** Whether a day the chart plots has a typical range. */
	hasTypicalTrafficRange: boolean;
	/** Whether a post was published on a day the chart plots. */
	hasPublishedPosts: boolean;
}

/**
 * The columns that draw the typical range behind the line.
 *
 * Google Charts adds a day's interval values to its tooltip, as in
 * "Visits: 25 [31, 52]", so the tooltip column holds the day's visits alone.
 */
const TYPICAL_TRAFFIC_RANGE_COLUMNS: TrafficChartColumn[] = [
	{ type: 'number', role: 'interval' },
	{ type: 'number', role: 'interval' },
	{ type: 'string', role: 'tooltip' },
];

/** The column that marks a day with a published post with a dot on the line. */
const PUBLISHED_POST_COLUMN: TrafficChartColumn = {
	type: 'string',
	role: 'style',
};

/**
 * Builds zero-visit points for the range's first day, second day, and last
 * day.
 *
 * The date labels skip the first day, so the second day gives the axis a label
 * near its start.
 *
 * @since 1.189.0
 * @since n.e.x.t Renamed from `getZeroVisitorPoints()`.
 *
 * @param {string} startDate The range's first day, as `YYYY-MM-DD`.
 * @param {string} endDate   The range's last day, as `YYYY-MM-DD`.
 * @return {Array<Array>} The three points, each with no visits.
 */
function getZeroVisitPoints(
	startDate: string,
	endDate: string
): TrafficChartPoint[] {
	const secondDay = stringToDate( startDate );
	secondDay.setDate( secondDay.getDate() + 1 );

	return [
		stringToDate( startDate ),
		secondDay,
		stringToDate( endDate ),
	].map( ( date ): TrafficChartPoint => [ date, 0 ] );
}

/**
 * Lists every day from the day after the range's first day through its last
 * day.
 *
 * @since 1.189.0
 *
 * @param {string} startDate The range's first day, as `YYYY-MM-DD`.
 * @param {string} endDate   The range's last day, as `YYYY-MM-DD`.
 * @return {Array<Date>} One `Date` for each of those days.
 */
function getDailyTicks( startDate: string, endDate: string ): Date[] {
	// Rounding absorbs the hour a daylight-saving change adds or removes.
	const days = Math.round(
		( stringToDate( endDate ).getTime() -
			stringToDate( startDate ).getTime() ) /
			( DAY_IN_SECONDS * 1000 )
	);

	return Array.from( { length: days }, ( _value, index ) => {
		const day = stringToDate( startDate );
		day.setDate( day.getDate() + index + 1 );

		return day;
	} );
}

/**
 * Builds the chart table from the visits on each day of the range, with the
 * typical range behind the line and a dot for each day with a published post.
 *
 * The typical range of each day comes from the bounds on its row of the daily
 * traffic. The chart draws them as they are, and calculates no bound itself.
 *
 * @since 1.189.0
 * @since n.e.x.t Added the `publishedPosts` option, changed the `report` option to `dailyTraffic`, draws the typical range of each day of `dailyTraffic` that has one, names the line's column `Visits` in place of `Users`, and returns each day's `visits` and `hasVisits` in place of `visitors` and `hasVisitors`.
 *
 * @param {Object}         options                  Options.
 * @param {Array.<Object>} [options.dailyTraffic]   Optional. The visits on each day of the range, oldest first, each with the bounds of the day's typical range, or null bounds on a day without one.
 * @param {string}         options.startDate        The range's first day, as `YYYY-MM-DD`.
 * @param {string}         options.endDate          The range's last day, as `YYYY-MM-DD`.
 * @param {boolean}        [options.gatheringData]  Optional. Whether the property is still gathering data.
 * @param {Array.<Object>} [options.publishedPosts] Optional. The posts published in the range.
 * @return {Object} The chart table, the plotted days, the days the axis shows a date label under, and what the range has.
 */
export function getTrafficChartData( {
	dailyTraffic = [],
	startDate,
	endDate,
	gatheringData = false,
	publishedPosts = [],
}: TrafficChartDataOptions ): TrafficChartData {
	const postsByDate = groupBy( publishedPosts, 'date' );

	// A property still gathering data shows no visits, so the chart draws a
	// flat line at zero whatever the daily traffic holds, with no typical range
	// to compare it with and no posts to mark on it.
	const days =
		! gatheringData && dailyTraffic.length
			? dailyTraffic.map(
					( {
						date,
						visits,
						expectedMin,
						expectedMax,
					} ): TrafficChartDay => ( {
						date: stringToDate( date ),
						visits,
						typicalRange:
							expectedMin !== null && expectedMax !== null
								? { min: expectedMin, max: expectedMax }
								: undefined,
						posts: postsByDate[ date ] ?? [],
					} )
			  )
			: getZeroVisitPoints( startDate, endDate ).map(
					( [ date, visits ] ): TrafficChartDay => ( {
						date,
						visits,
						posts: [],
					} )
			  );

	const hasTypicalTrafficRange = days.some(
		( { typicalRange } ) => !! typicalRange
	);
	const hasPublishedPosts = days.some( ( { posts } ) => posts.length > 0 );

	// The format Google Charts gives a day's visits in its tooltip.
	const visitsFormat = new Intl.NumberFormat( getLocale() );

	return {
		chartData: [
			[
				{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
				{ type: 'number', label: __( 'Visits', 'google-site-kit' ) },
				...( hasTypicalTrafficRange
					? TYPICAL_TRAFFIC_RANGE_COLUMNS
					: [] ),
				...( hasPublishedPosts ? [ PUBLISHED_POST_COLUMN ] : [] ),
			],
			...days.map(
				( { date, visits, typicalRange, posts } ): TrafficChartRow => [
					date,
					visits,
					// A day without a typical range leaves a gap in the band.
					...( hasTypicalTrafficRange
						? [
								typicalRange?.min ?? null,
								typicalRange?.max ?? null,
								visitsFormat.format( visits ),
						  ]
						: [] ),
					...( hasPublishedPosts
						? [ posts.length ? PUBLISHED_POST_POINT_STYLE : null ]
						: [] ),
				]
			),
		],
		days,
		// Google Charts hides the first day's label against the edge of the
		// chart area, so the labels start on the second day.
		ticks: gatheringData
			? getDailyTicks( startDate, endDate )
			: days.slice( 1 ).map( ( { date } ) => date ),
		// While the property is gathering data, every day the chart plots is
		// at zero.
		hasVisits: days.some( ( { visits } ) => visits > 0 ),
		hasTypicalTrafficRange,
		hasPublishedPosts,
	};
}
