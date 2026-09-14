/**
 * SalesEngagementRateWidget component.
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
import { Select, useSelect } from 'googlesitekit-data';
import { MetricTileNumeric } from '@/js/components/KeyMetrics';
import {
	CORE_USER,
	KM_ANALYTICS_SALES_ENGAGEMENT_RATE,
} from '@/js/googlesitekit/datastore/user/constants';
import { buildEngagementReportOptions } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/headlineMetrics';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { numFmt } from '@/js/util';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import useAnalyticsReportsData from './utils/useAnalyticsReportsData';

interface SalesEngagementRateWidgetProps {
	Widget: ElementType;
}

const SalesEngagementRateWidget: FC< SalesEngagementRateWidgetProps > = ( {
	Widget,
} ) => {
	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( { compare: true } ),
		[]
	);

	const primaryEvent = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPrimaryEcommerceEvent(),
		[]
	);

	const engagementReportOptions = buildEngagementReportOptions( dates );

	// `engagementReportOptions` is never `undefined` (it only depends on
	// `dates`), so readiness is gated on the separately-selected
	// `primaryEvent` instead of the default "is `primaryOptions` truthy" check.
	const {
		report: engagementReport,
		loading,
		error,
	} = useAnalyticsReportsData( {
		primaryOptions: engagementReportOptions,
		ready: Boolean( primaryEvent ),
	} );

	const { currentEngagementRate, previousEngagementRate, currentSessions } =
		processReports( {}, engagementReport );

	return (
		<MetricTileNumeric
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_SALES_ENGAGEMENT_RATE }
			metricValue={ currentEngagementRate }
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
			previousValue={ previousEngagementRate }
			currentValue={ currentEngagementRate }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
};

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( SalesEngagementRateWidget );
