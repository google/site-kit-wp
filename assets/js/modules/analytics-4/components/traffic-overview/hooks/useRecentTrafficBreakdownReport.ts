/**
 * Traffic Overview `useRecentTrafficBreakdownReport` hook.
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ExcludedProducts } from '@/js/modules/analytics-4/datastore/fresh-data';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { FreshDataDateRange } from './useFreshDataDateRange';
import { FreshDataReport, useFreshDataReport } from './useFreshDataReport';

/**
 * Resolves a report of the Recent activity tab's traffic breakdown, which
 * leaves out the product pages while the setting to include products is off.
 *
 * @since 1.191.0
 *
 * @param {Function} getReportOptions The function that builds the report's options from the tab's date range and the product pages to leave out, such as `getTopChannelsReportOptions()`.
 * @return {Object} The report, its options, whether it is loading, its error, and a function that requests it again, as `useFreshDataReport()` returns them.
 */
export function useRecentTrafficBreakdownReport(
	getReportOptions: (
		dateRange: FreshDataDateRange,
		excludedProducts: ExcludedProducts | null
	) => ReportOptions
): FreshDataReport {
	const excludedProducts = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getExcludedProducts(),
		[]
	);

	// The options wait for the product pages to leave out, so the report isn't
	// requested first without its product filter.
	const buildReportOptions = useCallback(
		( dateRange: FreshDataDateRange ) =>
			excludedProducts === undefined
				? undefined
				: getReportOptions( dateRange, excludedProducts ),
		[ excludedProducts, getReportOptions ]
	);

	return useFreshDataReport( buildReportOptions );
}
