/**
 * TopTrafficChannelsDrivingSalesRateWidget component.
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
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '@/js/components/KeyMetrics';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE,
} from '@/js/googlesitekit/datastore/user/constants';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';
import {
	GOAL_DRIVER_IDS,
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	GOAL_DRIVER_REPORT_OPTIONS_BUILDERS,
	GOAL_DRIVER_ROW_MAPPERS,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

interface TopTrafficChannelsDrivingSalesRateWidgetProps {
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

const TopTrafficChannelsDrivingSalesRateWidget: FC<
	TopTrafficChannelsDrivingSalesRateWidgetProps
> = ( { Widget } ) => {
	const dates = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	// This tile is purchase-specific ("Top traffic channels driving sales
	// rate"), so the primary event is always `purchase` rather than
	// `getPrimaryEcommerceEvent()`'s detected fallback to `add_to_cart` -
	// otherwise the tile would silently start showing add-to-cart data under
	// a "sales" label.
	const reportOptions = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
		GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE
	]( {
		dates,
		primaryEvent: ENUM_CONVERSION_EVENTS.PURCHASE,
		limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	} );

	const report = useInViewSelect(
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
		( select: Select ) => {
			if ( ! reportOptions ) {
				return true;
			}

			return ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			);
		},
		[ reportOptions ]
	);

	const rows = GOAL_DRIVER_ROW_MAPPERS[
		GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE
	]( report?.rows || [] );

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE }
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

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopTrafficChannelsDrivingSalesRateWidget );
