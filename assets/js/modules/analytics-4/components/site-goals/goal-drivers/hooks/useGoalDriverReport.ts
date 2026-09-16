/**
 * The useGoalDriverReport hook.
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
import { useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MetricLabel } from '@/js/modules/analytics-4/components/site-goals/components/ZeroDataMessage';
import {
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	GoalDriverReportOptionsBuilder,
	GoalDriverRowMapper,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/types';
import {
	GoalDriverComponentProps,
	GoalDriverID,
	GoalDriverRow,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

export interface UseGoalDriverReportArgs extends GoalDriverComponentProps {
	id: GoalDriverID;
	buildReportOptions: GoalDriverReportOptionsBuilder;
	mapRows: GoalDriverRowMapper;
}

export interface UseGoalDriverReportResult {
	rows: GoalDriverRow[];
	loading: boolean;
	error: unknown;
	noDataMetricLabel: MetricLabel;
}

/**
 * Fetches and maps the report for a single-report goal driver.
 *
 * Covers the drivers that need nothing beyond "fetch one report for this
 * driver's builder, map its rows, report loading/error state" - `CitiesGoalDriver`,
 * `CountriesGoalDriver`, `DeviceTypeGoalDriver`, `TopTrafficChannelsRateGoalDriver`
 * and `VisitorTypeGoalDriver` all delegate to this hook. Drivers with extra
 * concerns (a second report for a site-wide total, page titles, custom
 * dimensions gating) still have their own component, but can start from this
 * hook rather than re-deriving the same report/error/loading wiring.
 *
 * @since n.e.x.t
 *
 * @param {Object}          args                          Hook args.
 * @param {string}          args.id                       The driver's `GOAL_DRIVER_IDS` id.
 * @param {Function}        args.buildReportOptions       Builds this driver's Analytics 4 report options.
 * @param {Function}        args.mapRows                  Maps this driver's report rows to `GoalDriverRow[]`.
 * @param {string}          args.goalType                 The current goal type (ecommerce or lead-generation).
 * @param {Object[]}        [args.rows]                   Rows provided by the caller, used instead of the fetched report.
 * @param {boolean}         [args.loading]                Loading state provided by the caller, used instead of the report's own loading state.
 * @param {*}               [args.error]                  Error provided by the caller, used instead of the report's own error.
 * @param {string|string[]} [args.primaryEvent]           The primary conversion event name(s).
 * @param {Object}          [args.breakdownFilter]        Optional dimension filter scoping the report to a breakdown tab.
 * @param {Function}        [args.onExpandableRowsChange] Called with the driver id and whether it has more rows than the collapsed limit.
 * @return {Object} The rows, loading state, error and no-data metric label.
 */
export default function useGoalDriverReport( {
	id,
	buildReportOptions,
	mapRows,
	goalType,
	rows: providedRows,
	loading: providedLoading,
	error: providedError,
	primaryEvent,
	breakdownFilter,
	onExpandableRowsChange,
}: UseGoalDriverReportArgs ): UseGoalDriverReportResult {
	const dates = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);
	const reportOptions = useMemo(
		() =>
			buildReportOptions( {
				dates,
				primaryEvent,
				breakdownFilter,
				limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				context: goalType,
			} ),
		[ buildReportOptions, dates, primaryEvent, breakdownFilter, goalType ]
	);
	const report = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
				: undefined,
		[ reportOptions ]
	);
	const reportError = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getErrorForSelector(
						'getReport',
						[ reportOptions ]
				  )
				: undefined,
		[ reportOptions ]
	);
	const reportLoading = useSelect(
		( select: Select ) => {
			if ( ! reportOptions ) {
				return false;
			}

			return ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			);
		},
		[ reportOptions ]
	);
	const sourceRows = report?.rows || [];
	const mappedRows = mapRows( sourceRows );
	const rows = providedRows || mappedRows;
	const loading = providedLoading ?? reportLoading;
	const error = providedError ?? reportError;

	useEffect( () => {
		onExpandableRowsChange?.(
			id,
			rows.length > GOAL_DRIVER_ROW_LIMIT_COLLAPSED
		);
	}, [ onExpandableRowsChange, id, rows.length ] );

	const noDataMetricLabel =
		goalType === GOAL_TYPES.ECOMMERCE ? 'sales' : 'leads';

	return { rows, loading, error, noDataMetricLabel };
}
