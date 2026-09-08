/**
 * TopAuthorsDrivingLeadsWidget component.
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
import { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '@/js/components/KeyMetrics';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS,
} from '@/js/googlesitekit/datastore/user/constants';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';
import {
	GOAL_DRIVER_IDS,
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
	TOP_AUTHORS_REQUIRED_CUSTOM_DIMENSIONS,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	GOAL_DRIVER_REPORT_OPTIONS_BUILDERS,
	buildGoalDriverTotalReportOptions,
	getGoalDriverTotalCount,
	makeShareOfExplicitTotalMapper,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import withCustomDimensions from '@/js/modules/analytics-4/utils/withCustomDimensions';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

interface TopAuthorsDrivingLeadsWidgetProps {
	Widget: ElementType;
}

interface GoalDriverTileColumnProps {
	row: Record< string, unknown >;
	fieldValue?: unknown;
}

const columns = [
	{
		field: 'label',
		Component( { fieldValue }: GoalDriverTileColumnProps ) {
			return (
				<MetricTileTablePlainText content={ fieldValue as string } />
			);
		},
	},
	{
		field: 'value',
		Component( { fieldValue }: GoalDriverTileColumnProps ) {
			return <strong>{ fieldValue as string }</strong>;
		},
	},
];

/**
 * Gets the report options for the Top Authors Driving Leads widget.
 *
 * Passes `context: GOAL_TYPES.LEAD` so this reportID stays distinct from
 * the equivalent Selling products tile, which requests the same shape of
 * report (same `top-authors` suffix) for a different primary event.
 *
 * @since n.e.x.t
 *
 * @param {Function} select Data store 'select' function.
 * @return {Object|undefined} The report options.
 */
function getTopAuthorsDrivingLeadsReportOptions( select: Select ) {
	return GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[ GOAL_DRIVER_IDS.TOP_AUTHORS ]( {
		dates: select( CORE_USER ).getDateRangeDates(),
		primaryEvent: select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents(),
		limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
		context: GOAL_TYPES.LEAD,
	} );
}

/**
 * Gets the site-wide total report options for the Top Authors Driving Leads widget.
 *
 * The percentage shown is each author's share of every matching event
 * site-wide, not just the ranked authors above - see
 * `buildGoalDriverTotalReportOptions`. Passes `context: GOAL_TYPES.LEAD`
 * for the same reason as the ranked report options above.
 *
 * @since n.e.x.t
 *
 * @param {Function} select Data store 'select' function.
 * @return {Object|undefined} The report options.
 */
function getTopAuthorsDrivingLeadsTotalReportOptions( select: Select ) {
	return buildGoalDriverTotalReportOptions( {
		dates: select( CORE_USER ).getDateRangeDates(),
		primaryEvent: select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents(),
		context: GOAL_TYPES.LEAD,
		reportIDSuffix: 'top-authors',
	} );
}

const TopAuthorsDrivingLeadsWidget: FC<
	TopAuthorsDrivingLeadsWidgetProps
> = ( { Widget } ) => {
	const reportOptions = useSelect(
		getTopAuthorsDrivingLeadsReportOptions,
		[]
	);
	const totalReportOptions = useSelect(
		getTopAuthorsDrivingLeadsTotalReportOptions,
		[]
	);

	const report = useInViewSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
				: undefined,
		[ reportOptions ]
	);

	const totalReport = useInViewSelect(
		( select: Select ) =>
			totalReportOptions
				? select( MODULES_ANALYTICS_4 ).getReport( totalReportOptions )
				: undefined,
		[ totalReportOptions ]
	);

	const error = useSelect(
		( select: Select ) =>
			reportOptions && totalReportOptions
				? select( MODULES_ANALYTICS_4 ).getFirstReportError(
						reportOptions,
						totalReportOptions
				  )
				: undefined,
		[ reportOptions, totalReportOptions ]
	);

	const loading = useSelect(
		( select: Select ) => {
			if ( ! reportOptions || ! totalReportOptions ) {
				return true;
			}

			return select( MODULES_ANALYTICS_4 ).areReportsLoading(
				reportOptions,
				totalReportOptions
			);
		},
		[ reportOptions, totalReportOptions ]
	);

	const rows = makeShareOfExplicitTotalMapper(
		getGoalDriverTotalCount( totalReport )
	)( report?.rows || [] );

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			limit={ GOAL_DRIVER_ROW_LIMIT_COLLAPSED }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
};

export default compose(
	whenActive( {
		moduleName: MODULE_SLUG_ANALYTICS_4,
		FallbackComponent: ConnectGA4CTATileWidget,
	} ),
	withCustomDimensions( {
		dimensions: TOP_AUTHORS_REQUIRED_CUSTOM_DIMENSIONS,
		reportOptions: getTopAuthorsDrivingLeadsReportOptions,
	} )
)( TopAuthorsDrivingLeadsWidget );
