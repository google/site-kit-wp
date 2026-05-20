/**
 * TopTrafficChannelsRateGoalDriver component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, Select } from 'googlesitekit-data';
import TableTile from '@/js/modules/analytics-4/components/site-goals/components/TableTile';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { numFmt } from '@/js/util';
import {
	GOAL_DRIVER_IDS,
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	getDimensionFiltersForEvents,
	normalizePrimaryEvents,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/utils';
import {
	GoalDriverComponentProps,
	GoalDriverRow,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

interface ReportRow {
	dimensionValues?: Array< { value?: string } >;
	metricValues?: Array< { value?: string } >;
}

const TopTrafficChannelsRateGoalDriver: FC< GoalDriverComponentProps > = ( {
	goalType,
	limit,
	rows: providedRows,
	loading: providedLoading,
	error: providedError,
	primaryEvent,
	onExpandableRowsChange,
} ) => {
	const title =
		goalType === GOAL_TYPES.ECOMMERCE
			? __( 'Top traffic channels by sales rate', 'google-site-kit' )
			: __( 'Top traffic channels by leads rate', 'google-site-kit' );

	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} ),
		[]
	);
	const reportOptions = useMemo( () => {
		const eventNames = normalizePrimaryEvents( primaryEvent );

		if ( ! dates || ! eventNames.length ) {
			return undefined;
		}

		const dimensionFilters = getDimensionFiltersForEvents( eventNames );

		return {
			...dates,
			dimensions: [ 'sessionDefaultChannelGroup' ],
			dimensionFilters,
			metrics: [ { name: 'eventCount' }, { name: 'sessions' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_top-traffic-channels-rate_${ goalType }`,
		};
	}, [ dates, goalType, primaryEvent ] );

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

	const sourceRows: ReportRow[] = report?.rows || [];
	const mappedRows: GoalDriverRow[] = sourceRows.map( ( row: ReportRow ) => {
		const channel = row.dimensionValues?.[ 0 ]?.value || '-';
		const eventCount = parseFloat(
			String( row.metricValues?.[ 0 ]?.value ?? 0 )
		);
		const sessions = parseFloat(
			String( row.metricValues?.[ 1 ]?.value ?? 0 )
		);
		const rate = sessions > 0 ? eventCount / sessions : 0;

		return {
			label: channel || __( '(not set)', 'google-site-kit' ),
			value: numFmt( rate, {
				style: 'percent',
				signDisplay: 'never',
				maximumFractionDigits: 1,
			} ),
		};
	} );

	const rows = providedRows || mappedRows;
	const loading = providedLoading ?? reportLoading;
	const error = providedError ?? reportError;

	useEffect( () => {
		onExpandableRowsChange?.(
			GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE,
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

export default TopTrafficChannelsRateGoalDriver;
