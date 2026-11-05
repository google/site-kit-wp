/**
 * Traffic Overview `useRecentTrafficBreakdownColumn` hook.
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
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TableTileRow } from '@/js/modules/analytics-4/components/common/tiles';
import { getTopChannelsReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { getRecentTrafficBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getRecentTrafficBreakdownRows';
import { getMetricCount } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { ExcludedProducts } from '@/js/modules/analytics-4/datastore/fresh-data';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { ErrorObject } from '@/js/util/errors';
import { FreshDataDateRange } from './useFreshDataDateRange';
import { useRecentTrafficBreakdownReport } from './useRecentTrafficBreakdownReport';

export interface RecentTrafficBreakdownColumn {
	/** The options of the column's report, or `undefined` until the options can be built. */
	reportOptions?: ReportOptions;
	/** The rows the column renders, each with its share of the visitors the columns count. */
	rows: TableTileRow[];
	/** `true` until the request for the column's report has finished. */
	loading: boolean;
	/** The error of the column's report, or `undefined` when its request hasn't failed. */
	error?: ErrorObject;
	/** Requests the column's report again. */
	retry: () => void;
}

/**
 * Resolves the report of a column of the Recent activity tab's traffic
 * breakdown, and builds the column's rows from it.
 *
 * @since 1.191.0
 *
 * @param {Function} getReportOptions The function that builds the column's report options, such as `getTopPostsReportOptions()`. It takes the tab's date range and the product pages to leave out.
 * @return {Object} The column's report options, its rows, whether it is loading, its error, and a function that requests its report again.
 */
export function useRecentTrafficBreakdownColumn(
	getReportOptions: (
		dateRange: FreshDataDateRange,
		excludedProducts: ExcludedProducts | null
	) => ReportOptions
): RecentTrafficBreakdownColumn {
	const { reportOptions, report, loading, error, retry } =
		useRecentTrafficBreakdownReport( getReportOptions );

	// Every column reads the same channels report, which the store requests
	// once. The rows don't wait for it, so when it fails, the other columns
	// keep their rows, with no shares.
	const { report: channelsReport } = useRecentTrafficBreakdownReport(
		getTopChannelsReportOptions
	);

	const rows = useMemo(
		() =>
			getRecentTrafficBreakdownRows(
				report,
				getMetricCount( channelsReport?.totals?.[ 0 ] )
			),
		[ report, channelsReport ]
	);

	return { reportOptions, rows, loading, error, retry };
}
