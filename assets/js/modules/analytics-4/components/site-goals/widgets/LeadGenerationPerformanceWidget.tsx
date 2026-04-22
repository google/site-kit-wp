/**
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect, type Select } from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import WidgetHeaderTitle from '@/js/googlesitekit/widgets/components/WidgetHeaderTitle';
import {
	PrimaryActionSection,
	PrimaryActionSectionLoading,
} from '@/js/modules/analytics-4/components/site-goals/PrimaryActionSection';
import type { WidgetComponentProps } from '@/js/googlesitekit/widgets/util/get-widget-component-props';

type ReportRow = {
	dimensionValues?: Array< { value: string } >;
	metricValues?: Array< { value: string } >;
};

function makeFind( dateRangeSlug: string, dimensionIndex: number ) {
	return ( row: ReportRow ) =>
		row?.dimensionValues?.[ dimensionIndex ]?.value === dateRangeSlug;
}

const LeadGenerationPerformanceWidget: FC< WidgetComponentProps > = (
	props
) => {
	const { Widget, WidgetNull, WidgetReportError } = props;

	const detectedLeadEvents = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents(),
		[]
	);

	const hasLeadEvents = !! detectedLeadEvents?.length;

	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} ),
		[]
	);

	const eventsOptions = {
		...dates,
		metrics: [ { name: 'eventCount' } ],
		dimensions: [ 'eventName' ],
		dimensionFilters: {
			eventName: {
				filterType: 'inListFilter',
				value: detectedLeadEvents || [],
			},
		},
		reportID:
			'analytics-4_lead-generation-performance-widget_widget_leadEventsReportOptions',
	};

	const leadEventsReport = useInViewSelect(
		( select: Select ) =>
			hasLeadEvents
				? select( MODULES_ANALYTICS_4 ).getReport( eventsOptions )
				: undefined,
		[ hasLeadEvents, eventsOptions ]
	);

	const loading = useSelect(
		( select: Select ) =>
			hasLeadEvents
				? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getReport',
						[ eventsOptions ]
				  )
				: undefined,
		[]
	);

	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
				eventsOptions,
			] ),
		[]
	);

	if ( ! hasLeadEvents ) {
		return <WidgetNull />;
	}

	const { rows: leadEventRows = [] } = leadEventsReport || {};

	// Aggregate eventCount across all detected lead events per date range.
	// dateRange is at dimensionValues[1] since eventName is at [0].
	const currentPrimaryCount = ( leadEventRows as ReportRow[] )
		.filter( makeFind( 'date_range_0', 1 ) )
		.reduce(
			( sum, row ) =>
				sum +
				( parseInt( row?.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0 ),
			0
		);

	const previousPrimaryCount = ( leadEventRows as ReportRow[] )
		.filter( makeFind( 'date_range_1', 1 ) )
		.reduce(
			( sum, row ) =>
				sum +
				( parseInt( row?.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0 ),
			0
		);

	return (
		<Widget>
			<WidgetHeaderTitle
				title={ __( 'Lead generation performance', 'google-site-kit' ) }
			/>

			{ loading && <PrimaryActionSectionLoading /> }

			{ ! loading && error && (
				<WidgetReportError moduleSlug="analytics-4" error={ error } />
			) }

			{ ! loading && ! error && (
				<PrimaryActionSection
					ErrorComponent={ WidgetReportError }
					currentCount={ currentPrimaryCount }
					previousCount={ previousPrimaryCount }
					currentLabel={ __(
						'Form completion rate',
						'google-site-kit'
					) }
					previousLabel={ __(
						'Total form completions',
						'google-site-kit'
					) }
				/>
			) }
		</Widget>
	);
};

export default LeadGenerationPerformanceWidget;
