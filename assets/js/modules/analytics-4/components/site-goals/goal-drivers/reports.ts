/**
 * Site Goals Goal Drivers shared report options builders and row mappers.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	ReportOptions,
	ReportRow,
} from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import { GOAL_DRIVER_IDS } from './constants';
import { GoalDriverID, GoalDriverRow } from './types';
import { getDimensionFiltersForEvents, normalizePrimaryEvents } from './utils';

export interface GoalDriverReportDates {
	startDate: string;
	endDate: string;
}

export interface BuildGoalDriverReportOptionsArgs {
	dates?: GoalDriverReportDates;
	primaryEvent?: string | string[];
	breakdownFilter?: Record< string, unknown >;
	limit: number;
	context?: string;
}

export type GoalDriverReportOptionsBuilder = (
	args: BuildGoalDriverReportOptionsArgs
) => ReportOptions | undefined;

export type GoalDriverRowMapper = ( rows: ReportRow[] ) => GoalDriverRow[];

/**
 * Reads a report row's metric value as a number.
 *
 * @since n.e.x.t
 *
 * @param {Object} row   The report row.
 * @param {number} index The metric's index in `row.metricValues`. Defaults to the first metric.
 * @return {number} The parsed metric value, or `0` if missing.
 */
export function parseMetricValue( row: ReportRow, index = 0 ): number {
	return parseFloat( String( row.metricValues?.[ index ]?.value ?? 0 ) );
}

/**
 * Builds a reportID, appending a context suffix when one is given.
 *
 * The base reportID identifies the kind of report; the context identifies who's
 * asking for it (an ecommerce goal driver, a lead goal driver, a Key Metric
 * tile, …). Both the ecommerce and lead-generation goal drivers, plus their
 * equivalent Key Metric tiles, request the same shape of report through this
 * shared module, so without a context suffix their requests would all log
 * under one indistinguishable label.
 *
 * @since n.e.x.t
 *
 * @param {string} baseReportID The reportID identifying the kind of report.
 * @param {string} [context]    Identifies the caller. Omitted when not given.
 * @return {string} The reportID, with the context suffix appended when given.
 */
function withContextSuffix( baseReportID: string, context?: string ): string {
	return context ? `${ baseReportID }_${ context }` : baseReportID;
}

/**
 * Maps rows to each row's share of a total as a percentage.
 *
 * Most drivers don't fetch a total separately - the rows they're given are the
 * whole answer, so their total is summed from those same rows, and every
 * surface rendering the driver must therefore request the same row limit, or
 * a smaller limit on one surface would understate the total there and skew its
 * percentages relative to the other. `topAuthors` and `topTrafficChannels` are
 * the exception: rather than a share of the ranked, limited rows shown, their
 * percentage is a share of every event site-wide, so the caller fetches that
 * true total separately and passes it in as `explicitTotal`.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} rows            Report rows, each expected to carry an `eventCount` in `metricValues[0]`.
 * @param {Function} getLabel        Maps a row to its display label.
 * @param {number}   [explicitTotal] The total to divide by, when it isn't the sum of `rows`.
 * @return {Object[]} The rows mapped to `{ label, value }`, `value` formatted as a percentage of the total.
 */
function mapRowsToShareOfTotal(
	rows: ReportRow[],
	getLabel: ( row: ReportRow ) => string,
	explicitTotal?: number
): GoalDriverRow[] {
	const total =
		explicitTotal ??
		rows.reduce( ( sum, row ) => sum + parseMetricValue( row ), 0 );

	return rows.map( ( row ) => ( {
		label: getLabel( row ),
		value: numFmt( total > 0 ? parseMetricValue( row ) / total : 0, {
			style: 'percent',
			signDisplay: 'never',
			maximumFractionDigits: 1,
		} ),
	} ) );
}

