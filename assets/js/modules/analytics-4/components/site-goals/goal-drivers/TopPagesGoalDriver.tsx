/**
 * TopPagesGoalDriver component.
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
import { decodeAmpersand } from '@/js/modules/analytics-4/utils';
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

const TopPagesGoalDriver: FC< GoalDriverComponentProps > = ( props ) => {
	const {
		goalType,
		limit,
		rows: providedRows,
		loading: providedLoading,
		error: providedError,
		primaryEvent,
		onExpandableRowsChange,
	} = props;
	let title: string = __( 'Top pages driving leads', 'google-site-kit' );

	if ( goalType === GOAL_TYPES.ECOMMERCE ) {
		title = __( 'Top pages driving sales', 'google-site-kit' );
	}

	const headerLabel = __( 'Events', 'google-site-kit' );
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

		return {
			...dates,
			dimensions: [ 'pagePath', 'eventName' ],
			dimensionFilters: getDimensionFiltersForEvents( eventNames ),
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
	}, [ dates, primaryEvent, goalType ] );
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

			const hasReportStarted = select(
				MODULES_ANALYTICS_4
			).hasStartedResolution( 'getReport', [ reportOptions ] );
			const hasReportFinished = select(
				MODULES_ANALYTICS_4
			).hasFinishedResolution( 'getReport', [ reportOptions ] );

			if ( hasReportStarted && ! hasReportFinished ) {
				return true;
			}

			const currentReportError = select(
				MODULES_ANALYTICS_4
			).getErrorForSelector( 'getReport', [ reportOptions ] );

			if (
				hasReportStarted &&
				report === undefined &&
				! currentReportError
			) {
				return true;
			}

			const sourceRows = report?.rows || [];
			return sourceRows.length > 0 && titles === undefined;
		},
		[ report, reportOptions, titles ]
	);
	const sourceRows: ReportRow[] = report?.rows || [];
	const mappedRows: GoalDriverRow[] = sourceRows
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
	const rows = providedRows || mappedRows;
	const loading = providedLoading ?? reportLoading;
	const error = providedError ?? reportError;

	const pagePaths = useMemo(
		() => rows.map( ( row ) => row.pagePath ).filter( Boolean ) as string[],
		[ rows ]
	);

	const pageURLs = useSelect(
		( select: Select ) => {
			if ( ! pagePaths.length ) {
				return {};
			}

			const reportDates = select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} );

			if ( ! reportDates ) {
				return {};
			}

			const analytics4Store = select( MODULES_ANALYTICS_4 );

			return pagePaths.reduce(
				(
					urlsByPath: Record< string, string | undefined >,
					pagePath
				) => {
					urlsByPath[ pagePath ] =
						analytics4Store.getServiceReportURL(
							'all-pages-and-screens',
							{
								filters: {
									unifiedPagePathScreen: pagePath,
								},
								dates: reportDates,
							}
						);

					return urlsByPath;
				},
				{}
			);
		},
		[ pagePaths ]
	);

	const rowsWithURLs = useMemo(
		() =>
			rows.map( ( row ) => ( {
				...row,
				url: row.pagePath ? pageURLs[ row.pagePath ] : row.url,
			} ) ),
		[ pageURLs, rows ]
	);

	useEffect( () => {
		onExpandableRowsChange?.(
			GOAL_DRIVER_IDS.TOP_PAGES,
			rows.length > GOAL_DRIVER_ROW_LIMIT_COLLAPSED
		);
	}, [ onExpandableRowsChange, rows.length ] );

	const noDataMetricLabel =
		goalType === GOAL_TYPES.ECOMMERCE ? 'sales' : 'leads';

	return (
		<TableTile
			title={ title }
			headerLabel={ headerLabel }
			rows={ rowsWithURLs }
			loading={ loading }
			error={ error }
			limit={ limit }
			noDataMetricLabel={ noDataMetricLabel }
		/>
	);
};

export default TopPagesGoalDriver;
