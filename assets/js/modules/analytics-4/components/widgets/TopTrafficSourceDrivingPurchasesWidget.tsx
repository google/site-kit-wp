/**
 * TopTrafficSourceDrivingPurchasesWidget component.
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
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { MetricTileTable } from '@/js/components/KeyMetrics';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
} from '@/js/googlesitekit/datastore/user/constants';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';
import {
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { buildGoalDriverTotalReportOptions } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/reportOptionsHelpers';
import {
	getGoalDriverTotalCount,
	makeShareOfExplicitTotalMapper,
	parseMetricValue,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/rowMapperHelpers';
import { buildTopTrafficChannelsReportOptions } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/topTrafficChannels';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { ENUM_CONVERSION_EVENTS } from '@/js/modules/analytics-4/datastore/constants';
import { ReportRow } from '@/js/modules/analytics-4/datastore/types';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import { goalDriverTileColumns } from './utils/goalDriverTileColumns';
import useAnalyticsReportsData from './utils/useAnalyticsReportsData';

interface TopTrafficSourceDrivingPurchasesWidgetProps {
	Widget: ElementType;
}

const TopTrafficSourceDrivingPurchasesWidget: FC<
	TopTrafficSourceDrivingPurchasesWidgetProps
> = ( { Widget } ) => {
	const dates = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	// This tile is purchase-specific, so the primary event is always
	// `purchase` rather than `getPrimaryEcommerceEvent()`'s detected fallback
	// to `add_to_cart` - otherwise the tile would silently start showing
	// add-to-cart data under a sales label.
	const primaryEvent = ENUM_CONVERSION_EVENTS.PURCHASE;

	const reportOptions = buildTopTrafficChannelsReportOptions( {
		dates,
		primaryEvent,
		limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	} );

	// Each channel's percentage is its share of every matching event site-wide,
	// not just the ranked channels shown, so that total is fetched separately.
	const totalReportOptions = buildGoalDriverTotalReportOptions( {
		dates,
		primaryEvent,
		reportIDSuffix: 'top-traffic-channels',
	} );

	const {
		report,
		secondaryReport: totalReport,
		loading,
		error,
	} = useAnalyticsReportsData( {
		primaryOptions: reportOptions,
		secondaryOptions: totalReportOptions,
		ready: Boolean( reportOptions ) && Boolean( totalReportOptions ),
	} );

	const sourceRows: ReportRow[] = report?.rows || [];
	// Falls back to summing the ranked rows when the site-wide total comes back
	// empty, so the tile shows a sensible percentage rather than 0%.
	const totalCount =
		getGoalDriverTotalCount( totalReport ) ||
		sourceRows.reduce(
			( sum: number, row: ReportRow ) => sum + parseMetricValue( row ),
			0
		);
	const rows = makeShareOfExplicitTotalMapper( totalCount )( sourceRows );

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES }
			loading={ loading }
			rows={ rows }
			columns={ goalDriverTileColumns }
			limit={ GOAL_DRIVER_ROW_LIMIT_COLLAPSED }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
};

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopTrafficSourceDrivingPurchasesWidget );
