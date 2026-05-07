/**
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
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';

/**
 * Creates a find callback for locating rows by date range slug at a specific dimension index.
 *
 * @since n.e.x.t
 *
 * @param {string} dateRangeSlug  Date range slug to match, e.g. "date_range_0".
 * @param {number} dimensionIndex Index of the dimension value to compare against.
 * @return {Function} Predicate function that returns true when the row matches.
 */
function makeFind( dateRangeSlug: string, dimensionIndex: number ) {
	return ( row: ReportRow ) =>
		row?.dimensionValues?.[ dimensionIndex ]?.value === dateRangeSlug;
}

/**
 * Returns current and previous primary event counts by summing across all matching rows.
 * Used when multiple event names each contribute to the total (e.g. lead generation events).
 *
 * @since n.e.x.t
 *
 * @param {Report} eventsReport Report whose rows contain one entry per eventName + dateRange combination.
 * @return {{current: number, previous: number}} Summed counts for each date range.
 */
function getAggregatedPrimaryCounts( eventsReport: Report ) {
	const { rows: eventRows = [] } = eventsReport || {};
	// dateRange is at dimensionValues[1] since eventName is at [0].
	const current = ( eventRows as ReportRow[] )
		.filter( makeFind( 'date_range_0', 1 ) )
		.reduce(
			( sum, row ) =>
				sum +
				( parseInt( row?.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0 ),
			0
		);
	const previous = ( eventRows as ReportRow[] )
		.filter( makeFind( 'date_range_1', 1 ) )
		.reduce(
			( sum, row ) =>
				sum +
				( parseInt( row?.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0 ),
			0
		);
	return { current, previous };
}

/**
 * Returns current and previous primary event counts by reading a single matching row.
 * Used when the report is already filtered to one event name (e.g. a single ecommerce event).
 *
 * @since n.e.x.t
 *
 * @param {Report} eventsReport Report whose rows contain one entry per dateRange.
 * @return {{current: number, previous: number}} Counts for each date range.
 */
function getSinglePrimaryCounts( eventsReport: Report ) {
	const { rows: eventRows = [] } = eventsReport || {};
	// dateRange is at dimensionValues[1] since eventName is at [0].
	const current =
		parseInt(
			( eventRows as ReportRow[] )?.find?.(
				makeFind( 'date_range_0', 1 )
			)?.metricValues?.[ 0 ]?.value ?? '',
			10
		) || 0;
	const previous =
		parseInt(
			( eventRows as ReportRow[] )?.find?.(
				makeFind( 'date_range_1', 1 )
			)?.metricValues?.[ 0 ]?.value ?? '',
			10
		) || 0;
	return { current, previous };
}

/**
 * Processes events and engagement reports into a set of derived metrics.
 *
 * @since n.e.x.t
 *
 * @param {Report}  eventsReport        Report containing event rows (rows keyed by eventName + dateRange).
 * @param {Report}  engagementReport    Report containing engagement totals (engagementRate + sessions).
 * @param {Object}  [options]           Optional processing options.
 * @param {boolean} [options.aggregate] When true, sums eventCount across all matching rows (for
 *                                      multi-event lead generation). When false (default), reads
 *                                      a single matching row (for a single primary ecommerce event).
 * @return {Object} Derived metrics including rates, counts, and engagement values.
 */
export function processReports(
	eventsReport: Report,
	engagementReport: Report,
	options: { aggregate?: boolean } = {}
) {
	const { aggregate = false } = options;
	const { totals: engagementRows = [] } = engagementReport || {};

	const { current: currentPrimaryCount, previous: previousPrimaryCount } =
		aggregate
			? getAggregatedPrimaryCounts( eventsReport )
			: getSinglePrimaryCounts( eventsReport );

	// engagementRate is metricValues[0], sessions is metricValues[1].
	const currentEngagementRate =
		parseFloat(
			engagementRows?.find?.( makeFind( 'date_range_0', 0 ) )
				?.metricValues?.[ 0 ]?.value ?? ''
		) || 0;

	const previousEngagementRate =
		parseFloat(
			engagementRows?.find?.( makeFind( 'date_range_1', 0 ) )
				?.metricValues?.[ 0 ]?.value ?? ''
		) || 0;

	const currentSessions =
		parseInt(
			engagementRows?.find?.( makeFind( 'date_range_0', 0 ) )
				?.metricValues?.[ 1 ]?.value ?? '',
			10
		) || 0;

	const previousSessions =
		parseInt(
			engagementRows?.find?.( makeFind( 'date_range_1', 0 ) )
				?.metricValues?.[ 1 ]?.value ?? '',
			10
		) || 0;

	const currentRate =
		currentSessions === 0 ? 0 : currentPrimaryCount / currentSessions;
	const previousRate =
		previousSessions === 0 ? 0 : previousPrimaryCount / previousSessions;

	return {
		currentRate,
		previousRate,
		currentPrimaryCount,
		previousPrimaryCount,
		currentSessions,
		currentEngagementRate,
		previousEngagementRate,
	};
}
