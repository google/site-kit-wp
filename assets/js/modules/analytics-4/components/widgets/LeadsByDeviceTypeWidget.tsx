/**
 * LeadsByDeviceTypeWidget component.
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
	KM_ANALYTICS_LEADS_BY_DEVICE_TYPE,
} from '@/js/googlesitekit/datastore/user/constants';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';
import {
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	buildDeviceTypeReportOptions,
	mapDeviceTypeRows,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/deviceType';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import { goalDriverTileColumns } from './utils/goalDriverTileColumns';
import useAnalyticsReportsData from './utils/useAnalyticsReportsData';

interface LeadsByDeviceTypeWidgetProps {
	Widget: ElementType;
}

/**
 * Gets the report options for the Leads By Device Type widget, plus
 * whether no lead events are detected.
 *
 * @since n.e.x.t
 *
 * @param {Function} select Data store 'select' function.
 * @return {Object} The report options and lead-event detection state.
 */
function getLeadsByDeviceTypeData( select: Select ) {
	const detectedLeadEvents =
		select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents();

	return {
		reportOptions: buildDeviceTypeReportOptions( {
			dates: select( CORE_USER ).getDateRangeDates(),
			primaryEvent: detectedLeadEvents,
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
		} ),
		hasNoLeadEvents: detectedLeadEvents?.length === 0,
	};
}

const LeadsByDeviceTypeWidget: FC< LeadsByDeviceTypeWidgetProps > = ( {
	Widget,
} ) => {
	const { reportOptions, hasNoLeadEvents } = useSelect(
		getLeadsByDeviceTypeData,
		[]
	);

	const { report, loading, error } = useAnalyticsReportsData( {
		primaryOptions: reportOptions,
	} );

	const rows = mapDeviceTypeRows( report?.rows || [] );

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_LEADS_BY_DEVICE_TYPE }
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

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( LeadsByDeviceTypeWidget );