/**
 * Builds a report options builder for a single-dimension, share-of-total driver.
 *
 * Covers `topTrafficChannels`, `visitorType`, `cities`, `countries` and
 * `deviceType`, which all request one dimension broken down by `eventCount`
 * and differ only in the dimension name and whether "(not set)" rows for
 * that dimension are excluded.
 *
 * @since n.e.x.t
 *
 * @param {string}  dimension               The Analytics 4 dimension name.
 * @param {string}  reportIDSuffix          Unique suffix for the report ID.
 * @param {Object}  [options]               Options.
 * @param {boolean} [options.excludeNotSet] Whether to exclude rows where the dimension is not set.
 * @return {Function} The report options builder.
 */
function buildSingleDimensionReportOptionsBuilder(
	dimension: string,
	reportIDSuffix: string,
	{ excludeNotSet = false }: { excludeNotSet?: boolean } = {}
): GoalDriverReportOptionsBuilder {
	return ( { dates, primaryEvent, breakdownFilter, limit, context } ) => {
		const eventNames = normalizePrimaryEvents( primaryEvent );

		if ( ! dates || ! eventNames.length ) {
			return undefined;
		}

		const eventDimensionFilters = getDimensionFiltersForEvents(
			eventNames,
			breakdownFilter
		);

		// Assigned to a variable, rather than returned directly, so the
		// `notExpression` filter field (missing from `ReportOptions`, but
		// accepted by the Analytics 4 report endpoint) isn't rejected by an
		// excess property check against the function's declared return type.
		const options = {
			...dates,
			dimensions: [ dimension ],
			dimensionFilters: excludeNotSet
				? {
						...( eventDimensionFilters || {} ),
						[ dimension ]: {
							filterType: 'emptyFilter',
							notExpression: true,
						},
				  }
				: eventDimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit,
			keepEmptyRows: false,
			reportID: withContextSuffix(
				`analytics-4_goal-driver-reports_${ reportIDSuffix }`,
				context
			),
		};

		return options;
	};
}

/**
 * Builds a share-of-total row mapper for a single-dimension driver.
 *
 * @since n.e.x.t
 *
 * @param {Object}   [options]            Options.
 * @param {Function} [options.getLabel]   Maps the row's raw (non-empty) dimension value to its display label. Defaults to the raw value.
 * @param {string}   [options.emptyLabel] Label used when the dimension value is empty. Defaults to "(not set)".
 * @return {Function} The row mapper.
 */
function makeShareOfTotalMapper( {
	getLabel = ( value: string ) => value,
	emptyLabel = __( '(not set)', 'google-site-kit' ),
}: {
	getLabel?: ( dimensionValue: string ) => string;
	emptyLabel?: string;
} = {} ): GoalDriverRowMapper {
	return ( rows ) =>
		mapRowsToShareOfTotal( rows, ( row ) => {
			const dimensionValue = row.dimensionValues?.[ 0 ]?.value || '';

			return dimensionValue ? getLabel( dimensionValue ) : emptyLabel;
		} );
}

/**
 * Builds a row mapper that divides by an explicitly given total rather than
 * the sum of the rows it's mapping.
 *
 * `topAuthors` and `topTrafficChannels` use this: their percentage is each
 * row's share of every event site-wide, not just the ranked rows shown, so the
 * caller fetches that total separately (see `buildGoalDriverTotalReportOptions`)
 * and passes the resolved count in here.
 *
 * @since n.e.x.t
 *
 * @param {number}   totalCount           The total to divide each row's `eventCount` by.
 * @param {Object}   [options]            Options.
 * @param {Function} [options.getLabel]   Maps the row's raw (non-empty) dimension value to its display label. Defaults to the raw value.
 * @param {string}   [options.emptyLabel] Label used when the dimension value is empty. Defaults to "(not set)".
 * @return {Function} The row mapper.
 */
