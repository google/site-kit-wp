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
import { SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID } from '@/js/modules/analytics-4/components/site-goals/constants';
import { getTotalsRows } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
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
	/**
	 * Share of the site's sessions with at least one of the group's Key action
	 * events. Omitted for the "Other sources" group.
	 */
	rate?: SiteGoalsPDFMetric;
	/** Engagement rate for the group. Omitted for the "Other sources" group. */
	engagementRate?: SiteGoalsPDFMetric;
	/**
	 * The site's sessions the rate is a share of, used for the tile subtitle.
	 * The same for every group.
	 */
	sessions?: SiteGoalsPDFMetric;
}

export const OTHER_SOURCES_GROUP_ID = SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID;
export const AGGREGATED_GROUP_ID = 'aggregated';

/** Metric index in the events report. */
const EVENT_COUNT_INDEX = 0;
/** Metric index in the Key action sessions report. */
const KEY_ACTION_SESSIONS_INDEX = 0;
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
 * @since 1.187.0
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
 * @since 1.187.0
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
 * Divides the sessions with a Key action by the site's sessions, guarding
 * against a zero denominator.
 *
 * Mirrors the dashboard's `processReports`, which reports a zero rate rather
 * than a gap when there are no sessions.
 *
 * @since 1.187.0
 * @since n.e.x.t Divided the sessions with a Key action, not the event count.
 *
 * @param keyActionSessions Sessions with a Key action metric.
 * @param sessions          The site's sessions metric.
 * @return Rate for both date ranges.
 */
function toRate(
	keyActionSessions: SiteGoalsPDFMetric,
	sessions: SiteGoalsPDFMetric
): SiteGoalsPDFMetric {
	return {
		current:
			sessions.current === 0
				? 0
				: keyActionSessions.current / sessions.current,
		previous:
			sessions.previous === 0
				? 0
				: keyActionSessions.previous / sessions.previous,
	};
}

/**
 * Splits a grouped report's rows by dimension value.
 *
 * With a breakdown dimension the report returns one row per value per date
 * range, with the date range at `dimensionValues[ 1 ]`.
 *
 * @since 1.187.0
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
 * Sums the event counts of the given row pairs.
 *
 * @since 1.187.0
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
 * Builds one full group from its report rows and the site's sessions.
 *
 * @since 1.187.0
 * @since n.e.x.t Computed the rate from the group's sessions with a Key action over the site's sessions.
 *
 * @param id                    Group ID.
 * @param label                 Group heading.
 * @param eventRows             Event report rows for the group.
 * @param keyActionSessionsRows Key action sessions report rows for the group.
 * @param engagementRows        Engagement report rows for the group.
 * @param siteSessions          The site's sessions, the same for every group.
 * @return The shaped group.
 */
function toGroup(
	id: string,
	label: string,
	eventRows: RowPair,
	keyActionSessionsRows: RowPair,
	engagementRows: RowPair,
	siteSessions: SiteGoalsPDFMetric
): SiteGoalsPDFGroup {
	return {
		id,
		label,
		total: toMetric( eventRows, EVENT_COUNT_INDEX ),
		sessions: siteSessions,
		rate: toRate(
			toMetric( keyActionSessionsRows, KEY_ACTION_SESSIONS_INDEX ),
			siteSessions
		),
		engagementRate: toMetric( engagementRows, ENGAGEMENT_RATE_INDEX ),
	};
}

