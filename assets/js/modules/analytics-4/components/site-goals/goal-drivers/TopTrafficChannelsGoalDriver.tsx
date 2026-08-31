/**
 * TopTrafficChannelsGoalDriver component.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import TableTile from '@/js/modules/analytics-4/components/site-goals/components/TableTile';
import {
	GOAL_DRIVER_IDS,
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	GOAL_DRIVER_REPORT_OPTIONS_BUILDERS,
	buildGoalDriverTotalReportOptions,
	getGoalDriverTotalCount,
	makeShareOfExplicitTotalMapper,
	parseMetricValue,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { GoalDriverComponentProps } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportRow } from '@/js/modules/analytics-4/datastore/types';

const TopTrafficChannelsGoalDriver: FC< GoalDriverComponentProps > = ( {
	title = '',
	goalType,
	limit,
	rows: providedRows,
	loading: providedLoading,
	error: providedError,
	primaryEvent,
	breakdownFilter,
	onExpandableRowsChange,
} ) => {
	const dates = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);
	const reportOptions = useMemo(
		() =>
			GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
				GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS
			]( {
				dates,
				primaryEvent,
				breakdownFilter,
				limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				context: goalType,
			} ),
		[ dates, primaryEvent, breakdownFilter, goalType ]
	);
	// The percentage shown is each channel's share of every matching event
	// site-wide, not just the ranked channels above - see
	// `buildGoalDriverTotalReportOptions`.
	const totalReportOptions = useMemo(
		() =>
			buildGoalDriverTotalReportOptions( {
				dates,
				primaryEvent,
				breakdownFilter,
				context: goalType,
				reportIDSuffix: 'top-traffic-channels',
			} ),
		[ dates, primaryEvent, breakdownFilter, goalType ]
	);

	const report = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
				: undefined,
		[ reportOptions ]
	);
	const totalReport = useSelect(
		( select: Select ) =>
			totalReportOptions
				? select( MODULES_ANALYTICS_4 ).getReport( totalReportOptions )
				: undefined,
		[ totalReportOptions ]
	);
	const reportError = useSelect(
		( select: Select ) =>
			reportOptions && totalReportOptions
				? select( MODULES_ANALYTICS_4 ).getFirstReportError(
						reportOptions,
						totalReportOptions
				  )
				: undefined,
		[ reportOptions, totalReportOptions ]
	);
	const reportLoading = useSelect(
		( select: Select ) =>
			reportOptions && totalReportOptions
				? select( MODULES_ANALYTICS_4 ).areReportsLoading(
						reportOptions,
						totalReportOptions
				  )
				: false,
		[ reportOptions, totalReportOptions ]
	);

	const sourceRows = report?.rows || [];
	// Falls back to summing the visible rows only if the total report hasn't
	// resolved any usable count yet (e.g. still loading), so the tile shows a
	// reasonable percentage rather than 0% while the true total is in flight.
	const totalCount =
		getGoalDriverTotalCount( totalReport ) ||
		sourceRows.reduce(
			( sum: number, row: ReportRow ) => sum + parseMetricValue( row ),
			0
		);
	const mappedRows =
		makeShareOfExplicitTotalMapper( totalCount )( sourceRows );

	const rows = providedRows || mappedRows;
	const loading = providedLoading ?? reportLoading;
	const error = providedError ?? reportError;

	useEffect( () => {
		onExpandableRowsChange?.(
			GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
			rows.length > GOAL_DRIVER_ROW_LIMIT_COLLAPSED
		);
	}, [ onExpandableRowsChange, rows.length ] );
	const noDataMetricLabel =
		goalType === GOAL_TYPES.ECOMMERCE ? 'sales' : 'leads';

	return (
		<TableTile
			title={ title }
			rows={ rows }
			loading={ loading }
			error={ error }
			limit={ limit }
			noDataMetricLabel={ noDataMetricLabel }
		/>
	);
};

export default TopTrafficChannelsGoalDriver;
