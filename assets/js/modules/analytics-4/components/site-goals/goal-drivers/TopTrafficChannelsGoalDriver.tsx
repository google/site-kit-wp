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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, type Select } from 'googlesitekit-data';
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
import type {
	GoalDriverComponentProps,
	GoalDriverRow,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

interface ReportRow {
	dimensionValues?: Array< { value?: string } >;
	metricValues?: Array< { value?: string } >;
}

const TopTrafficChannelsGoalDriver: FC< GoalDriverComponentProps > = (
	props
) => {
	const {
		goalType,
		limit,
		rows: providedRows,
		loading: providedLoading,
		error: providedError,
		primaryEvent,
		onExpandableRowsChange,
	} = props;
	let title = __( 'Top traffic channels driving leads', 'google-site-kit' );

	if ( goalType === GOAL_TYPES.ECOMMERCE ) {
		title = __( 'Top traffic channels driving sales', 'google-site-kit' );
	}

	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} ),
		[]
	);
	const eventNames = useMemo(
		() => normalizePrimaryEvents( primaryEvent ),
		[ primaryEvent ]
	);
	const dimensionFilters = useMemo(
		() => getDimensionFiltersForEvents( eventNames ),
		[ eventNames ]
	);
	const reportOptions = useMemo( () => {
		if ( ! dates || ! eventNames.length ) {
			return undefined;
		}

		return {
			...dates,
			dimensions: [ 'sessionDefaultChannelGroup' ],
			dimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_top-traffic-channels_${ goalType }`,
		};
	}, [ dates, dimensionFilters, eventNames, goalType ] );
	const totalReportOptions = useMemo( () => {
		if ( ! dates || ! eventNames.length ) {
			return undefined;
		}

		return {
			...dates,
			dimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			reportID: `analytics-4_site-goals_top-traffic-channels-total_${ goalType }`,
		};
	}, [ dates, dimensionFilters, eventNames, goalType ] );

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
		( select: Select ) => {
			if ( ! reportOptions || ! totalReportOptions ) {
				return undefined;
			}

			const primaryReportError = select(
				MODULES_ANALYTICS_4
			).getErrorForSelector( 'getReport', [ reportOptions ] );
			const totalError = select(
				MODULES_ANALYTICS_4
			).getErrorForSelector( 'getReport', [ totalReportOptions ] );

			if ( primaryReportError && totalError ) {
				return [ primaryReportError, totalError ];
			}

			return primaryReportError || totalError || undefined;
		},
		[ reportOptions, totalReportOptions ]
	);
	const reportLoading = useSelect(
		( select: Select ) => {
			if ( ! reportOptions || ! totalReportOptions ) {
				return false;
			}

			const hasPrimaryStarted = select(
				MODULES_ANALYTICS_4
			).hasStartedResolution( 'getReport', [ reportOptions ] );
			const hasTotalStarted = select(
				MODULES_ANALYTICS_4
			).hasStartedResolution( 'getReport', [ totalReportOptions ] );
			const hasPrimaryFinished = select(
				MODULES_ANALYTICS_4
			).hasFinishedResolution( 'getReport', [ reportOptions ] );
			const hasTotalFinished = select(
				MODULES_ANALYTICS_4
			).hasFinishedResolution( 'getReport', [ totalReportOptions ] );

			if (
				( hasPrimaryStarted && ! hasPrimaryFinished ) ||
				( hasTotalStarted && ! hasTotalFinished )
			) {
				return true;
			}

			const primaryReportError = select(
				MODULES_ANALYTICS_4
			).getErrorForSelector( 'getReport', [ reportOptions ] );
			const totalReportError = select(
				MODULES_ANALYTICS_4
			).getErrorForSelector( 'getReport', [ totalReportOptions ] );

			return (
				( hasPrimaryStarted &&
					report === undefined &&
					! primaryReportError ) ||
				( hasTotalStarted &&
					totalReport === undefined &&
					! totalReportError )
			);
		},
		[ report, reportOptions, totalReport, totalReportOptions ]
	);

	const sourceRows: ReportRow[] = report?.rows || [];
	const totalCount =
		parseFloat(
			String( totalReport?.rows?.[ 0 ]?.metricValues?.[ 0 ]?.value ?? 0 )
		) ||
		sourceRows.reduce( ( total: number, row: ReportRow ) => {
			return (
				total +
				parseFloat( String( row.metricValues?.[ 0 ]?.value ?? 0 ) )
			);
		}, 0 );
	const mappedRows: GoalDriverRow[] = sourceRows.map( ( row: ReportRow ) => {
		const channel = row.dimensionValues?.[ 0 ]?.value || '-';
		const eventCount = parseFloat(
			String( row.metricValues?.[ 0 ]?.value ?? 0 )
		);

		return {
			label: channel || __( '(not set)', 'google-site-kit' ),
			value: numFmt( totalCount > 0 ? eventCount / totalCount : 0, {
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
			GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
			rows.length > GOAL_DRIVER_ROW_LIMIT_COLLAPSED
		);
	}, [ onExpandableRowsChange, rows.length ] );
	const noDataMetricLabel =
		goalType === GOAL_TYPES.ECOMMERCE ? 'sales' : 'leads';

	return (
		<TableTile
			title={ props.title || title }
			rows={ rows }
			loading={ loading }
			error={ error }
			limit={ limit }
			noDataMetricLabel={ noDataMetricLabel }
		/>
	);
};

export default TopTrafficChannelsGoalDriver;
