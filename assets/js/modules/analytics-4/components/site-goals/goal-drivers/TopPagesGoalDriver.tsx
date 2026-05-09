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
import { useMemo } from '@wordpress/element';
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
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import type { GoalDriverComponentProps } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

const TopPagesGoalDriver: FC< GoalDriverComponentProps > = ( props ) => {
	let title = __( 'Top pages driving leads', 'google-site-kit' );

	if ( props.goalType === GOAL_TYPES.ECOMMERCE ) {
		title = __( 'Top pages driving sales', 'google-site-kit' );
	}

	const headerLabel = __( 'Events', 'google-site-kit' );

	const pagePaths = useMemo(
		() =>
			( props.rows || [] )
				.map( ( row ) => row.pagePath )
				.filter( Boolean ) as string[],
		[ props.rows ]
	);

	const pageURLs = useSelect(
		( select: Select ) => {
			if ( ! pagePaths.length ) {
				return {};
			}

			const dates = select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} );

			if ( ! dates ) {
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
								dates,
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
			( props.rows || [] ).map( ( row ) => ( {
				...row,
				url: row.pagePath ? pageURLs[ row.pagePath ] : row.url,
			} ) ),
		[ pageURLs, props.rows ]
	);

	const noDataMetricLabel =
		props.goalType === GOAL_TYPES.ECOMMERCE
			? __( 'sales', 'google-site-kit' )
			: __( 'leads', 'google-site-kit' );

	return (
		<TableTile
			title={ title }
			headerLabel={ headerLabel }
			rows={ rowsWithURLs }
			limit={ props.limit }
			noDataMetricLabel={ noDataMetricLabel }
		/>
	);
};

export default TopPagesGoalDriver;
