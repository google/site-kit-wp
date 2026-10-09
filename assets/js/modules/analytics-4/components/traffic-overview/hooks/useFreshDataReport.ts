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
 * Internal dependencies
 */
import {
	Select,
	useDispatch,
	useInViewSelect,
	useSelect,
} from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { MINUTE_IN_SECONDS } from '@/js/util';

export interface FreshDataReport {
	/** The report, which reads `undefined` until it loads and while the Traffic Overview widget is out of view. */
	report?: Report;
	/** Whether the report request has not finished, which includes the time the widget is out of view. */
	loading: boolean;
	/** The error of the report request, which reads `undefined` while the request has not failed. */
	error?: unknown;
	/** Requests the report again, for the "Retry" button of the report error. */
	retry: () => void;
}

/**
 * The fetch options of a Recent activity report. The browser keeps the report
 * for five minutes, in place of the hour it keeps other reports.
 */
export const FRESH_DATA_FETCH_OPTIONS = { cacheTTL: 5 * MINUTE_IN_SECONDS };

/**
 * Requests a GA4 report for the Recent activity tab, and reads the state of
 * the request.
 *
 * The data store records the request under both arguments of `getReport()`,
 * the report options and the fetch options, so the hook reads the loading
 * state under both. The data store saves an error under the report options
 * alone.
 *
 * @since n.e.x.t
 *
 * @param {Object} reportArgs The report options to pass to the `getReport` selector.
 * @return {Object} The report, whether its request is running, its error, and a function that requests it again.
 */
export function useFreshDataReport(
	reportArgs: ReportOptions
): FreshDataReport {
	const report = useInViewSelect< Report | undefined >(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReport(
				reportArgs,
				FRESH_DATA_FETCH_OPTIONS
			),
		[ reportArgs ]
	);

	const loading = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportArgs, FRESH_DATA_FETCH_OPTIONS ]
			),
		[ reportArgs ]
	);

	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getFirstReportError( reportArgs ),
		[ reportArgs ]
	);

	const { invalidateResolution } = useDispatch( MODULES_ANALYTICS_4 );

	// The "Retry" button of `ReportError` resets the request under the report
	// options alone, so the button never sends the request with the fetch
	// options again.
	function retry() {
		invalidateResolution( 'getReport', [
			reportArgs,
			FRESH_DATA_FETCH_OPTIONS,
		] );
	}

	return { report, loading, error, retry };
}
