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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	FreshDataDateRange,
	getFreshDataDateRange,
} from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import {
	getInsightReportArgs,
	getSearchPerformanceReportOptions,
	getTimeZoneReportOptions,
	getTotalVisitorsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { SearchPerformanceTotals } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/aggregateSearchConsoleRows';
import { getFreshDataWindowStart } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getFreshDataWindow';
import {
	getComparisonDateRange,
	getDateDimensionValues,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/insight';
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
 * Builds the insight notice's report for a Recent activity date range.
 *
 * The report has a row for every day, the way the API returns it. Each
 * window's visitors fall on the window's last day, and every other day has no
 * visitors.
 *
 * @since n.e.x.t
 *
 * @param {Object}        dateRange   The Recent activity date range.
 * @param {number}        current     Visitors in the date range.
 * @param {Array<number>} comparisons Visitors in the same date range one, two, three and four weeks earlier. A missing week has no visitors.
 * @return {Object} The insight report.
 */
export function createInsightReport(
	dateRange: FreshDataDateRange,
	current: number,
	comparisons: number[]
): Report {
	const { startDate, endDate } = getInsightReportArgs( dateRange );
	const visitorsByDate = new Map< string, number >();

	[ current, ...comparisons ].forEach( ( visitors, weeks ) => {
		const comparison = getComparisonDateRange( dateRange, weeks );

		visitorsByDate.set( comparison.endDate.replace( /-/g, '' ), visitors );
	} );

	return {
		rows: getDateDimensionValues( startDate, endDate ).map( ( date ) => ( {
			dimensionValues: [ { value: date } ],
			metricValues: [
				{ value: String( visitorsByDate.get( date ) || 0 ) },
			],
		} ) ),
	};
}

/**
 * Puts the insight notice's report for the reference date's Recent activity
 * date range in the store.
 *
 * @since n.e.x.t
 *
 * @param {Object}        registry    The registry to put the report in.
 * @param {number}        current     Visitors in the date range.
 * @param {Array<number>} comparisons Visitors in the same date range one, two, three and four weeks earlier.
 * @return {void}
 */
export function provideInsightReport(
	registry: WPDataRegistry,
	current: number,
	comparisons: number[]
) {
	const dateRange = getFreshDataDateRange(
		registry.select( CORE_USER ).getReferenceDate()
	);

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport(
			createInsightReport( dateRange, current, comparisons ),
			{ options: getInsightReportArgs( dateRange ) }
		);
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
