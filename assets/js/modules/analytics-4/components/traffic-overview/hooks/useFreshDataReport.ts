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
import { FRESH_DATA_REPORT_FETCH_OPTIONS } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
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
	/** The options the report is requested with. */
	reportOptions: ReportOptions;
	/**
	 * The report, or `undefined` until the request succeeds. The request waits
	 * until the Traffic Overview widget first comes into view.
	 */
	report?: Report;
	/** `true` until the request has finished, whether it succeeded or failed. */
	loading: boolean;
	/** The error of the request, or `undefined` when the request has not failed. */
	error?: ErrorObject;
	/** Requests the report again. */
	retry: () => void;
}

/**
 * Resolves one of the Recent activity tab's reports.
 *
 * The hook builds the report options for the tab's date range, and requests
 * the report with a cache of five minutes. The store saves the request's
 * progress under both arguments of `getReport`, the options and the fetch
 * options, but saves its error under the options alone. So the hook reads each
 * under its own key, and `retry` restarts the request under both arguments,
 * which the "Retry" button of a report error does not do on its own.
 *
 * @since n.e.x.t
 *
 * @param {Function} buildReportOptions Builds the report options from the tab's date range. Pass the same function on every render, such as one defined outside the component, so the options are built only when the date range changes.
 * @return {Object} The report options, the report, whether it is loading, its error, and a function that requests it again.
 */
export function useFreshDataReport(
	buildReportOptions: ( dateRange: FreshDataDateRange ) => ReportOptions
): FreshDataReport {
	const dateRange = useFreshDataDateRange();

	const reportOptions = useMemo(
		() => buildReportOptions( dateRange ),
		[ buildReportOptions, dateRange ]
	);

	const report = useInViewSelect< Report | undefined >(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReport(
				reportOptions,
				FRESH_DATA_REPORT_FETCH_OPTIONS
			),
		[ reportOptions ]
	);

	const loading = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions, FRESH_DATA_REPORT_FETCH_OPTIONS ]
			),
		[ reportOptions ]
	);

	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
				reportOptions,
			] ),
		[ reportOptions ]
	);

	const { invalidateResolution } = useDispatch( MODULES_ANALYTICS_4 );

	const retry = useCallback( () => {
		invalidateResolution( 'getReport', [
			reportOptions,
			FRESH_DATA_REPORT_FETCH_OPTIONS,
		] );
	}, [ invalidateResolution, reportOptions ] );

	return { reportOptions, report, loading, error, retry };
}
