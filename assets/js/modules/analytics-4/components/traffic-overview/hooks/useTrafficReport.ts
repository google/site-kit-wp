/**
 * Traffic Overview useTrafficReport custom hook.
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
import useViewOnly from '@/js/hooks/useViewOnly';
import { TOTAL_USERS_METRIC } from '@/js/modules/analytics-4/components/dashboard/DashboardAllTrafficWidgetGA4/reportOptions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';

export interface TrafficReport {
	/**
	 * The GA4 report. It reads `undefined` in three cases:
	 *
	 * - The request has not finished.
	 * - The Traffic Overview card is out of view.
	 * - A view-only user's role cannot view Analytics.
	 */
	report?: Report;
	/**
	 * The arguments this hook passes to the `getReport` selector.
	 * `useTrafficOverviewReports` reads this report's loading state and its
	 * error with the same arguments.
	 */
	args: ReportOptions;
}

/**
 * Resolves one of the Traffic Overview card's GA4 reports.
 *
 * The report covers the selected date range, counts total users, and filters on
 * the entity URL when the site has a current entity. On a view-only dashboard,
 * the hook sends no request when the user's role cannot view Analytics.
 *
 * @since n.e.x.t
 *
 * @param {Object} reportOptions The options for one report. The hook adds the date range, the total users metric, and the entity URL.
 * @return {Object} The report, and the arguments passed to the `getReport` selector.
 */
export function useTrafficReport(
	reportOptions: Partial< ReportOptions >
): TrafficReport {
	const viewOnly = useViewOnly();

	const canViewSharedAnalytics4 = useSelect(
		( select: Select ) => {
			if ( ! viewOnly ) {
				return true;
			}

			return select( CORE_USER ).canViewSharedModule(
				MODULE_SLUG_ANALYTICS_4
			);
		},
		[ viewOnly ]
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
	// until the module list and the user's capabilities load. Neither
	// `undefined` nor `false` sends a request.
	const report = useInViewSelect< Report | undefined >(
		( select: Select ) =>
			canViewSharedAnalytics4
				? select( MODULES_ANALYTICS_4 ).getReport( args )
				: undefined,
		[ canViewSharedAnalytics4, args ]
	);

	return { report, args };
}
