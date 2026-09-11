/**
 * Shared Analytics 4 report-options builders for Site Goals goal drivers.
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
import {
	getDimensionFiltersForEvents,
	normalizePrimaryEvents,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/utils';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import {
	BuildGoalDriverReportOptionsArgs,
	GoalDriverReportOptionsBuilder,
} from './types';

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
export function withContextSuffix(
	baseReportID: string,
	context?: string
): string {
	return context ? `${ baseReportID }_${ context }` : baseReportID;
}

/**
 * Builds the Analytics 4 report options for a ranked, event-filtered driver
 * report: one or more dimensions broken down by `eventCount` (by default),
 * ordered descending, with the given row limit.
 *
 * This is the shared shape behind every "top N" driver report - the drivers
 * that need more than one dimension, an extra metric, or a dimension filter
 * beyond the event filter (`topAuthors`, `topPages`,
 * `topTrafficChannelsRate`) call this directly; `buildSingleDimensionReportOptionsBuilder`
 * is a thin wrapper over it for the common single-dimension case.
 *
 * @since n.e.x.t
 *
 * @param {Object}          args                         Builder args.
 * @param {Object}          [args.dates]                 The date range.
 * @param {string|string[]} [args.primaryEvent]          The primary conversion event name(s).
 * @param {Object}          [args.breakdownFilter]       Optional dimension filter scoping the report to a breakdown tab.
 * @param {number}          args.limit                   Row limit.
 * @param {string}          [args.context]               Identifies the caller, appended to the reportID.
 * @param {string[]}        args.dimensions              The Analytics 4 dimension name(s).
 * @param {Object[]}        [args.metrics]               The report metrics. Defaults to a single `eventCount` metric.
 * @param {string}          args.reportIDSuffix          Unique suffix for the report ID.
 * @param {Function}        [args.extraDimensionFilters] Given the event `dimensionFilters`, returns the `dimensionFilters` to use instead (e.g. to also exclude "(not set)" rows for a dimension).
 * @return {Object|undefined} The Analytics 4 `getReport` options, or `undefined` when there is no primary event.
 */
export function buildRankedReportOptions( {
	dates,
	primaryEvent,
	breakdownFilter,
	limit,
	context,
	dimensions,
	metrics = [ { name: 'eventCount' } ],
	reportIDSuffix,
	extraDimensionFilters,
}: BuildGoalDriverReportOptionsArgs & {
	dimensions: ReportOptions[ 'dimensions' ];
	metrics?: ReportOptions[ 'metrics' ];
	reportIDSuffix: string;
	extraDimensionFilters?: (
		eventDimensionFilters: ReturnType< typeof getDimensionFiltersForEvents >
	) => ReportOptions[ 'dimensionFilters' ];
} ): ReportOptions | undefined {
	const eventNames = normalizePrimaryEvents( primaryEvent );

	if ( ! dates || ! eventNames.length ) {
		return undefined;
	}

	const eventDimensionFilters = getDimensionFiltersForEvents(
		eventNames,
		breakdownFilter
	);

	// Assigned to a variable, rather than returned directly, so a
	// `notExpression` filter field (missing from `ReportOptions`, but
	// accepted by the Analytics 4 report endpoint) isn't rejected by an
	// excess property check against the function's declared return type.
	const options = {
		...dates,
		dimensions,
		dimensionFilters: extraDimensionFilters
			? extraDimensionFilters( eventDimensionFilters )
			: eventDimensionFilters,
		metrics,
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
}

/**
 * Builds a report options builder for a single-dimension, share-of-total driver.
 *
 * Covers `cities`, `countries`, `deviceType`, `visitorType` and
 * `topTrafficChannels`, which all request one dimension broken down by
 * `eventCount` and differ only in the dimension name and whether "(not set)"
 * rows for that dimension are excluded.
 *
 * @since n.e.x.t
 *
 * @param {string}  dimension               The Analytics 4 dimension name.
 * @param {string}  reportIDSuffix          Unique suffix for the report ID.
 * @param {Object}  [options]               Options.
 * @param {boolean} [options.excludeNotSet] Whether to exclude rows where the dimension is not set.
 * @return {Function} The report options builder.
 */
export function buildSingleDimensionReportOptionsBuilder(
	dimension: string,
	reportIDSuffix: string,
	{ excludeNotSet = false }: { excludeNotSet?: boolean } = {}
): GoalDriverReportOptionsBuilder {
	return ( args ) =>
		buildRankedReportOptions( {
			...args,
			dimensions: [ dimension ],
			reportIDSuffix,
			extraDimensionFilters: excludeNotSet
				? ( eventDimensionFilters ) => ( {
						...( eventDimensionFilters || {} ),
						[ dimension ]: {
							filterType: 'emptyFilter',
							notExpression: true,
						},
				  } )
				: undefined,
		} );
}

/**
 * Builds the Analytics 4 report options for a driver's site-wide total.
 *
 * `topAuthors` and `topTrafficChannels` divide by every matching event
 * site-wide, not just the ranked rows they show, so this requests that total
 * with no dimension breakdown and no row limit - pair it with
 * `makeShareOfExplicitTotalMapper` (in `rowMapperHelpers.ts`).
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