export function makeShareOfExplicitTotalMapper(
	totalCount: number,
	{
		getLabel = ( value: string ) => value,
		emptyLabel = __( '(not set)', 'google-site-kit' ),
	}: {
		getLabel?: ( dimensionValue: string ) => string;
		emptyLabel?: string;
	} = {}
): GoalDriverRowMapper {
	return ( rows ) =>
		mapRowsToShareOfTotal(
			rows,
			( row ) => {
				const dimensionValue = row.dimensionValues?.[ 0 ]?.value || '';

				return dimensionValue ? getLabel( dimensionValue ) : emptyLabel;
			},
			totalCount
		);
}

/**
 * Builds the Analytics 4 report options for a driver's site-wide total.
 *
 * `topAuthors` and `topTrafficChannels` divide by every matching event
 * site-wide, not just the ranked rows they show, so this requests that total
 * with no dimension breakdown and no row limit - pair it with
 * `makeShareOfExplicitTotalMapper`.
 *
 * @since n.e.x.t
 *
 * @param {Object}          args                   Builder args.
 * @param {Object}          [args.dates]           The date range.
 * @param {string|string[]} [args.primaryEvent]    The primary conversion event name(s).
 * @param {Object}          [args.breakdownFilter] Optional dimension filter scoping the report to a breakdown tab.
 * @param {string}          [args.context]         Identifies the caller, appended to the reportID.
 * @param {string}          args.reportIDSuffix    Which driver's total this is (`top-authors` or `top-traffic-channels`).
 * @return {Object|undefined} The Analytics 4 `getReport` options, or `undefined` when there is no primary event.
 */
export function buildGoalDriverTotalReportOptions( {
	dates,
	primaryEvent,
	breakdownFilter,
	context,
	reportIDSuffix,
}: Omit< BuildGoalDriverReportOptionsArgs, 'limit' > & {
	reportIDSuffix: string;
} ): ReportOptions | undefined {
	const eventNames = normalizePrimaryEvents( primaryEvent );

	if ( ! dates || ! eventNames.length ) {
		return undefined;
	}

	return {
		...dates,
		dimensionFilters: getDimensionFiltersForEvents(
			eventNames,
			breakdownFilter
		),
		metrics: [ { name: 'eventCount' } ],
		reportID: withContextSuffix(
			`analytics-4_goal-driver-reports_${ reportIDSuffix }-total`,
			context
		),
	};
}

/**
 * Reads a site-wide total report's single row into a plain count.
 *
 * @since n.e.x.t
 *
 * @param {Object}      [totalReport]      The report `buildGoalDriverTotalReportOptions` requested.
 * @param {ReportRow[]} [totalReport.rows] The report's rows.
 * @return {number} The total event count, or `0` if the report has no data yet.
 */
export function getGoalDriverTotalCount( totalReport?: {
	rows?: ReportRow[];
} ): number {
	const [ totalRow ] = totalReport?.rows || [];

	return totalRow ? parseMetricValue( totalRow ) : 0;
}

const VISITOR_TYPE_LABELS: Record< string, string > = {
	new: __( 'New visitors', 'google-site-kit' ),
	returning: __( 'Returning visitors', 'google-site-kit' ),
};

/**
 * Report options builders, keyed by goal driver ID.
 *
 * Each builder is goal-type agnostic - it only depends on the primary event(s)
 * and breakdown filter it's given - so both the ecommerce and lead-generation
 * goal drivers, and the equivalent Key Metric tiles, can reuse it unchanged.
 *
 * @since n.e.x.t
 */
export const GOAL_DRIVER_REPORT_OPTIONS_BUILDERS: Record<
	GoalDriverID,
	GoalDriverReportOptionsBuilder
