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
import {
	DAY_IN_SECONDS,
	getDateString,
	getLocale,
	stringToDate,
} from '@/js/util';
import { PUBLISHED_POST_POINT_STYLE } from './trafficChartOptions';

export interface TypicalTrafficRangeDay {
	/** The day, as `YYYY-MM-DD`. */
	date: string;
	/** The fewest visitors that are typical for the day. */
	min: number;
	/** The most visitors that are typical for the day. */
	max: number;
}

export interface PublishedPost {
	/** The day the post was published, as `YYYY-MM-DD`. */
	date: string;
	/** The post's title. */
	title: string;
}

export interface TrafficChartColumn {
	/** The column type: `date` for the day, `number` for the visitors and the typical range, `string` for the tooltip and the point style. */
	type: 'date' | 'number' | 'string';
	/** The column heading a person sees in a day's tooltip. */
	label?: string;
	/** What Google Charts does with a column that follows the visitors column: `interval` for a bound of the typical range, `tooltip` for the value a day's tooltip shows, and `style` for a day's point. */
	role?: 'interval' | 'tooltip' | 'style';
}

export type TrafficChartPoint = [ Date, number ];

/** A day and its visitors, then the day's value in each role column the table has. */
export type TrafficChartRow = [ Date, number, ...( number | string | null )[] ];

export type TrafficChartTable = [ TrafficChartColumn[], ...TrafficChartRow[] ];

export interface TrafficChartDay {
	/** The day. */
	date: Date;
	/** The visitors on the day. */
	visitors: number;
	/** The typical range of visitors for the day, when the day has one. */
	typicalRange?: TypicalTrafficRangeDay;
	/** The posts published on the day. */
	posts: PublishedPost[];
}

export interface TrafficChartDataOptions {
	/** The visits on each day of the range, oldest first. */
	dailyTraffic?: BenchmarkingDailyTrafficRow[];
	/** The first day of the selected range, as `YYYY-MM-DD`. */
	startDate: string;
	/** The last day of the selected range, as `YYYY-MM-DD`. */
	endDate: string;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
	/** The typical range of visitors for each day that has one. */
	typicalTrafficRange?: TypicalTrafficRangeDay[];
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
	hasVisitors: boolean;
	/** Whether a day the chart plots has a typical range. */
	hasTypicalTrafficRange: boolean;
	/** Whether a post was published on a day the chart plots. */
	hasPublishedPosts: boolean;
}

/**
 * The columns that draw the typical range behind the line.
 *
 * Google Charts adds a day's interval values to its tooltip, as in
 * "Users: 25 [31, 52]", so the tooltip column holds the day's visitors alone.
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
 * Builds zero-visitor points for the range's first day, second day, and last
 * day.
 *
 * The date labels skip the first day, so the second day gives the axis a label
 * near its start.
 *
 * @since 1.189.0
 *
 * @param {string} startDate The range's first day, as `YYYY-MM-DD`.
 * @param {string} endDate   The range's last day, as `YYYY-MM-DD`.
 * @return {Array<Array>} The three points, each with no visitors.
 */
function getZeroVisitorPoints(
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
 * @since 1.189.0
 * @since n.e.x.t Added the `typicalTrafficRange` and `publishedPosts` options, and changed the `report` option to `dailyTraffic`.
 *
 * @param {Object}         options                       Options.
 * @param {Array.<Object>} [options.dailyTraffic]        Optional. The visits on each day of the range, oldest first.
 * @param {string}         options.startDate             The range's first day, as `YYYY-MM-DD`.
 * @param {string}         options.endDate               The range's last day, as `YYYY-MM-DD`.
 * @param {boolean}        [options.gatheringData]       Optional. Whether the property is still gathering data.
 * @param {Array.<Object>} [options.typicalTrafficRange] Optional. The typical range of visitors for each day that has one.
 * @param {Array.<Object>} [options.publishedPosts]      Optional. The posts published in the range.
 * @return {Object} The chart table, the plotted days, the days the axis shows a date label under, and what the range has.
 */
export function getTrafficChartData( {
	dailyTraffic = [],
	startDate,
	endDate,
	gatheringData = false,
	typicalTrafficRange = [],
	publishedPosts = [],
}: TrafficChartDataOptions ): TrafficChartData {
	// A property still gathering data shows no visits, so the chart draws a
	// flat line at zero whatever the daily traffic holds, with no typical range
	// to compare it with and no posts to mark on it.
	const points =
		! gatheringData && dailyTraffic.length
			? dailyTraffic.map(
					( { date, visits } ): TrafficChartPoint => [
						stringToDate( date ),
						visits,
					]
			  )
			: getZeroVisitorPoints( startDate, endDate );

	const rangesByDate = new Map< string, TypicalTrafficRangeDay >(
		gatheringData
			? []
			: typicalTrafficRange.map( ( range ) => [ range.date, range ] )
	);
	const postsByDate = groupBy( gatheringData ? [] : publishedPosts, 'date' );

	const days = points.map( ( [ date, visitors ] ): TrafficChartDay => {
		const dateString = getDateString( date );

		return {
			date,
			visitors,
			typicalRange: rangesByDate.get( dateString ),
			posts: postsByDate[ dateString ] ?? [],
		};
	} );

	const hasTypicalTrafficRange = days.some(
		( { typicalRange } ) => !! typicalRange
	);
	const hasPublishedPosts = days.some( ( { posts } ) => posts.length > 0 );

	// The format Google Charts gives a day's visitors in its tooltip.
	const visitorsFormat = new Intl.NumberFormat( getLocale() );

	return {
		chartData: [
			[
				{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
				{ type: 'number', label: __( 'Users', 'google-site-kit' ) },
				...( hasTypicalTrafficRange
					? TYPICAL_TRAFFIC_RANGE_COLUMNS
					: [] ),
				...( hasPublishedPosts ? [ PUBLISHED_POST_COLUMN ] : [] ),
			],
			...days.map(
				( {
					date,
					visitors,
					typicalRange,
					posts,
				} ): TrafficChartRow => [
					date,
					visitors,
					// A day without a typical range leaves a gap in the band.
					...( hasTypicalTrafficRange
						? [
								typicalRange?.min ?? null,
								typicalRange?.max ?? null,
								visitorsFormat.format( visitors ),
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
			: points.slice( 1 ).map( ( [ date ] ) => date ),
		// While the property is gathering data, every day the chart plots is
		// at zero.
		hasVisitors: days.some( ( { visitors } ) => visitors > 0 ),
		hasTypicalTrafficRange,
		hasPublishedPosts,
	};
}