export interface ShapeSiteGoalsPDFDataArgs {
	/** Grouped event report, one row per breakdown value per date range. */
	eventsReport?: Report;
	/** Grouped report of the sessions with a Key action event, one row per breakdown value per date range. */
	keyActionSessionsReport?: Report;
	/** Grouped engagement report, for each group's engagement rate. */
	engagementReport?: Report;
	/** Aggregated event report, used when there is no breakdown, and for the "Other sources" count. */
	aggregatedEventsReport?: Report;
	/** Aggregated report of the sessions with a Key action event, used when there is no breakdown. */
	aggregatedKeyActionSessionsReport?: Report;
	/**
	 * Aggregated engagement report. Deliberately not scoped to the goal's
	 * events or to a group, so `sessions` is the site's session count that
	 * every group's rate is a share of, as on the dashboard.
	 */
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
 * use, so the PDF stacks them the same way the dashboard lists them. Every event
 * no group covers goes into a trailing "Other sources" group with the total
 * only.
 *
 * @since 1.187.0
 * @since 1.188.0 Counted "Other sources" from the site-wide total, so it matches the dashboard.
 * @since n.e.x.t Computed each rate from the sessions with a Key action over the site's sessions.
 *
 * @param args                                   Reports, breakdown values and labels.
 * @param args.eventsReport                      Grouped event report.
 * @param args.keyActionSessionsReport           Grouped Key action sessions report.
 * @param args.engagementReport                  Grouped engagement report.
 * @param args.aggregatedEventsReport            Aggregated event report.
 * @param args.aggregatedKeyActionSessionsReport Aggregated Key action sessions report.
 * @param args.aggregatedEngagementReport        Aggregated engagement report.
 * @param args.breakdownValues                   Breakdown values that render as their own group, in order.
 * @param args.labels                            Maps a breakdown value to its group heading.
 * @param args.aggregatedLabel                   Label for the single group in the aggregated fallback.
 * @return Ordered groups. Empty when the reports have no data.
 */
export function shapeSiteGoalsPDFData( {
	eventsReport,
	keyActionSessionsReport,
	engagementReport,
	aggregatedEventsReport,
	aggregatedKeyActionSessionsReport,
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
		const aggregatedEvents = getTotalsRows( aggregatedEventsReport );

		if ( ! aggregatedEvents.current && ! aggregatedEvents.previous ) {
			return [];
		}

		const aggregatedEngagement = getTotalsRows(
			aggregatedEngagementReport
		);

		return [
			toGroup(
				AGGREGATED_GROUP_ID,
				aggregatedLabel,
				aggregatedEvents,
				getTotalsRows( aggregatedKeyActionSessionsReport ),
				aggregatedEngagement,
				toMetric( aggregatedEngagement, SESSIONS_INDEX )
			),
		];
	}

	// Every rate is out of all the site's sessions, as on the dashboard.
	const siteSessions = toMetric(
		getTotalsRows( aggregatedEngagementReport ),
		SESSIONS_INDEX
	);
	const keyActionSessionsRowsByValue = groupRowsByValue(
		keyActionSessionsReport
	);
	const engagementRowsByValue = groupRowsByValue( engagementReport );

	const groups: SiteGoalsPDFGroup[] = supportedValues.map( ( value ) =>
		toGroup(
			value,
			labels?.[ value ] ?? value,
			eventRowsByValue.get( value ) ?? {},
			keyActionSessionsRowsByValue.get( value ) ?? {},
			engagementRowsByValue.get( value ) ?? {},
			siteSessions
		)
	);

	// Analytics leaves events out of a report grouped by a custom dimension, so
	// we subtract the groups from the site-wide total, as
	// `getUnattributedEventCounts` does for the dashboard.
	const siteTotal = toMetric(
		getTotalsRows( aggregatedEventsReport ),
		EVENT_COUNT_INDEX
	);
	const groupsTotal = sumTotals(
		supportedValues.map( ( value ) => eventRowsByValue.get( value ) ?? {} )
	);

	const otherSourcesTotal: SiteGoalsPDFMetric = {
		current: Math.max( 0, siteTotal.current - groupsTotal.current ),
		previous: Math.max( 0, siteTotal.previous - groupsTotal.previous ),
	};

	if ( otherSourcesTotal.current > 0 || otherSourcesTotal.previous > 0 ) {
		groups.push( {
			id: OTHER_SOURCES_GROUP_ID,
			label: __( 'Other sources', 'google-site-kit' ),
			total: otherSourcesTotal,
		} );
	}

	return groups;
}
