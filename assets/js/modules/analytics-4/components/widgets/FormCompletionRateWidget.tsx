/**
 * FormCompletionRateWidget component.
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
	KM_ANALYTICS_FORM_COMPLETION_RATE,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	buildEngagementReportOptions,
	buildPrimaryEventReportOptions,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/headlineMetrics';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { numFmt } from '@/js/util';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import useAnalyticsReportsData from './utils/useAnalyticsReportsData';

interface FormCompletionRateWidgetProps {
	Widget: ElementType;
}

/**
 * Gets the primary event report options for the Form Completion Rate
 * widget, and whether no lead events are detected (so a permanently-empty
 * `reportOptions` can be told apart from one that's still pending).
 *
 * @since n.e.x.t
 *
 * @param {Function} select Data store 'select' function.
 * @return {Object} The report options and lead-event detection state.
 */
function getFormCompletionRatePrimaryData( select: Select ) {
	const detectedLeadEvents =
		select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents();

	return {
		reportOptions: buildPrimaryEventReportOptions(
			select( CORE_USER ).getDateRangeDates( { compare: true } ),
			detectedLeadEvents
		),
		hasNoLeadEvents: detectedLeadEvents?.length === 0,
	};
}

/**
 * Gets the engagement report options for the Form Completion Rate widget.
 *
 * @since n.e.x.t
 *
 * @param {Function} select Data store 'select' function.
 * @return {Object} The report options.
 */
function getFormCompletionRateEngagementReportOptions( select: Select ) {
	return buildEngagementReportOptions(
		select( CORE_USER ).getDateRangeDates( { compare: true } )
	);
}

const FormCompletionRateWidget: FC< FormCompletionRateWidgetProps > = ( {
	Widget,
} ) => {
	const { reportOptions: primaryEventReportOptions, hasNoLeadEvents } =
		useSelect( getFormCompletionRatePrimaryData, [] );
	const engagementReportOptions = useSelect(
		getFormCompletionRateEngagementReportOptions,
		[]
	);

	const {
		report: primaryEventReport,
		secondaryReport: engagementReport,
		loading,
		error,
	} = useAnalyticsReportsData( {
		primaryOptions: primaryEventReportOptions,
		secondaryOptions: engagementReportOptions,
	} );

	const { currentRate, previousRate, currentSessions } = processReports(
		primaryEventReport,
		engagementReport,
		{ aggregate: true }
	);

	return (
		<MetricTileNumeric
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_FORM_COMPLETION_RATE }
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
			loading={ loading && ! hasNoLeadEvents }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
};

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( FormCompletionRateWidget );
