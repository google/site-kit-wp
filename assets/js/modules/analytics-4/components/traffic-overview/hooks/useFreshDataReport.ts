/**
 * Traffic Overview `useFreshDataReport` hook.
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
import {
	Select,
	useDispatch,
	useInViewSelect,
	useSelect,
} from 'googlesitekit-data';
import { FRESH_DATA_FETCH_OPTIONS } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { ErrorObject } from '@/js/util/errors';
import {
	FreshDataDateRange,
	useFreshDataDateRange,
} from './useFreshDataDateRange';

export interface FreshDataReport {
	/** The options the report is requested with, or `undefined` until the options can be built. */
	reportOptions?: ReportOptions;
	/** The report, or `undefined` until it loads after the Traffic Overview widget comes into view. */
	report?: Report;
	/** `true` until the request has finished, whether it succeeded or failed, and while the options can't be built. */
	loading: boolean;
	/** The error of the request, or `undefined` when the request hasn't failed. */
	error?: ErrorObject;
	/** Requests the report again. */
	retry: () => void;
}

/**
 * Resolves one of the Recent activity tab's reports, for the tab's date range
 * and with a five-minute cache.
 *
 * `retry` requests the report again, which the "Retry" button of a report
 * error doesn't do for a report with fetch options.
 *
 * @since n.e.x.t
 *
 * @param {Function} buildReportOptions A function that builds the report options from the tab's date range, or returns `undefined` while the data they need loads. Pass a function defined outside the component, or one that changes only when that data does.
 * @return {Object} The report options, the report, whether it is loading, its error, and a function that requests it again.
 */
export function useFreshDataReport(
	buildReportOptions: (
		dateRange: FreshDataDateRange
	) => ReportOptions | undefined
): FreshDataReport {
	const dateRange = useFreshDataDateRange();

	const reportOptions = useMemo(
		() => buildReportOptions( dateRange ),
		[ buildReportOptions, dateRange ]
	);

	// `getReport()` throws an error when it receives no options.
	const report = useInViewSelect< Report | undefined >(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport(
						reportOptions,
						FRESH_DATA_FETCH_OPTIONS
				  )
				: undefined,
		[ reportOptions ]
	);

	// `areReportsLoading()` passes no fetch options, so it would read this
	// report as loading forever.
	const loading = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions, FRESH_DATA_FETCH_OPTIONS ]
			),
		[ report, reportOptions ]
	);

	// The store saves a report's error under its options alone.
	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getFirstReportError( reportOptions ),
		[ report, reportOptions ]
	);

	const { invalidateResolution } = useDispatch( MODULES_ANALYTICS_4 );

	const retry = useCallback( () => {
		invalidateResolution( 'getReport', [
			reportOptions,
			FRESH_DATA_FETCH_OPTIONS,
		] );
	}, [ invalidateResolution, reportOptions ] );

	return { reportOptions, report, loading, error, retry };
}
