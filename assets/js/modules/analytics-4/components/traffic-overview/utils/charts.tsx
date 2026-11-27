/**
 * Traffic Overview chart utilities.
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
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DocumentationLink from '@/js/components/DocumentationLink';
import type { ChartLegendItem } from '@/js/modules/analytics-4/components/traffic-overview/charts/ChartLegend';
import type { TypicalChartLegendItem } from '@/js/modules/analytics-4/components/traffic-overview/charts/TypicalChartLegend';
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';
import {
	BenchmarkingContentMarker,
	BenchmarkingDailyTrafficRow,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import parseDimensionStringToDate from '@/js/modules/analytics-4/utils/parseDimensionStringToDate';
import {
	DAY_IN_SECONDS,
	getDateString,
	getFullURL,
	getLocale,
	stringToDate,
} from '@/js/util';
import { hasTypicalTrafficRange as hasTypicalTrafficRangeOnEveryDay } from './typical-traffic';

/** The hex value of `$c-neutral-n-500`, the Sass token for an axis label. */
const AXIS_LABEL_COLOR = '#6c726e';

/** The hex value of `$c-violet-v-600`, the Sass token for the chart's line. */
export const TRAFFIC_CHART_LINE_COLOR = '#462083';

/**
 * The hex value of `$c-violet-v-50`, the Sass token for the typical traffic
 * range. The widget's stylesheet finds the band in the chart by this fill.
 */
export const TYPICAL_TRAFFIC_RANGE_COLOR = '#e3d1ff';

/** The hex value of `$c-violet-v-200`, the Sass token for a published post's dot. */
export const PUBLISHED_POST_COLOR = '#a983e6';

/**
 * The style of the point that marks a day with a published post: a dot on the
 * line with a 3px white edge, so the line doesn't run into it.
 *
 * The line draws no points of its own, so `visible` shows this one. Google
 * Charts reads `size` as the radius, to the middle of the edge, so the dot's
 * fill is 16px across.
 */
export const PUBLISHED_POST_POINT_STYLE = `point { visible: true; size: 9.5; fill-color: ${ PUBLISHED_POST_COLOR }; stroke-color: #ffffff; stroke-width: 3; }`;

/** The Google Charts options for the traffic chart. */
export const TRAFFIC_CHART_OPTIONS = {
	animation: {
		startup: true,
	},
	curveType: 'function',
	height: 256,
	width: '100%',
	colors: [ TRAFFIC_CHART_LINE_COLOR ],
	chartArea: {
		left: 16,
		right: 40,
		height: 224,
		top: 8,
	},
	legend: {
		position: 'none',
	},
	hAxis: {
		// The hex value of `$c-neutral-n-200`, the Sass token for the gray line
		// along the right edge of the chart area.
		baselineColor: '#b8bdb9',
		format: 'MMM d',
		// The chart shows no vertical gridlines. Setting the gridline count to
		// `0` also moves the date labels, so the lines are transparent instead.
		gridlines: {
			color: 'transparent',
		},
		textPosition: 'out',
		textStyle: {
			fontName: 'Google Sans Text',
		},
	},
	hAxes: {
		0: {
			textStyle: {
				color: AXIS_LABEL_COLOR,
			},
		},
	},
	vAxis: {
		// The hex value of `$c-neutral-n-400`, the Sass token for the baseline.
		baselineColor: '#7b807d',
		gridlines: {
			// The hex value of `$c-neutral-n-50`, the Sass token for a gridline.
			color: '#ebeef0',
		},
		lineWidth: 3,
		minorGridlines: {
			count: 0,
		},
		minValue: 0,
		textStyle: {
			fontName: 'Google Sans Text',
		},
		textPosition: 'out',
		viewWindow: {
			min: 0,
		},
	},
	// The line uses the second value axis, so `vAxes[ 1 ]` sets the color of
	// its labels.
	vAxes: {
		1: {
			textStyle: {
				color: AXIS_LABEL_COLOR,
			},
		},
	},
	series: {
		0: {
			color: TRAFFIC_CHART_LINE_COLOR,
			lineWidth: 3,
			// The visitor counts are on the right, because Google Charts renders
			// the second value axis there.
			targetAxisIndex: 1,
		},
	},
	focusTarget: 'category',
	crosshair: {
		color: TRAFFIC_CHART_LINE_COLOR,
		opacity: 0.1,
		orientation: 'vertical',
		trigger: 'both',
	},
};

