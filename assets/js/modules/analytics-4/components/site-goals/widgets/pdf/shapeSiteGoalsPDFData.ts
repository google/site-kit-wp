/**
 * Site Goals PDF data shaping.
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
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';

/**
 * One metric's current and previous values, for a tile with a change badge.
 */
export interface SiteGoalsPDFMetric {
	current: number;
	previous: number;
}

/**
 * One breakdown group, as the PDF renders it.
 *
 * The "Other sources" group carries the total only, so `rate`, `engagementRate`
 * and `sessions` are omitted for it.
 */
export interface SiteGoalsPDFGroup {
	/** Dimension value the group came from, or `OTHER_SOURCES_GROUP_ID`. */
	id: string;
	/** Group heading, e.g. "WooCommerce". Falls back to the dimension value. */
	label: string;
	/** Event count for the group. */
	total: SiteGoalsPDFMetric;
	/** Event count over sessions. Omitted for the "Other sources" group. */
	rate?: SiteGoalsPDFMetric;
	/** Engagement rate for the group. Omitted for the "Other sources" group. */
	engagementRate?: SiteGoalsPDFMetric;
	/** Sessions the rate is calculated over, used for the tile subtitle. */
	sessions?: SiteGoalsPDFMetric;
}

export const OTHER_SOURCES_GROUP_ID = 'other-sources';
export const AGGREGATED_GROUP_ID = 'aggregated';

/** Metric index in the events report. */
const EVENT_COUNT_INDEX = 0;
/** Metric indexes in the engagement report. */
const ENGAGEMENT_RATE_INDEX = 0;
const SESSIONS_INDEX = 1;

/** Current and previous rows for one group, or for a report as a whole. */
interface RowPair {
	current?: ReportRow;
	previous?: ReportRow;
}

/**
 * Reads a numeric metric off a report row.
 *
 * @since n.e.x.t
 *
 * @param row   Report row.
 * @param index Metric index.
 * @return Metric value, or `0` when absent or non-numeric.
 */
function getMetric( row: ReportRow | undefined, index: number ): number {
	return Number( row?.metricValues?.[ index ]?.value ) || 0;
}

/**
 * Builds a metric from a row pair.
 *
 * @since n.e.x.t
 *
 * @param rows  Current and previous rows.
 * @param index Metric index.
 * @return Current and previous values.
 */
function toMetric( rows: RowPair, index: number ): SiteGoalsPDFMetric {
	return {
		current: getMetric( rows.current, index ),
		previous: getMetric( rows.previous, index ),
	};
}

/**
 * Divides an event count by sessions, guarding against a zero denominator.
 *
 * Mirrors the dashboard's `processReports`, which reports a zero rate rather
 * than a gap when a group has no sessions.
 *
 * @since n.e.x.t
 *
 * @param total    Event count metric.
 * @param sessions Sessions metric.
 * @return Rate for both date ranges.
 */
function toRate(
	total: SiteGoalsPDFMetric,
	sessions: SiteGoalsPDFMetric
): SiteGoalsPDFMetric {
	return {
		current: sessions.current === 0 ? 0 : total.current / sessions.current,
		previous:
			sessions.previous === 0 ? 0 : total.previous / sessions.previous,
	};
}

/**
 * Splits a grouped report's rows by dimension value.
 *
 * With a breakdown dimension the report returns one row per value per date
 * range, with the date range at `dimensionValues[ 1 ]`.
 *
 * @since n.e.x.t
 *
 * @param report Grouped report.
 * @return Map of dimension value to its row pair.
 */
function groupRowsByValue(
	report: Report | undefined
): Map< string, RowPair > {
	const grouped = new Map< string, RowPair >();

	( ( report?.rows ?? [] ) as ReportRow[] ).forEach( ( row ) => {
		const value = row?.dimensionValues?.[ 0 ]?.value;

		if ( ! value ) {
			return;
		}

		const entry = grouped.get( value ) ?? {};

		if ( row?.dimensionValues?.[ 1 ]?.value === 'date_range_1' ) {
			entry.previous = row;
		} else {
			entry.current = row;
		}

		grouped.set( value, entry );
	} );

	return grouped;
}

/**
 * Reads a report's totals as a current and previous row pair.
 *
 * The aggregated reports carry no breakdown dimension, so their values come
 * from the totals, where the date range is the only dimension.
 *
 * @since n.e.x.t
 *
 * @param report Aggregated report.
 * @return Current and previous totals rows.
 */
function getTotalsPair( report: Report | undefined ): RowPair {
	const totals = ( report?.totals ?? [] ) as ReportRow[];

	return {
		current: totals.find(
			( row ) => row?.dimensionValues?.[ 0 ]?.value !== 'date_range_1'
		),
		previous: totals.find(
			( row ) => row?.dimensionValues?.[ 0 ]?.value === 'date_range_1'
		),
	};
}

/**
 * Sums the event counts of the given row pairs.
 *
 * @since n.e.x.t
 *
 * @param entries Row pairs to fold together.
 * @return Summed event counts for both date ranges.
 */
