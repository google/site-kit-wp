/**
 * UseVisitorTypeGoalDriverData hook.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, type Select } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { numFmt } from '@/js/util';
import {
	GOAL_DRIVER_IDS,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	getDimensionFiltersForEvents,
	normalizePrimaryEvents,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/utils';
import type {
	GoalDriverData,
	GoalDriverHookArgs,
	GoalDriverRow,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

interface ReportRow {
	dimensionValues?: Array< { value?: string } >;
	metricValues?: Array< { value?: string } >;
}

const VISITOR_TYPE_LABELS: Record< string, string > = {
	new: __( 'New visitors', 'google-site-kit' ),
	returning: __( 'Returning visitors', 'google-site-kit' ),
};

export default function useVisitorTypeGoalDriverData( {
	goalType,
	primaryEvent,
}: GoalDriverHookArgs ): GoalDriverData {
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
			dimensions: [ 'newVsReturning' ],
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
			reportID: `analytics-4_site-goals_visitor-type_${ goalType }`,
		};
	}, [ dates, dimensionFilters, eventNames, goalType ] );

	const report = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
				: undefined,
		[ reportOptions ]
	);

	const error = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getErrorForSelector(
						'getReport',
						[ reportOptions ]
				  )
				: undefined,
		[ reportOptions ]
	);

	const loading = useSelect(
		( select: Select ) =>
			reportOptions
				? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getReport',
						[ reportOptions ]
				  )
				: false,
		[ reportOptions ]
	);

	const sourceRows: ReportRow[] = report?.rows || [];
	const totalCount = sourceRows.reduce( ( total: number, row: ReportRow ) => {
		return (
			total + parseFloat( String( row.metricValues?.[ 0 ]?.value ?? 0 ) )
		);
	}, 0 );

	const rows: GoalDriverRow[] = sourceRows.map( ( row: ReportRow ) => {
		const visitorType = row.dimensionValues?.[ 0 ]?.value || '';
		const eventCount = parseFloat(
			String( row.metricValues?.[ 0 ]?.value ?? 0 )
		);

		return {
			label: VISITOR_TYPE_LABELS[ visitorType ] || visitorType || '-',
			value: numFmt( totalCount > 0 ? eventCount / totalCount : 0, {
				style: 'percent',
				signDisplay: 'never',
				maximumFractionDigits: 1,
			} ),
		};
	} );

	return {
		id: GOAL_DRIVER_IDS.VISITOR_TYPE,
		rows,
		totalRows: rows.length,
		loading,
		error,
	};
}
