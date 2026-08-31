/**
 * SalesRateWidget component.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import { MetricTileNumeric } from '@/js/components/KeyMetrics';
import {
	CORE_USER,
	KM_ANALYTICS_SALES_RATE,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	buildEngagementReportOptions,
	buildPrimaryEventReportOptions,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { numFmt } from '@/js/util';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

interface SalesRateWidgetProps {
	Widget: ElementType;
}

const SalesRateWidget: FC< SalesRateWidgetProps > = ( { Widget } ) => {
	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( { compare: true } ),
		[]
	);

	// This tile is purchase-specific ("Sales rate"), so the primary event is
	// always `purchase` rather than `getPrimaryEcommerceEvent()`'s detected
	// fallback to `add_to_cart` - otherwise the tile would silently start
	// showing add-to-cart data under a "sales" label.
	const primaryEvent = ENUM_CONVERSION_EVENTS.PURCHASE;

	const primaryEventReportOptions = buildPrimaryEventReportOptions(
		dates,
		primaryEvent
	);
	const engagementReportOptions = buildEngagementReportOptions( dates );

	const primaryEventReport =
		useInViewSelect(
			( select: Select ) =>
				primaryEventReportOptions
					? select( MODULES_ANALYTICS_4 ).getReport(
							primaryEventReportOptions
					  )
					: undefined,
			[ primaryEventReportOptions ]
		) || {};

	const engagementReport =
		useInViewSelect(
			( select: Select ) =>
				primaryEventReportOptions
					? select( MODULES_ANALYTICS_4 ).getReport(
							engagementReportOptions
					  )
					: undefined,
			[ primaryEventReportOptions, engagementReportOptions ]
		) || {};

	const error = useSelect(
		( select: Select ) => {
			if ( ! primaryEventReportOptions ) {
				return undefined;
			}

			return select( MODULES_ANALYTICS_4 ).getFirstReportError(
				primaryEventReportOptions,
				engagementReportOptions
			);
		},
		[ primaryEventReportOptions, engagementReportOptions ]
	);

	const loading = useSelect(
		( select: Select ) => {
			if ( ! primaryEventReportOptions ) {
				return true;
			}

			return select( MODULES_ANALYTICS_4 ).areReportsLoading(
				primaryEventReportOptions,
				engagementReportOptions
			);
		},
		[ primaryEventReportOptions, engagementReportOptions ]
	);

	const { currentRate, previousRate, currentSessions } = processReports(
		primaryEventReport,
		engagementReport
	);

	return (
		<MetricTileNumeric
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_SALES_RATE }
			metricValue={ currentRate }
			metricValueFormat={ {
				style: 'percent',
				signDisplay: 'never',
				maximumFractionDigits: 1,
			} }
			subText={ sprintf(
				/* translators: %s: formatted number of total sessions */
				__( 'of %s total sessions', 'google-site-kit' ),
				numFmt( currentSessions, { style: 'decimal' } )
			) }
			previousValue={ previousRate }
			currentValue={ currentRate }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
};

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( SalesRateWidget );
