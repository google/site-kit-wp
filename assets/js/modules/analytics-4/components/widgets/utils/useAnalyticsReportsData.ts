/**
 * The useAnalyticsReportsData hook.
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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';

export interface UseAnalyticsReportsDataArgs {
	primaryOptions?: ReportOptions;
	secondaryOptions?: ReportOptions;
	ready?: boolean;
}

export interface UseAnalyticsReportsDataResult {
	report: Partial< Report >;
	secondaryReport: Partial< Report >;
	loading: boolean;
	// `getErrorForSelector`/`getFirstReportError` are untyped JS selectors, so
	// this matches their existing implicit `any` return rather than
	// narrowing to a specific shape.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above.
	error: any;
}

/**
 * Fetches one or two Analytics 4 reports for a Key Metric tile widget.
 *
 * Covers the "Selling products" tile widgets' shared fetch/error/loading
 * wiring: a single report (`TotalSalesWidget`, and every `MetricTileTable`
 * tile except `TopAuthorsDrivingSalesWidget`), or a primary report paired
 * with a secondary one compared via `getFirstReportError`/`areReportsLoading`
 * (`SalesRateWidget`'s primary event + engagement reports,
 * `TopAuthorsDrivingSalesWidget`'s ranked + site-wide-total reports).
 *
 * By default the reports are only fetched once `primaryOptions` is truthy.
 * Pass `ready` explicitly for anything else: when a caller's readiness also
 * depends on `secondaryOptions` being defined (`TopAuthorsDrivingSalesWidget`
 * requires both its ranked and site-wide-total report options), or on
 * something other than `primaryOptions` entirely
 * (`SalesEngagementRateWidget` gates on a separately-selected primary event,
 * even though its one report's options are never themselves `undefined`).
 *
 * @since n.e.x.t
 *
 * @param {Object}  args                    Hook args.
 * @param {Object}  [args.primaryOptions]   The primary report's options.
 * @param {Object}  [args.secondaryOptions] The secondary report's options, for the two-report case.
 * @param {boolean} [args.ready]            Overrides the default readiness gate (`Boolean( primaryOptions )`).
 * @return {Object} The primary report, the secondary report, loading state and error.
 */
export default function useAnalyticsReportsData( {
	primaryOptions,
	secondaryOptions,
	ready = Boolean( primaryOptions ),
}: UseAnalyticsReportsDataArgs ): UseAnalyticsReportsDataResult {
	const report =
		useInViewSelect(
			( select: Select ) =>
				ready && primaryOptions
					? select( MODULES_ANALYTICS_4 ).getReport( primaryOptions )
					: undefined,
			[ ready, primaryOptions ]
		) || {};

	const secondaryReport =
		useInViewSelect(
			( select: Select ) =>
				ready && secondaryOptions
					? select( MODULES_ANALYTICS_4 ).getReport(
							secondaryOptions
					  )
					: undefined,
			[ ready, secondaryOptions ]
		) || {};

	const error = useSelect(
		( select: Select ) => {
			if ( ! ready || ! primaryOptions ) {
				return undefined;
			}

			if ( secondaryOptions ) {
				return select( MODULES_ANALYTICS_4 ).getFirstReportError(
					primaryOptions,
					secondaryOptions
				);
			}

			return select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getReport',
				[ primaryOptions ]
			);
		},
		[ ready, primaryOptions, secondaryOptions ]
	);

	const loading = useSelect(
		( select: Select ) => {
			if ( ! ready || ! primaryOptions ) {
				return true;
			}

			if ( secondaryOptions ) {
				return select( MODULES_ANALYTICS_4 ).areReportsLoading(
					primaryOptions,
					secondaryOptions
				);
			}

			return ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ primaryOptions ]
			);
		},
		[ ready, primaryOptions, secondaryOptions ]
	);

	return { report, secondaryReport, loading, error };
}
