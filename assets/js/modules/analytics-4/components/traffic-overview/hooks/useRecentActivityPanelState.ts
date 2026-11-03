/**
 * Traffic Overview `useRecentActivityPanelState` hook.
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
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import useCanViewSharedModule from '@/js/hooks/useCanViewSharedModule';
import {
	FRESH_DATA_FETCH_OPTIONS,
	getSearchPerformanceReportOptions,
	getSiteVisitorsReportOptions,
	getTimeZoneReportOptions,
	getTotalVisitorsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import {
	SearchConsoleHourRow,
	aggregateSearchConsoleRows,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/aggregateSearchConsoleRows';
import { getMetricCount } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { ErrorObject, isInsufficientPermissionsError } from '@/js/util/errors';
import { FreshDataDateRange } from './useFreshDataDateRange';
import { useFreshDataReport } from './useFreshDataReport';

/**
 * What the Recent activity tab shows:
 * - `access-error`, when the user can't view the Analytics data.
 * - `zero-data`, when Analytics has finished gathering data and has no
 *   recent data, and Search Console has none or the user can't view it.
 * - `default` in every other case, where the tab shows its sections.
 *
 * @since n.e.x.t
 */
export type RecentActivityPanelState = 'access-error' | 'zero-data' | 'default';

/**
 * Picks what the Recent activity tab shows, from its visitors and impressions.
 *
 * It counts the visitors over the tab's date range and over the last 24 hours,
 * and the Search Console impressions over the last 24 hours. While a report
 * loads, and when one fails with an error that is not about permissions, the
 * state is `default`. Each section then shows its own loading state or error.
 *
 * @since n.e.x.t
 *
 * @param {number} windowStart The start of the last 24 hours, from `getFreshDataWindowStart()`.
 * @return {string} The state: `access-error`, `zero-data` or `default`.
 */
export function useRecentActivityPanelState(
	windowStart: number
): RecentActivityPanelState {
	const isAnalyticsConnected = useSelect(
		( select: Select ) =>
			select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
		[]
	);

	const canViewAnalytics = useCanViewSharedModule( MODULE_SLUG_ANALYTICS_4 );

	const canViewSearchConsole = useCanViewSharedModule(
		MODULE_SLUG_SEARCH_CONSOLE
	);

	// The tab shows the Analytics setup CTA while Analytics is not connected,
	// and the access error while the user can't view it. Neither needs a
	// report.
	const canReadReports =
		isAnalyticsConnected === true && canViewAnalytics === true;

	const buildSiteVisitorsReportOptions = useCallback(
		( dateRange: FreshDataDateRange ) =>
			canReadReports
				? getSiteVisitorsReportOptions( dateRange )
				: undefined,
		[ canReadReports ]
	);

	const { report: siteVisitorsReport, error: siteVisitorsError } =
		useFreshDataReport( buildSiteVisitorsReportOptions );

	// `SiteTrafficMetrics` requests the same two reports for "Total
	// visitors", so the store sends one request for each.
	const timeZoneReportOptions = useMemo(
		() => getTimeZoneReportOptions( windowStart ),
		[ windowStart ]
	);

	const timeZone = useInViewSelect< string | undefined >(
		( select: Select ) =>
			canReadReports
				? select( MODULES_ANALYTICS_4 ).getReport(
						timeZoneReportOptions
				  )?.metadata?.timeZone
				: undefined,
		[ canReadReports, timeZoneReportOptions ]
	);

	const totalVisitorsReportOptions = useMemo(
		() =>
			timeZone
				? getTotalVisitorsReportOptions( windowStart, timeZone )
				: undefined,
		[ windowStart, timeZone ]
	);

	const totalVisitorsReport = useInViewSelect< Report | undefined >(
		( select: Select ) =>
			totalVisitorsReportOptions
				? select( MODULES_ANALYTICS_4 ).getReport(
						totalVisitorsReportOptions,
						FRESH_DATA_FETCH_OPTIONS
				  )
				: undefined,
		[ totalVisitorsReportOptions ]
	);

	// `isGatheringData()` requests a report to find out.
	const isGatheringData = useInViewSelect< boolean | undefined >(
		( select: Select ) =>
			canReadReports
				? select( MODULES_ANALYTICS_4 ).isGatheringData()
				: undefined,
		[ canReadReports ]
	);

	const searchPerformanceReportOptions = useMemo(
		() => getSearchPerformanceReportOptions( windowStart ),
		[ windowStart ]
	);

	// `SearchPerformanceMetrics` requests the same report, with the same
	// options and fetch options, so the store sends one request for both.
	const searchPerformanceReport = useInViewSelect<
		SearchConsoleHourRow[] | undefined
	>(
		( select: Select ) =>
			canReadReports && canViewSearchConsole === true
				? select( MODULES_SEARCH_CONSOLE ).getReport(
						searchPerformanceReportOptions,
						FRESH_DATA_FETCH_OPTIONS
				  )
				: undefined,
		[ canReadReports, canViewSearchConsole, searchPerformanceReportOptions ]
	);

	// The store saves a report's error under its options alone, without the
	// fetch options.
	const searchPerformanceError: ErrorObject | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_SEARCH_CONSOLE ).getErrorForSelector( 'getReport', [
				searchPerformanceReportOptions,
			] ),
		[ searchPerformanceReportOptions ]
	);

	if (
		canViewAnalytics === false ||
		isInsufficientPermissionsError( siteVisitorsError )
	) {
		return 'access-error';
	}

	// The site visitors report ends on the browser's date. Where the
	// property's date has passed the browser's, "Total visitors" also counts
	// hours of the next day.
	const hasNoVisitors =
		!! siteVisitorsReport &&
		! siteVisitorsError &&
		getMetricCount( siteVisitorsReport.totals?.[ 0 ] ) === 0 &&
		!! totalVisitorsReport &&
		getMetricCount( totalVisitorsReport.rows?.[ 0 ] ) === 0;

	// A search result is shown before it is clicked, so no impressions means
	// no search data at all.
	const hasNoImpressions =
		canViewSearchConsole === false ||
		( !! searchPerformanceReport &&
			! searchPerformanceError &&
			aggregateSearchConsoleRows( searchPerformanceReport, windowStart )
				.impressions === 0 );

	if ( isGatheringData === false && hasNoVisitors && hasNoImpressions ) {
		return 'zero-data';
	}

	return 'default';
}