/** The Google Charts options for the Typical Traffic Overview chart. */
export const TYPICAL_TRAFFIC_CHART_OPTIONS = {
	animation: {
		startup: true,
	},
	curveType: 'function',
	height: 256,
	width: '100%',
	colors: [ TRAFFIC_CHART_LINE_COLOR ],
	chartArea: {
		left: 16,
		right: 40,
		height: 224,
		top: 8,
	},
	legend: {
		position: 'none',
	},
	hAxis: {
		// The hex value of `$c-neutral-n-200`, the Sass token for the gray line
		// along the right edge of the chart area.
		baselineColor: '#b8bdb9',
		format: 'MMM d',
		// The chart shows no vertical gridlines. Setting the gridline count to
		// `0` also moves the date labels, so the lines are transparent instead.
		gridlines: {
			color: 'transparent',
		},
		textPosition: 'out',
		textStyle: {
			fontName: 'Google Sans Text',
		},
	},
	hAxes: {
		0: {
			textStyle: {
				color: AXIS_LABEL_COLOR,
			},
		},
	},
	vAxis: {
		// The hex value of `$c-neutral-n-400`, the Sass token for the baseline.
		baselineColor: '#7b807d',
		gridlines: {
			// The hex value of `$c-neutral-n-50`, the Sass token for a gridline.
			color: '#ebeef0',
		},
		minorGridlines: {
			count: 0,
		},
		minValue: 0,
		textStyle: {
			fontName: 'Google Sans Text',
		},
		textPosition: 'out',
		viewWindow: {
			min: 0,
		},
	},
	// The line uses the second value axis, so `vAxes[ 1 ]` sets the color of
	// its labels.
	vAxes: {
		1: {
			textStyle: {
				color: AXIS_LABEL_COLOR,
			},
		},
	},
	series: {
		0: {
			color: TRAFFIC_CHART_LINE_COLOR,
			lineWidth: 3,
			// The visit counts are on the right, because Google Charts renders
			// the second value axis there.
			targetAxisIndex: 1,
		},
	},
	// The typical traffic range is a pair of interval columns, which Google
	// Charts fills as an area behind the line, with no edge lines. The legend's
	// swatch for the range has the same opacity.
	intervals: {
		style: 'area',
		color: TYPICAL_TRAFFIC_RANGE_COLOR,
		fillOpacity: 0.5,
		lineWidth: 0,
	},
	focusTarget: 'category',
	crosshair: {
		color: TRAFFIC_CHART_LINE_COLOR,
		opacity: 0.1,
		orientation: 'vertical',
		trigger: 'both',
	},
};

/**
 * A day that `GoogleChart` marks with a dashed line, and the tooltip on the
 * line's icon.
 *
 * @since 1.192.0
 */
export interface DateMarker {
	/** The day the marker sits on, as `YYYY-MM-DD`. */
	date: string;
	/** The text of the tooltip on the marker's icon. */
	text: string;
}

export type TrafficChartPoint = [ Date, number ];

export interface TrafficChartColumn {
	/** The column type: `date` for the day, `number` for the visitors. */
	type: 'date' | 'number';
	/** The column heading a person sees in a day's tooltip. */
	label: string;
}

export type TrafficChartTable = [
	TrafficChartColumn[],
	...TrafficChartPoint[]
];

export interface TrafficChartDataOptions {
	/** The daily-visitors report, `undefined` until the request has finished. */
	report?: Report;
	/** The first day of the selected range, as `YYYY-MM-DD`. */
	startDate: string;
	/** The last day of the selected range, as `YYYY-MM-DD`. */
	endDate: string;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
}

export interface TrafficChartData {
	/** The table `GoogleChart` reads as `data`. */
	chartData: TrafficChartTable;
	/** The days the horizontal axis shows a date label under. */
	ticks: Date[];
	/** Whether the range's total is above zero. */
	hasVisitors: boolean;
}

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
	/** The post's URL. The post's tooltip on the chart links to the Site Kit dashboard for it. */
	url?: string;
}

