/**
 * UseTopPagesGoalDriverData hook.
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
import { decodeAmpersand } from '@/js/modules/analytics-4/utils';
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

export default function useTopPagesGoalDriverData( {
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
			dimensions: [ 'pagePath', 'eventName' ],
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
			reportID: `analytics-4_site-goals_top-pages_${ goalType }`,
		};
	}, [ dates, dimensionFilters, eventNames, goalType ] );

	const report = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
				: undefined,
		[ reportOptions ]
	);

	const titles = useSelect(
		( select: Select ) =>
			report && reportOptions
				? select( MODULES_ANALYTICS_4 ).getPageTitles(
						report,
						reportOptions
				  )
				: undefined,
		[ report, reportOptions ]
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
		( select: Select ) => {
			if ( ! reportOptions ) {
				return false;
			}

			if (
				! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ reportOptions ]
				)
			) {
				return true;
			}

			const sourceRows = report?.rows || [];
			return sourceRows.length > 0 && titles === undefined;
		},
		[ report, reportOptions, titles ]
	);

	const sourceRows: ReportRow[] = report?.rows || [];

	const rows: GoalDriverRow[] = sourceRows
		.slice( 0, GOAL_DRIVER_ROW_LIMIT_EXPANDED )
		.map( ( row ) => {
			const pagePath = row.dimensionValues?.[ 0 ]?.value || '';
			const rawPageTitle = titles?.[ pagePath ];
			const pageTitle = rawPageTitle
				? decodeAmpersand( rawPageTitle ).trim()
				: undefined;
			const eventCount = parseFloat(
				String( row.metricValues?.[ 0 ]?.value ?? 0 )
			);

			return {
				label:
					! pageTitle ||
					pageTitle === __( '(unknown)', 'google-site-kit' )
						? pagePath
						: pageTitle,
				value: numFmt( eventCount ),
				pagePath,
			};
		} );

	return {
		id: GOAL_DRIVER_IDS.TOP_PAGES,
		rows,
		totalRows: rows.length,
		loading,
		error,
	};
}
