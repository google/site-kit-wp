/**
 * Traffic Overview `useReportState` hook.
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
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';

export interface ReportState< ReportType > {
	/** The report, or `undefined` until it loads. */
	report?: ReportType;
	/** Whether the report is loading. */
	loading: boolean;
	/** The error of the report request, if it failed. */
	error?: object;
}

/**
 * Gets a report with its loading state and its error. The report is requested
 * once the component is in view.
 *
 * @since n.e.x.t
 *
 * @param {string} storeName The store with the `getReport` selector, e.g. `MODULES_ANALYTICS_4`.
 * @param {Object} [options] The report options. Without options, the hook requests no report.
 * @return {Object} The report, whether it is loading, and its error.
 */
export function useReportState< ReportType >(
	storeName: string,
	options?: object
): ReportState< ReportType > {
	const report = useInViewSelect< ReportType | undefined >(
		( select: Select ) =>
			options ? select( storeName ).getReport( options ) : undefined,
		[ storeName, options ]
	);

	const loading = useSelect(
		( select: Select ) =>
			!! options &&
			! select( storeName ).hasFinishedResolution( 'getReport', [
				options,
			] ),
		[ storeName, options ]
	);

	const error = useSelect(
		( select: Select ) =>
			options
				? select( storeName ).getErrorForSelector( 'getReport', [
						options,
				  ] )
				: undefined,
		[ storeName, options ]
	);

	return { report, loading, error };
}
