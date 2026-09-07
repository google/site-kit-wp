/**
 * Site Goals PDF grouped report options.
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
import { SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE } from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';

/**
 * Date range fields shared by every Site Goals PDF report.
 *
 * The compare dates are what make the reports return `date_range_0` and
 * `date_range_1` rows, which the shaping turns into trends.
 */
export type SiteGoalsPDFDateRange = Pick<
	ReportOptions,
	'startDate' | 'endDate' | 'compareStartDate' | 'compareEndDate'
>;

/**
 * A single `dimensionFilters` entry's value, e.g. the `eventName` filter.
 */
export type SiteGoalsPDFEventFilter = NonNullable<
	ReportOptions[ 'dimensionFilters' ]
>[ string ];

/**
 * The pair of reports a Site Goals PDF widget needs.
 *
 * These stay two reports, as they are on the dashboard: the event report is
 * scoped to the goal's events, while the engagement report must not be, or its
 * `sessions` would count only the sessions that already converted and every
 * rate would come out near 100%.
 */
export interface SiteGoalsPDFReportOptions {
	eventsReportOptions: ReportOptions;
	engagementReportOptions: ReportOptions;
}

export const STORE_BREAKDOWN_DIMENSION = `customEvent:${
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[ GOAL_TYPES.ECOMMERCE ]
}`;

export const LEAD_BREAKDOWN_DIMENSION = `customEvent:${
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[ GOAL_TYPES.LEAD ]
}`;

/**
 * Builds the report pair for a Site Goals PDF widget.
 *
 * Both reports carry the breakdown dimension when one is given, so a single
 * request per report returns every group, instead of one request per group.
 *
 * @since 1.187.0
 *
 * @param dates              Date range, including the compare range.
 * @param eventFilter        `eventName` dimension filter for the event report.
 * @param breakdownDimension Dimension to group by, or `undefined` for the aggregated variant.
 * @param reportIDSuffix     Suffix identifying the widget and variant in the report IDs.
 * @return Report options pair.
 */
function getSiteGoalsPDFReportOptions(
	dates: SiteGoalsPDFDateRange,
	eventFilter: SiteGoalsPDFEventFilter,
	breakdownDimension: string | undefined,
	reportIDSuffix: string
): SiteGoalsPDFReportOptions {
	const dimensions = breakdownDimension
		? { dimensions: [ { name: breakdownDimension } ] }
		: {};

	return {
		eventsReportOptions: {
			...dates,
			...dimensions,
			metrics: [ { name: 'eventCount' } ],
			dimensionFilters: {
				eventName: eventFilter,
			},
			reportID: `analytics-4_site-goals-pdf_${ reportIDSuffix }EventsReportOptions`,
		},
		engagementReportOptions: {
			...dates,
			...dimensions,
			metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
			reportID: `analytics-4_site-goals-pdf_${ reportIDSuffix }EngagementReportOptions`,
		},
	};
}

/**
 * Builds the grouped online store reports, returning every provider at once.
 *
 * @since 1.187.0
 *
 * @param dates        Date range, including the compare range.
 * @param primaryEvent Primary ecommerce event, from `getPrimaryEcommerceEvent`.
 * @return Report options pair, or `null` when there is no primary event.
 */
export function getStoreGroupedReportOptions(
	dates: SiteGoalsPDFDateRange,
	primaryEvent: string | undefined
): SiteGoalsPDFReportOptions | null {
	if ( ! primaryEvent ) {
		return null;
	}

	return getSiteGoalsPDFReportOptions(
		dates,
		primaryEvent,
		STORE_BREAKDOWN_DIMENSION,
		'storeGrouped'
	);
}

/**
 * Builds the aggregated online store reports, used when there is no breakdown.
 *
 * @since 1.187.0
 *
 * @param dates        Date range, including the compare range.
 * @param primaryEvent Primary ecommerce event, from `getPrimaryEcommerceEvent`.
 * @return Report options pair, or `null` when there is no primary event.
 */
export function getStoreAggregatedReportOptions(
	dates: SiteGoalsPDFDateRange,
	primaryEvent: string | undefined
): SiteGoalsPDFReportOptions | null {
	if ( ! primaryEvent ) {
		return null;
	}

	return getSiteGoalsPDFReportOptions(
		dates,
		primaryEvent,
		undefined,
		'storeAggregated'
	);
}

/**
 * Builds the grouped lead generation reports, returning every form at once.
 *
 * @since 1.187.0
 *
 * @param dates      Date range, including the compare range.
 * @param leadEvents Detected lead events, from `getDetectedLeadEvents`.
 * @return Report options pair, or `null` when there are no detected lead events.
 */
export function getLeadGroupedReportOptions(
	dates: SiteGoalsPDFDateRange,
	leadEvents: string[] | undefined
): SiteGoalsPDFReportOptions | null {
	if ( ! leadEvents?.length ) {
		return null;
	}

	return getSiteGoalsPDFReportOptions(
		dates,
		{ filterType: 'inListFilter', value: leadEvents },
		LEAD_BREAKDOWN_DIMENSION,
		'leadGrouped'
	);
}

/**
 * Builds the aggregated lead generation reports, used when there is no breakdown.
 *
 * @since 1.187.0
 *
 * @param dates      Date range, including the compare range.
 * @param leadEvents Detected lead events, from `getDetectedLeadEvents`.
 * @return Report options pair, or `null` when there are no detected lead events.
 */
export function getLeadAggregatedReportOptions(
	dates: SiteGoalsPDFDateRange,
	leadEvents: string[] | undefined
): SiteGoalsPDFReportOptions | null {
	if ( ! leadEvents?.length ) {
		return null;
	}

	return getSiteGoalsPDFReportOptions(
		dates,
		{ filterType: 'inListFilter', value: leadEvents },
		undefined,
		'leadAggregated'
	);
}