export interface TypicalTrafficChartColumn {
	/** The column type: `date` for the day, `number` for the visits and the typical range, `string` for the tooltip and the point style. */
	type: 'date' | 'number' | 'string';
	/** The column heading a person sees in a day's tooltip. */
	label?: string;
	/** What Google Charts does with a column that follows the visits column: `interval` for a bound of the typical range, `tooltip` for the value a day's tooltip shows, and `style` for a day's point. */
	role?: 'interval' | 'tooltip' | 'style';
}

/** A day and its visits, then the day's value in each role column the table has. */
export type TypicalTrafficChartRow = [
	Date,
	number,
	...( number | string | null )[]
];

export type TypicalTrafficChartTable = [
	TypicalTrafficChartColumn[],
	...TypicalTrafficChartRow[]
];

export interface TypicalTrafficChartDay {
	/** The day. */
	date: Date;
	/** The visits on the day. */
	visits: number;
	/** The typical range of visits for the day, when every day the chart plots has one. */
	typicalRange?: TypicalTrafficRange;
	/** The posts published on the day. */
	posts: PublishedPost[];
}

export interface TypicalTrafficChartDataOptions {
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

export interface TypicalTrafficChartData {
	/** The table `GoogleChart` reads as `data`. */
	chartData: TypicalTrafficChartTable;
	/** The days the chart plots, oldest first. */
	days: TypicalTrafficChartDay[];
	/** The days the horizontal axis shows a date label under. */
	ticks: Date[];
	/** Whether a day the chart plots is above zero. */
	hasVisits: boolean;
	/** Whether every day the chart plots has a typical range, so the chart draws the band. */
	hasTypicalTrafficRange: boolean;
	/** Whether a post was published on a day the chart plots. */
	hasPublishedPosts: boolean;
}

interface TypicalTrafficRangeHistory {
	/** The number of days of traffic the band of the range's last day is fitted on. */
	referenceDays?: number | null;
	/** Whether the site's history reaches the same time last year. */
	lastYearAvailable?: boolean;
}

/**
 * The columns that draw the typical range behind the line.
 *
 * Google Charts adds a day's interval values to its tooltip, as in
 * "Visits: 25 [31, 52]", so the tooltip column holds the day's visits alone.
 */
const TYPICAL_TRAFFIC_RANGE_COLUMNS: TypicalTrafficChartColumn[] = [
	{ type: 'number', role: 'interval' },
	{ type: 'number', role: 'interval' },
	{ type: 'string', role: 'tooltip' },
];

/** The column that marks a day with a published post with a dot on the line. */
const PUBLISHED_POST_COLUMN: TypicalTrafficChartColumn = {
	type: 'string',
	role: 'style',
};

/**
 * The visits the design plots for each of its 28 days, oldest first. They
 * climb from about 40 a day to about 150, with a dip under the first post.
 */
const PLACEHOLDER_DAILY_VISITS = [
	39, 33, 66, 25, 42, 41, 72, 39, 44, 38, 31, 57, 36, 55, 87, 66, 73, 61, 76,
	84, 70, 112, 134, 121, 145, 71, 141, 152,
];

/**
 * The placeholder posts: how far through the plotted days each one sits, as
 * in the design, and its title, which names the landing page of a placeholder
 * key factor card.
 */
const PLACEHOLDER_POSTS = [
	{ position: 0.12, title: 'Ice cream is good for your health' },
	{ position: 0.48, title: 'Eat ice cream every day' },
	{ position: 0.75, title: 'The best ice cream shops guide' },
];

/**
 * Builds zero points for the range's first day, second day, and last day.
 *
 * The date labels skip the first day, so the second day gives the axis a label
 * near its start.
 *
 * @since 1.189.0
 *
 * @param {string} startDate The range's first day, as `YYYY-MM-DD`.
 * @param {string} endDate   The range's last day, as `YYYY-MM-DD`.
 * @return {Array<Array>} The three points, each at zero.
 */
function getZeroPoints(
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
 * Turns the report's rows into the chart's points.
 *
 * @since 1.189.0
 *
 * @param {Array<Object>} rows The daily-visitors report rows.
 * @return {Array<Array>} One `[ day, visitors ]` point for each row that has a day.
 */
function getReportPoints( rows: ReportRow[] ): TrafficChartPoint[] {
	return rows.reduce< TrafficChartPoint[] >( ( points, row ) => {
		const date = parseDimensionStringToDate(
			row.dimensionValues?.[ 0 ]?.value ?? ''
		);

		if ( date instanceof Date ) {
			points.push( [
				date,
				parseInt( row.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0,
			] );
		}

		return points;
	}, [] );
}

/**
 * Builds the chart table from the daily-visitors report.
 *
 * @since 1.189.0
 *
 * @param {Object}  options                 Options.
 * @param {Object}  [options.report]        Optional. The daily-visitors report.
 * @param {string}  options.startDate       The range's first day, as `YYYY-MM-DD`.
 * @param {string}  options.endDate         The range's last day, as `YYYY-MM-DD`.
 * @param {boolean} [options.gatheringData] Optional. Whether the property is still gathering data.
 * @return {Object} The chart table, the days the axis shows a date label under, and whether the range has visitors.
 */
export function getTrafficChartData( {
	report,
	startDate,
	endDate,
	gatheringData = false,
}: TrafficChartDataOptions ): TrafficChartData {
	// A property still gathering data shows no visitors, so the chart draws a
	// flat line at zero whatever the report holds.
	const points =
		! gatheringData && report?.rows?.length
			? getReportPoints( report.rows )
			: getZeroPoints( startDate, endDate );

	const totalUsers = parseInt(
		report?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value ?? '',
		10
	);

	return {
		chartData: [
			[
				{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
				{ type: 'number', label: __( 'Users', 'google-site-kit' ) },
			],
			...points,
		],
		// Google Charts hides the first day's label against the edge of the
		// chart area, so the labels start on the second day.
		ticks: gatheringData
			? getDailyTicks( startDate, endDate )
			: points.slice( 1 ).map( ( [ date ] ) => date ),
		hasVisitors: ! gatheringData && totalUsers > 0,
	};
}

/**
 * Builds the chart table from the visits on each day of the range, with the
 * typical range behind the line and a dot for each day with a published post.
 *
 * The typical range of each day comes from the bounds on its row of the daily
 * traffic. The chart draws them as they are, and calculates no bound itself.
 * The band covers the whole range or none of it, so the chart draws it only
 * when every day has bounds.
 *
 * @since n.e.x.t
 *
 * @param {Object}         options                  Options.
 * @param {Array.<Object>} [options.dailyTraffic]   Optional. The visits on each day of the range, oldest first, each with the bounds of the day's typical range, or null bounds on a day without one.
 * @param {string}         options.startDate        The range's first day, as `YYYY-MM-DD`.
 * @param {string}         options.endDate          The range's last day, as `YYYY-MM-DD`.
 * @param {boolean}        [options.gatheringData]  Optional. Whether the property is still gathering data.
 * @param {Array.<Object>} [options.publishedPosts] Optional. The posts published in the range.
 * @return {Object} The chart table, the plotted days, the days the axis shows a date label under, and what the range has.
 */
export function getTypicalTrafficChartData( {
	dailyTraffic = [],
	startDate,
	endDate,
	gatheringData = false,
	publishedPosts = [],
}: TypicalTrafficChartDataOptions ): TypicalTrafficChartData {
	const postsByDate = groupBy( publishedPosts, 'date' );

	// A property still gathering data shows no visits, so the chart draws a
	// flat line at zero whatever the daily traffic holds, with no typical range
	// to compare it with and no posts to mark on it.
	const plotsDailyTraffic = ! gatheringData && dailyTraffic.length > 0;

	// The band covers the whole range or none of it, so the chart draws it only
	// when every day has a typical range.
	const hasTypicalTrafficRange =
		plotsDailyTraffic && hasTypicalTrafficRangeOnEveryDay( dailyTraffic );

	const days = plotsDailyTraffic
		? dailyTraffic.map(
				( {
					date,
					visits,
					expectedMin,
					expectedMax,
				} ): TypicalTrafficChartDay => ( {
					date: stringToDate( date ),
					visits,
					typicalRange:
						hasTypicalTrafficRange &&
						expectedMin !== null &&
						expectedMax !== null
							? { min: expectedMin, max: expectedMax }
							: undefined,
					posts: postsByDate[ date ] ?? [],
				} )
		  )
		: getZeroPoints( startDate, endDate ).map(
				( [ date, visits ] ): TypicalTrafficChartDay => ( {
					date,
					visits,
					posts: [],
				} )
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
				( {
					date,
					visits,
					typicalRange,
					posts,
				} ): TypicalTrafficChartRow => [
					date,
					visits,
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

/**
 * Lists the posts of the benchmarking response's content markers, as the
 * traffic chart marks them.
 *
 * Analytics reports each post by its path, so each post's URL is its path on
 * the site.
 *
 * @since n.e.x.t
 *
 * @param {Array}  contentMarkers The content markers of the benchmarking response, oldest first.
 * @param {string} siteURL        The site's URL.
 * @return {Array} One post for each post of each marker, in the markers' order, each with its marker's `date`.
 */
export function getPublishedPosts(
	contentMarkers: BenchmarkingContentMarker[] = [],
	siteURL: string
): PublishedPost[] {
	return contentMarkers.flatMap( ( { date, posts } ) =>
		posts.map( ( { title, url } ) => ( {
			date,
			title,
			url: getFullURL( siteURL, url ),
		} ) )
	);
}

/**
 * Gets the day the Analytics property was created, when a chart plots that day.
 *
 * @since 1.192.0
 *
 * @param {(string|undefined)} propertyCreateDate The day the Analytics property was created, as `YYYY-MM-DD`, or `undefined` when it is not known.
 * @param {string}             firstDate          The first day the chart plots, as `YYYY-MM-DD`.
 * @param {string}             lastDate           The last day the chart plots, as `YYYY-MM-DD`.
 * @return {(string|undefined)} `propertyCreateDate` when it is on or between `firstDate` and `lastDate`, or `undefined` otherwise.
 */
export function getPropertyCreatedMarkerDate(
	propertyCreateDate: string | undefined,
	firstDate: string,
	lastDate: string
): string | undefined {
	return propertyCreateDate &&
		propertyCreateDate >= firstDate &&
		propertyCreateDate <= lastDate
		? propertyCreateDate
		: undefined;
}

/**
 * Gets the date marker for the day the Analytics property was created.
 *
 * @since 1.192.0
 *
 * @param {string} [markerDate] Optional. The day the property was created, as `YYYY-MM-DD`, when the chart plots that day.
 * @return {Array.<Object>|undefined} The marker `GoogleChart` draws, or `undefined` when there is no day to mark.
 */
export function getPropertyCreatedDateMarkers(
	markerDate?: string
): DateMarker[] | undefined {
	if ( ! markerDate ) {
		return undefined;
	}

	return [
		{
			date: markerDate,
			text: __( 'Google Analytics property created', 'google-site-kit' ),
		},
	];
}

/**
 * Gets the legend item for the chart's line of daily counts, with a label
 * such as "Last 28 days traffic".
 *
 * @since 1.192.0
 *
 * @param {number} daysInSelectedRange The number of days in the selected date range, which the label names and which picks between its singular and plural forms.
 * @return {Object} The legend item's label, and the color of the line.
 */
export function getTrafficLegendItem(
	daysInSelectedRange: number
): ChartLegendItem {
	return {
		label: sprintf(
			/* translators: %d: the number of days in the selected date range, such as "28" */
			_n(
				'Last %d day traffic',
				'Last %d days traffic',
				daysInSelectedRange,
				'google-site-kit'
			),
			daysInSelectedRange
		),
		color: TRAFFIC_CHART_LINE_COLOR,
	};
}

/**
 * Gets the text of the band's tooltip: what the typical range is, and how
 * much of the site's traffic it is based on.
 *
 * @since n.e.x.t
 *
 * @param {number}  weeks                     The whole weeks of traffic the band is fitted on.
 * @param {Object}  options                   The rest of the band's history.
 * @param {boolean} options.lastYearAvailable Whether the site's history reaches the same time last year.
 * @return {string} The text, with `<a>` around the words of the link.
 */
function getTypicalTrafficRangeInfo(
	weeks: number,
	{
		lastYearAvailable,
	}: Pick< TypicalTrafficRangeHistory, 'lastYearAvailable' >
): string {
	if ( lastYearAvailable ) {
		return sprintf(
			/* translators: %d: the number of whole weeks of the site's traffic the typical range is estimated from, such as "52" */
			_n(
				'Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on %d week of your traffic, including the same time last year. <a>Learn more</a>',
				'Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on %d weeks of your traffic, including the same time last year. <a>Learn more</a>',
				weeks,
				'google-site-kit'
			),
			weeks
		);
	}

	return sprintf(
		/* translators: %d: the number of whole weeks of the site's traffic the typical range is estimated from, such as "12" */
		_n(
			'Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on %d week of your traffic. <a>Learn more</a>',
			'Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on %d weeks of your traffic. <a>Learn more</a>',
			weeks,
			'google-site-kit'
		),
		weeks
	);
}

/**
 * Gets the legend item for the chart's band, the typical range of visits on
 * each day, with a tooltip that says how much of the site's traffic it is
 * based on.
 *
 * The tooltip names the history in whole weeks, rounded down, so it never
 * claims more history than the band read. It mentions last year only once the
 * site's history reaches the same time last year.
 *
 * @since n.e.x.t
 *
 * @param {Object}      history                     The history the band is fitted on.
 * @param {number|null} [history.referenceDays]     Optional. The number of days of traffic the band of the range's last day is fitted on. Without it, the item has no tooltip.
 * @param {boolean}     [history.lastYearAvailable] Optional. Whether the site's history reaches the same time last year. Default is `false`.
 * @return {Object} The legend item.
 */
export function getTypicalTrafficLegendItem( {
	referenceDays,
	lastYearAvailable = false,
}: TypicalTrafficRangeHistory ): TypicalChartLegendItem {
	const item: TypicalChartLegendItem = {
		label: __( 'Typical traffic range', 'google-site-kit' ),
		color: TYPICAL_TRAFFIC_RANGE_COLOR,
		swatch: 'area',
		isBeta: true,
	};

	if ( ! referenceDays ) {
		return item;
	}

	return {
		...item,
		info: createInterpolateElement(
			getTypicalTrafficRangeInfo( Math.floor( referenceDays / 7 ), {
				lastYearAvailable,
			} ),
			{
				a: <DocumentationLink slug="typical-traffic-range" />,
			}
		),
	};
}

/**
 * Gets the visits the design plots, for the stories and tests of the Typical
 * Traffic Overview chart.
 *
 * The design's 28 days of visits stretch or shrink to cover the range, so the
 * line keeps the design's shape over a range of any length. No day has a
 * typical range.
 *
 * @since n.e.x.t
 *
 * @param {string} startDate The range's first day, as `YYYY-MM-DD`.
 * @param {string} endDate   The range's last day, as `YYYY-MM-DD`.
 * @return {Array.<Object>} One row for each day of the range, oldest first, each with null bounds.
 */
export function getPlaceholderDailyTraffic(
	startDate: string,
	endDate: string
): BenchmarkingDailyTrafficRow[] {
	const dates: string[] = [];

	// The date walks a day at a time, like the dates of the decoded response,
	// so a daylight-saving change inside the range skips no day.
	for (
		const date = stringToDate( startDate );
		getDateString( date ) <= endDate;
		date.setDate( date.getDate() + 1 )
	) {
		dates.push( getDateString( date ) );
	}

	const lastPosition = PLACEHOLDER_DAILY_VISITS.length - 1;

	return dates.map( ( date, index ) => {
		// How far through the design's days the day sits. A day between two of
		// them takes a value on the straight line between theirs.
		const position =
			dates.length > 1
				? ( index * lastPosition ) / ( dates.length - 1 )
				: lastPosition;
		const before = PLACEHOLDER_DAILY_VISITS[ Math.floor( position ) ];
		const after = PLACEHOLDER_DAILY_VISITS[ Math.ceil( position ) ];

		return {
			date,
			visits: Math.round(
				before +
					( position - Math.floor( position ) ) * ( after - before )
			),
			expectedMin: null,
			expectedMax: null,
		};
	} );
}

/**
 * Gets the posts the design marks, for the stories and tests of the Typical
 * Traffic Overview chart.
 *
 * @since n.e.x.t
 *
 * @param {Array.<Object>} [dailyTraffic] Optional. The visits on each day, oldest first.
 * @return {Array.<Object>} Three posts on days of the daily traffic, or none when it has no days.
 */
export function getPlaceholderPublishedPosts(
	dailyTraffic: BenchmarkingDailyTrafficRow[] = []
): PublishedPost[] {
	if ( ! dailyTraffic.length ) {
		return [];
	}

	return PLACEHOLDER_POSTS.map( ( { position, title } ) => ( {
		date: dailyTraffic[
			Math.round( position * ( dailyTraffic.length - 1 ) )
		].date,
		title,
	} ) );
}
