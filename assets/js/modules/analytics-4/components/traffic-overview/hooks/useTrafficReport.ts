/**
 * Traffic Overview `useTrafficReport` hook.
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
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useCanViewSharedModule from '@/js/hooks/useCanViewSharedModule';
import { TOTAL_USERS_METRIC } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';

export interface TrafficReportOptions {
	/** Whether the hook requests the report. Default is `true`. */
	isEnabled?: boolean;
}

export interface TrafficReport {
	/**
	 * The GA4 report. It reads `undefined` when:
	 *
	 * - The request has not finished.
	 * - The Traffic Overview widget is out of view.
	 * - A view-only user's role cannot view Analytics.
	 * - The hook's `isEnabled` option is `false`.
	 */
	report?: Report;
	/**
	 * The arguments this hook passes to the `getReport` selector.
	 * `useTrafficOverviewReports` reads the report's loading state and its
	 * errors under the same arguments.
	 */
	args: ReportOptions;
}

/**
 * Resolves one of the Traffic Overview widget's GA4 reports.
 *
 * The hook adds the selected date range to the options it receives, and the
 * total users metric where they name no metrics. On an entity dashboard it
 * also adds the entity URL. On a view-only dashboard it sends no request until
 * the user's role can view Analytics.
 *
 * @since 1.188.0
 * @since n.e.x.t Added the `isEnabled` option.
 *
 * @param {Object}  reportOptions       The options for one report.
 * @param {Object}  [options]           Optional. The hook's options.
 * @param {boolean} [options.isEnabled] Optional. Whether the hook requests the report. Default is `true`.
 * @return {Object} The report, and the arguments passed to the `getReport` selector.
 */
export function useTrafficReport(
	reportOptions: Partial< ReportOptions >,
	{ isEnabled = true }: TrafficReportOptions = {}
): TrafficReport {
	const canViewSharedAnalytics4 = useCanViewSharedModule(
		MODULE_SLUG_ANALYTICS_4
	);

	const { startDate, endDate } = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	const entityURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getCurrentEntityURL(),
		[]
	);

	const args = useMemo( () => {
		const reportArgs: ReportOptions = {
			startDate,
			endDate,
			metrics: TOTAL_USERS_METRIC,
			...reportOptions,
		};

		if ( entityURL ) {
			reportArgs.url = entityURL;
		}

		return reportArgs;
	}, [ startDate, endDate, entityURL, reportOptions ] );

	// On a view-only dashboard, `canViewSharedAnalytics4` reads `undefined`
	// until the user's capabilities load. Neither `undefined` nor `false`
	// sends a request.
	const shouldRequest = isEnabled && canViewSharedAnalytics4;

	const report = useInViewSelect< Report | undefined >(
		( select: Select ) =>
			shouldRequest
				? select( MODULES_ANALYTICS_4 ).getReport( args )
				: undefined,
		[ shouldRequest, args ]
	);

	return { report, args };
}
