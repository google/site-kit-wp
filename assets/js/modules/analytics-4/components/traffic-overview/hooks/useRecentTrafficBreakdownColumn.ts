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
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TableTileRow } from '@/js/modules/analytics-4/components/common/tiles';
import { getSiteTotalsReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import {
	getRecentTrafficBreakdownRows,
	getSiteTotal,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getRecentTrafficBreakdownRows';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { ErrorObject } from '@/js/util/errors';
import { FreshDataDateRange } from './useFreshDataDateRange';
import { useFreshDataReport } from './useFreshDataReport';

export interface RecentTrafficBreakdownColumn {
	/** The options of the column's report, or `undefined` until the options can be built. */
	reportOptions?: ReportOptions;
	/** The column's report, or `undefined` until it loads. */
	report?: Report;
	/** The rows the column renders, each with its share of the site's total once the report of the site's totals loads. */
	rows: TableTileRow[];
	/** `true` until the column's report and the report of the site's totals have both finished. */
	loading: boolean;
	/** The error of the column's report, or else the error of the report of the site's totals. */
	error?: ErrorObject;
	/** Requests each failed report again. */
	retry: () => void;
}

/**
 * Resolves the report of a column of the Recent activity tab's traffic
 * breakdown. It also resolves the report of the site's totals, which each
 * share in the column divides.
 *
 * @since n.e.x.t
 *
 * @param {Function} buildReportOptions The function that builds the column's report options from the tab's date range, the way `useFreshDataReport()` takes it.
 * @param {Function} [getRowLabel]      Optional. A function that gets the label of a row from its dimension value, the way `getRecentTrafficBreakdownRows()` takes it. Pass a function defined outside the component, or one that changes only when the data it reads does.
 * @return {Object} The column's report options and report, its rows, whether it is loading, its error, and a function that requests each failed report again.
 */
export function useRecentTrafficBreakdownColumn(
	buildReportOptions: (
		dateRange: FreshDataDateRange
	) => ReportOptions | undefined,
	getRowLabel?: ( dimensionValue: string ) => string | undefined
): RecentTrafficBreakdownColumn {
	const {
		reportOptions,
		report,
		loading,
		error,
		retry: retryReport,
	} = useFreshDataReport( buildReportOptions );

	const {
		report: siteTotalsReport,
		loading: isSiteTotalsReportLoading,
		error: siteTotalsReportError,
		retry: retrySiteTotalsReport,
	} = useFreshDataReport( getSiteTotalsReportOptions );

	const rows = useMemo(
		() =>
			getRecentTrafficBreakdownRows(
				report,
				getSiteTotal( siteTotalsReport, reportOptions ),
				getRowLabel
			),
		[ report, siteTotalsReport, reportOptions, getRowLabel ]
	);

	const retry = useCallback( () => {
		// The store sends no request for a report it already has, so the
		// column's report is requested again only after it failed.
		retryReport();

		// Every column reads the same report of the site's totals, so
		// requesting it again shows the loading state in all of them.
		if ( siteTotalsReportError ) {
			retrySiteTotalsReport();
		}
	}, [ retryReport, siteTotalsReportError, retrySiteTotalsReport ] );

	return {
		reportOptions,
		report,
		rows,
		loading: loading || isSiteTotalsReportLoading,
		error: error || siteTotalsReportError,
		retry,
	};
}