function sumTotals( entries: RowPair[] ): SiteGoalsPDFMetric {
	return entries.reduce(
		( sum, rows ) => ( {
			current: sum.current + getMetric( rows.current, EVENT_COUNT_INDEX ),
			previous:
				sum.previous + getMetric( rows.previous, EVENT_COUNT_INDEX ),
		} ),
		{ current: 0, previous: 0 }
	);
}

/**
 * Builds one full group from its event and engagement rows.
 *
 * @since n.e.x.t
 *
 * @param id             Group ID.
 * @param label          Group heading.
 * @param eventRows      Event report rows for the group.
 * @param engagementRows Engagement report rows for the group.
 * @return The shaped group.
 */
function toGroup(
	id: string,
	label: string,
	eventRows: RowPair,
	engagementRows: RowPair
): SiteGoalsPDFGroup {
	const total = toMetric( eventRows, EVENT_COUNT_INDEX );
	const sessions = toMetric( engagementRows, SESSIONS_INDEX );

	return {
		id,
		label,
		total,
		sessions,
		rate: toRate( total, sessions ),
		engagementRate: toMetric( engagementRows, ENGAGEMENT_RATE_INDEX ),
	};
}

export interface ShapeSiteGoalsPDFDataArgs {
	/** Grouped event report, one row per breakdown value per date range. */
	eventsReport?: Report;
	/**
	 * Grouped engagement report. Deliberately not scoped to the goal's events,
	 * so `sessions` is the group's full session count and the rate matches the
	 * dashboard.
	 */
	engagementReport?: Report;
	/** Aggregated event report, used when there is no breakdown. */
	aggregatedEventsReport?: Report;
	/** Aggregated engagement report, used when there is no breakdown. */
	aggregatedEngagementReport?: Report;
	/**
	 * Breakdown values that render as their own group, in the order they should
	 * appear. Any other value in the report folds into "Other sources".
	 */
	breakdownValues?: string[];
	/** Maps a breakdown value to its group heading. Falls back to the value itself. */
	labels?: Record< string, string >;
	/** Label for the single group in the aggregated fallback. */
	aggregatedLabel: string;
}

/**
 * Shapes Site Goals reports into the list of groups the PDF renders.
 *
 * Groups follow `breakdownValues` order, which is the order the dashboard tabs
 * use, so the PDF stacks them the same way the dashboard lists them. Rows whose
 * dimension value is not a supported breakdown value carry no attribution, so
 * they fold into a trailing "Other sources" group with the total only.
 *
 * @since n.e.x.t
 *
 * @param args                            Reports, breakdown values and labels.
 * @param args.eventsReport               Grouped event report.
 * @param args.engagementReport           Grouped engagement report.
 * @param args.aggregatedEventsReport     Aggregated event report.
 * @param args.aggregatedEngagementReport Aggregated engagement report.
 * @param args.breakdownValues            Breakdown values that render as their own group, in order.
 * @param args.labels                     Maps a breakdown value to its group heading.
 * @param args.aggregatedLabel            Label for the single group in the aggregated fallback.
 * @return Ordered groups. Empty when the reports have no data.
 */
export function shapeSiteGoalsPDFData( {
	eventsReport,
	engagementReport,
	aggregatedEventsReport,
	aggregatedEngagementReport,
	breakdownValues,
	labels,
	aggregatedLabel,
}: ShapeSiteGoalsPDFDataArgs ): SiteGoalsPDFGroup[] {
	const eventRowsByValue = groupRowsByValue( eventsReport );

	const supportedValues = ( breakdownValues ?? [] ).filter( ( value ) =>
		eventRowsByValue.has( value )
	);

	// No breakdown to show: fall back to the single aggregated group.
	if ( ! supportedValues.length ) {
		const aggregatedEvents = getTotalsPair( aggregatedEventsReport );

		if ( ! aggregatedEvents.current && ! aggregatedEvents.previous ) {
			return [];
		}

		return [
			toGroup(
				AGGREGATED_GROUP_ID,
				aggregatedLabel,
				aggregatedEvents,
				getTotalsPair( aggregatedEngagementReport )
			),
		];
	}

	const engagementRowsByValue = groupRowsByValue( engagementReport );

	const groups: SiteGoalsPDFGroup[] = supportedValues.map( ( value ) =>
		toGroup(
			value,
			labels?.[ value ] ?? value,
			eventRowsByValue.get( value ) ?? {},
			engagementRowsByValue.get( value ) ?? {}
		)
	);

	// Anything the breakdown does not recognise is unattributed, and is only
	// ever shown as a total.
	const unattributed = Array.from( eventRowsByValue.entries() )
		.filter( ( [ value ] ) => ! supportedValues.includes( value ) )
		.map( ( [ , rows ] ) => rows );

	if ( unattributed.length ) {
		const total = sumTotals( unattributed );

		if ( total.current > 0 || total.previous > 0 ) {
			groups.push( {
				id: OTHER_SOURCES_GROUP_ID,
				label: __( 'Other sources', 'google-site-kit' ),
				total,
			} );
		}
	}

	return groups;
}
