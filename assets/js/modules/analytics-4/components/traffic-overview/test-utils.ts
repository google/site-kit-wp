/**
 * Traffic Overview test helpers.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	getSearchPerformanceReportOptions,
	getTimeZoneReportOptions,
	getTotalVisitorsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { SearchPerformanceTotals } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/aggregateSearchConsoleRows';
import { getFreshDataWindowStart } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getFreshDataWindow';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';

interface FreshMetricsFigures {
	/** The number of visitors in the Total visitors report. */
	totalVisitors?: number;
	/** The clicks and impressions in the Search Console report. */
	searchPerformance?: SearchPerformanceTotals;
}

/**
 * Builds a breakdown report from label and visitor pairs, in the order given.
 *
 * The visitors are strings, the way the API returns them.
 *
 * @since 1.188.0
 * @since 1.189.0 Moved to a shared test helper.
 *
 * @param {Array<Array>} pairs `[ label, visitors ]` pairs.
 * @return {Object} The breakdown report.
 */
export function createBreakdownReport(
	pairs: Array< [ string, number ] >
): Report {
	return {
		rows: pairs.map( ( [ label, visitors ] ) => ( {
			dimensionValues: [ { value: label } ],
			metricValues: [ { value: String( visitors ) } ],
		} ) ),
	};
}

/**
 * Gets the class names of the direct children of a tab panel of
 * `TrafficOverviewWidget`, in order.
 *
 * @since n.e.x.t
 *
 * @param {Element} container The element the tab panel rendered into.
 * @return {Array<string>} The class names.
 */
export function getSectionClassNames( container: Element ): string[] {
	return Array.from(
		container.querySelectorAll(
			'.googlesitekit-traffic-overview__panel > *'
		)
	).map( ( section ) => section.className );
}

/**
 * Puts the reports of the Recent activity tab's fresh figures in the store,
 * for the current time, so the figures render without sending a request.
 *
 * It always puts in the report that gives the `Asia/Tokyo` time zone of the
 * Analytics property, which the Total visitors report needs.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry                    The registry.
 * @param {Object} figures                     The figures the reports give.
 * @param {number} [figures.totalVisitors]     Optional. The number of visitors in the Total visitors report.
 * @param {Object} [figures.searchPerformance] Optional. The clicks and impressions in the Search Console report, which has them in the first hour of the window.
 * @return {void}
 */
export function provideFreshMetricsReports(
	registry: WPDataRegistry,
	{ totalVisitors, searchPerformance }: FreshMetricsFigures
) {
	// `FreshMetricsRow` counts the last 24 hours from the current time too.
	// eslint-disable-next-line sitekit/no-direct-date
	const windowStart = getFreshDataWindowStart( Date.now() );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: [ { metricValues: [ { value: '0' } ] } ],
			metadata: { timeZone: 'Asia/Tokyo' },
		},
		{
			options: getTimeZoneReportOptions( windowStart ),
		}
	);

	if ( totalVisitors !== undefined ) {
		// A report without dimensions has one row, even when it counts no
		// visitors.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{ metricValues: [ { value: String( totalVisitors ) } ] },
				],
			},
			{
				options: getTotalVisitorsReportOptions(
					windowStart,
					'Asia/Tokyo'
				),
			}
		);
	}

	if ( searchPerformance ) {
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport(
			[
				{
					// This formats a fixed time, not the current one.
					// eslint-disable-next-line sitekit/no-direct-date
					keys: [ new Date( windowStart ).toISOString() ],
					...searchPerformance,
				},
			],
			{ options: getSearchPerformanceReportOptions( windowStart ) }
		);
	}
}