> = {
	[ GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS ]:
		buildSingleDimensionReportOptionsBuilder(
			'sessionDefaultChannelGroup',
			'top-traffic-channels'
		),
	[ GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE ]: ( {
		dates,
		primaryEvent,
		breakdownFilter,
		limit,
		context,
	} ) => {
		const eventNames = normalizePrimaryEvents( primaryEvent );

		if ( ! dates || ! eventNames.length ) {
			return undefined;
		}

		return {
			...dates,
			dimensions: [ 'sessionDefaultChannelGroup' ],
			dimensionFilters: getDimensionFiltersForEvents(
				eventNames,
				breakdownFilter
			),
			metrics: [ { name: 'eventCount' }, { name: 'sessions' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit,
			keepEmptyRows: false,
			reportID: withContextSuffix(
				'analytics-4_goal-driver-reports_top-traffic-channels-rate',
				context
			),
		};
	},
	[ GOAL_DRIVER_IDS.TOP_PAGES ]: ( {
		dates,
		primaryEvent,
		breakdownFilter,
		limit,
		context,
	} ) => {
		const eventNames = normalizePrimaryEvents( primaryEvent );

		if ( ! dates || ! eventNames.length ) {
			return undefined;
		}

		return {
			...dates,
			dimensions: [ 'pagePath', 'eventName' ],
			dimensionFilters: getDimensionFiltersForEvents(
				eventNames,
				breakdownFilter
			),
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit,
			keepEmptyRows: false,
			reportID: withContextSuffix(
				'analytics-4_goal-driver-reports_top-pages',
				context
			),
		};
	},
	[ GOAL_DRIVER_IDS.TOP_AUTHORS ]: ( {
		dates,
		primaryEvent,
		breakdownFilter,
		limit,
		context,
	} ) => {
		const eventNames = normalizePrimaryEvents( primaryEvent );

		if ( ! dates || ! eventNames.length ) {
			return undefined;
		}

		const eventDimensionFilters = getDimensionFiltersForEvents(
			eventNames,
			breakdownFilter
		);

		// Assigned to a variable so the `notExpression` filter field isn't
		// rejected by an excess property check - see the comment in
		// `buildSingleDimensionReportOptionsBuilder` above.
		const options = {
			...dates,
			dimensions: [
				'customEvent:googlesitekit_post_author',
				'eventName',
			],
			dimensionFilters: {
				...( eventDimensionFilters || {} ),
				'customEvent:googlesitekit_post_author': {
					filterType: 'emptyFilter',
					notExpression: true,
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit,
			keepEmptyRows: false,
			reportID: withContextSuffix(
				'analytics-4_goal-driver-reports_top-authors',
				context
			),
		};

		return options;
	},
	[ GOAL_DRIVER_IDS.VISITOR_TYPE ]: buildSingleDimensionReportOptionsBuilder(
		'newVsReturning',
		'visitor-type'
	),
	[ GOAL_DRIVER_IDS.CITIES ]: buildSingleDimensionReportOptionsBuilder(
		'city',
		'cities',
		{ excludeNotSet: true }
	),
	[ GOAL_DRIVER_IDS.COUNTRIES ]: buildSingleDimensionReportOptionsBuilder(
		'country',
		'countries',
		{ excludeNotSet: true }
	),
	[ GOAL_DRIVER_IDS.DEVICE_TYPE ]: buildSingleDimensionReportOptionsBuilder(
		'deviceCategory',
		'device-type'
	),
};

/**
 * Row mappers, keyed by goal driver ID.
 *
 * Each mapper takes the report rows the matching builder's options produce and
 * returns `GoalDriverRow[]`. Every driver's value is its row's share of the
 * total as a percentage, except `topPages`, whose value is the raw event
 * count, and `topTrafficChannelsRate`, whose value is that channel's own
 * conversion rate rather than a share of a total.
 *
 * @since n.e.x.t
 */
export const GOAL_DRIVER_ROW_MAPPERS: Record<
	GoalDriverID,
	GoalDriverRowMapper
> = {
	[ GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS ]: makeShareOfTotalMapper( {
		emptyLabel: '-',
	} ),
	[ GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE ]: ( rows ) =>
		rows.map( ( row ) => {
			const channel = row.dimensionValues?.[ 0 ]?.value || '-';
			const eventCount = parseMetricValue( row, 0 );
			const sessions = parseMetricValue( row, 1 );
			const rate = sessions > 0 ? eventCount / sessions : 0;

			return {
				label: channel,
				value: numFmt( rate, {
					style: 'percent',
					signDisplay: 'never',
					maximumFractionDigits: 1,
				} ),
			};
		} ),
	[ GOAL_DRIVER_IDS.TOP_PAGES ]: ( rows ) =>
		rows.map( ( row ) => {
			const pagePath = row.dimensionValues?.[ 0 ]?.value || '';
			const eventCount = parseMetricValue( row, 0 );

			return {
				label: pagePath,
				value: numFmt( eventCount ),
				pagePath,
			};
		} ),
	[ GOAL_DRIVER_IDS.TOP_AUTHORS ]: makeShareOfTotalMapper(),
	[ GOAL_DRIVER_IDS.VISITOR_TYPE ]: makeShareOfTotalMapper( {
		getLabel: ( value ) => VISITOR_TYPE_LABELS[ value ] || value,
		emptyLabel: '-',
	} ),
	[ GOAL_DRIVER_IDS.CITIES ]: makeShareOfTotalMapper(),
	[ GOAL_DRIVER_IDS.COUNTRIES ]: makeShareOfTotalMapper(),
	[ GOAL_DRIVER_IDS.DEVICE_TYPE ]: makeShareOfTotalMapper(),
};

export interface HeadlineMetricReportDates {
	startDate: string;
	endDate: string;
	compareStartDate?: string;
	compareEndDate?: string;
}

/**
 * Builds the Analytics 4 report options for a headline metric's primary event count.
 *
 * Lifted from `OnlineStorePerformanceWidget`'s `getWidgetReportOptions`, this
 * report is goal-type agnostic like the goal driver builders above, so the
 * sibling lead-generation Key Metric tiles can reuse it with a lead event.
 *
 * @since n.e.x.t
 *
 * @param {Object} dates             The date range, including the compare dates.
 * @param {string} [primaryEvent]    The primary conversion event name.
 * @param {Object} [breakdownFilter] Optional dimension filter scoping the report to a breakdown tab.
 * @return {Object|undefined} The Analytics 4 `getReport` options, or `undefined` when there is no primary event.
 */
export function buildPrimaryEventReportOptions(
	dates: HeadlineMetricReportDates,
	primaryEvent?: string,
	breakdownFilter?: Record< string, unknown >
): ReportOptions | undefined {
	if ( ! primaryEvent ) {
		return undefined;
	}

	return {
		...dates,
		metrics: [ { name: 'eventCount' } ],
		dimensions: [ { name: 'eventName' } ],
		dimensionFilters: {
			eventName: primaryEvent,
			...breakdownFilter,
		} as ReportOptions[ 'dimensionFilters' ],
		reportID: 'analytics-4_goal-driver-reports_primary-event',
	};
}

/**
 * Builds the Analytics 4 report options for a headline metric's engagement rate and sessions.
 *
 * Lifted from `OnlineStorePerformanceWidget`'s `getWidgetReportOptions` and
 * `EngagementRateTile`, which request the same shape.
 *
 * @since n.e.x.t
 *
 * @param {Object} dates             The date range, including the compare dates.
 * @param {Object} [breakdownFilter] Optional dimension filter scoping the report to a breakdown tab.
 * @return {Object} The Analytics 4 `getReport` options.
 */
export function buildEngagementReportOptions(
	dates: HeadlineMetricReportDates,
	breakdownFilter?: Record< string, unknown >
): ReportOptions {
	return {
		...dates,
		metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
		...( breakdownFilter
			? {
					dimensionFilters:
						breakdownFilter as ReportOptions[ 'dimensionFilters' ],
			  }
			: {} ),
		reportID: 'analytics-4_goal-driver-reports_engagement',
	};
}
