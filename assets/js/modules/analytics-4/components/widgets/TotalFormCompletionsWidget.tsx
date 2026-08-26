/**
 * TotalFormCompletionsWidget component.
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
import { MetricTileNumeric } from '@/js/components/KeyMetrics';
import {
	CORE_USER,
	KM_ANALYTICS_TOTAL_FORM_COMPLETIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { buildPrimaryEventReportOptions } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

interface TotalFormCompletionsWidgetProps {
	Widget: ElementType;
}

const TotalFormCompletionsWidget: FC< TotalFormCompletionsWidgetProps > = ( {
	Widget,
} ) => {
	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( { compare: true } ),
		[]
	);

	const detectedLeadEvents = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents(),
		[]
	);

	const reportOptions = buildPrimaryEventReportOptions(
		dates,
		detectedLeadEvents
	);

	const report =
		useInViewSelect(
			( select: Select ) =>
				reportOptions
					? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
					: undefined,
			[ reportOptions ]
		) || {};

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

	const { currentPrimaryCount, previousPrimaryCount } = processReports(
		report,
		{}
	);

	return (
		<MetricTileNumeric
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOTAL_FORM_COMPLETIONS }
			metricValue={ currentPrimaryCount }
			metricValueFormat={ { style: 'decimal' } }
			subText={ undefined }
			previousValue={ previousPrimaryCount }
			currentValue={ currentPrimaryCount }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
};

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TotalFormCompletionsWidget );
