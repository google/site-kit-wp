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
import { Select, useSelect } from 'googlesitekit-data';
import { MetricTileTable } from '@/js/components/KeyMetrics';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS,
} from '@/js/googlesitekit/datastore/user/constants';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';
import {
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
	TOP_AUTHORS_REQUIRED_CUSTOM_DIMENSIONS,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { buildGoalDriverTotalReportOptions } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/reportOptionsHelpers';
import {
	getGoalDriverTotalCount,
	makeShareOfExplicitTotalMapper,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/rowMapperHelpers';
import { buildTopAuthorsReportOptions } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/topAuthors';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import withCustomDimensions from '@/js/modules/analytics-4/utils/withCustomDimensions';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import { goalDriverTileColumns } from './utils/goalDriverTileColumns';
import useAnalyticsReportsData from './utils/useAnalyticsReportsData';

interface TopAuthorsDrivingLeadsWidgetProps {
	Widget: ElementType;
}

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
	return buildTopAuthorsReportOptions( {
		dates: select( CORE_USER ).getDateRangeDates(),
		primaryEvent: select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents(),
		limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
		context: GOAL_TYPES.LEAD,
	} );
}

/**
 * Gets the site-wide total report options for the Top Authors Driving
 * Leads widget, and whether no lead events are detected (so a
 * permanently-empty `reportOptions` can be told apart from one that's
 * still pending).
 *
 * The percentage shown is each author's share of every matching event
 * site-wide, not just the ranked authors above - see
 * `buildGoalDriverTotalReportOptions`. Passes `context: GOAL_TYPES.LEAD`
 * for the same reason as the ranked report options above.
 *
 * `hasNoLeadEvents` is derived here, rather than alongside the ranked
 * report options above, because `getTopAuthorsDrivingLeadsReportOptions`
 * is also passed directly to `withCustomDimensions` below, which expects
 * it to keep returning bare report options.
 *
 * @since n.e.x.t
 *
 * @param {Function} select Data store 'select' function.
 * @return {Object} The report options and lead-event detection state.
 */
function getTopAuthorsDrivingLeadsTotalData( select: Select ) {
	const detectedLeadEvents =
		select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents();

	return {
		totalReportOptions: buildGoalDriverTotalReportOptions( {
			dates: select( CORE_USER ).getDateRangeDates(),
			primaryEvent: detectedLeadEvents,
			context: GOAL_TYPES.LEAD,
			reportIDSuffix: 'top-authors',
		} ),
		hasNoLeadEvents: detectedLeadEvents?.length === 0,
	};
}

const TopAuthorsDrivingLeadsWidget: FC<
	TopAuthorsDrivingLeadsWidgetProps
> = ( { Widget } ) => {
	const reportOptions = useSelect(
		getTopAuthorsDrivingLeadsReportOptions,
		[]
	);
	const { totalReportOptions, hasNoLeadEvents } = useSelect(
		getTopAuthorsDrivingLeadsTotalData,
		[]
	);

	const {
		report,
		secondaryReport: totalReport,
		loading,
		error,
	} = useAnalyticsReportsData( {
		primaryOptions: reportOptions,
		secondaryOptions: totalReportOptions,
		// The site-wide total is required here (unlike widgets whose
		// secondary report's options are never `undefined`), so readiness
		// needs both, not just `reportOptions`.
		ready: Boolean( reportOptions ) && Boolean( totalReportOptions ),
	} );

	const rows = makeShareOfExplicitTotalMapper(
		getGoalDriverTotalCount( totalReport )
	)( report?.rows || [] );

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS }
			loading={ loading && ! hasNoLeadEvents }
			rows={ rows }
			columns={ goalDriverTileColumns }
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
