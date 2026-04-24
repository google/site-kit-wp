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
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect, type Select } from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { numFmt } from '@/js/util';
import type { WidgetComponentProps } from '@/js/googlesitekit/widgets/util/get-widget-component-props';
import WidgetHeaderTitle from '@/js/googlesitekit/widgets/components/WidgetHeaderTitle';
import PreviewBlock from '@/js/components/PreviewBlock';
import { TilesGroup } from '@/js/modules/analytics-4/components/site-goals/components/TilesGroup';
import { Tile } from '@/js/modules/analytics-4/components/site-goals/components/Tile';

type ReportRow = {
	dimensionValues?: Array< { value: string } >;
	metricValues?: Array< { value: string } >;
};

type Report = {
	rows: ReportRow[];
	totals: ReportRow[];
};

const PERCENT_FORMAT = {
	style: 'percent' as const,
	signDisplay: 'never' as const,
	maximumFractionDigits: 1,
};

const NUMBER_FORMAT = {
	style: 'decimal' as const,
};

function makeFind( dateRangeSlug: string, dimensionIndex: number ) {
	return ( row: ReportRow ) =>
		row?.dimensionValues?.[ dimensionIndex ]?.value === dateRangeSlug;
}

function processReports( eventsReport: Report, sessionsReport: Report ) {
	const { rows: leadEventRows = [] } = eventsReport || {};
	const { totals: sessionsRows = [] } = sessionsReport || {};

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

	// Get session counts.
	const currentSessions =
		parseInt(
			( sessionsRows as ReportRow[] ).find(
				makeFind( 'date_range_0', 0 )
			)?.metricValues?.[ 0 ]?.value ?? '',
			10
		) || 0;

	const previousSessions =
		parseInt(
			( sessionsRows as ReportRow[] ).find(
				makeFind( 'date_range_1', 0 )
			)?.metricValues?.[ 0 ]?.value ?? '',
			10
		) || 0;

	const currentRate =
		currentSessions === 0 ? 0 : currentPrimaryCount / currentSessions;
	const previousRate =
		previousSessions === 0 ? 0 : previousPrimaryCount / previousSessions;
	return {
		currentRate,
		previousRate,
		currentPrimaryCount,
		previousPrimaryCount,
		currentSessions,
	};
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

	const sessionsOptions = {
		...dates,
		metrics: [ { name: 'sessions' } ],
		reportID: 'analytics-4_site-goals_sessionsReportOptions',
	};

	const [ leadEventsReport, sessionsReport ] = useInViewSelect(
		( select: Select ) => {
			if ( ! hasLeadEvents ) {
				return [];
			}

			return [
				select( MODULES_ANALYTICS_4 ).getReport( eventsOptions ),
				select( MODULES_ANALYTICS_4 ).getReport( sessionsOptions ),
			];
		},
		[ hasLeadEvents, eventsOptions, sessionsOptions ]
	);

	const loading = useSelect(
		( select: Select ) =>
			hasLeadEvents
				? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getReport',
						[ eventsOptions ]
				  ) ||
				  ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getReport',
						[ sessionsOptions ]
				  )
				: undefined,
		[]
	);

	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
				eventsOptions,
			] ) ||
			select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
				sessionsOptions,
			] ),
		[]
	);

	if ( ! hasLeadEvents ) {
		return <WidgetNull />;
	}

	if ( error ) {
		return (
			<Widget>
				<WidgetReportError moduleSlug="analytics-4" error={ error } />
			</Widget>
		);
	}

	const {
		currentPrimaryCount,
		previousPrimaryCount,
		currentSessions,
		currentRate,
		previousRate,
	} = processReports( leadEventsReport, sessionsReport );

	return (
		<Widget>
			{ ! error && (
				<WidgetHeaderTitle
					title={ __(
						'Lead generation performance',
						'google-site-kit'
					) }
				/>
			) }

			{ loading && <PreviewBlock width="100%" height="100px" /> }

			{ ! loading && (
				<TilesGroup
					className="googlesitekit-site-goals-primary-action"
					title={ __( 'Key action', 'google-site-kit' ) }
				>
					<Tile
						title={ __(
							'Form completion rate',
							'google-site-kit'
						) }
						subtitle={ sprintf(
							/* translators: %s: formatted number of total sessions */
							__( '%s total sessions', 'google-site-kit' ),
							numFmt( currentSessions, NUMBER_FORMAT )
						) }
						currentValue={ currentRate }
						previousValue={ previousRate }
						format={ PERCENT_FORMAT }
						primary
					/>

					<Tile
						title={ __(
							'Total form completions',
							'google-site-kit'
						) }
						subtitle={
							detectedLeadEvents.length === 1
								? sprintf(
										/* translators: %s: GA4 event name */
										__( '"%s" events', 'google-site-kit' ),
										detectedLeadEvents[ 0 ]
								  )
								: sprintf(
										/* translators: %d: number of detected event types */
										_n(
											'%d event type',
											'%d event types',
											detectedLeadEvents.length,
											'google-site-kit'
										),
										detectedLeadEvents.length
								  )
						}
						currentValue={ currentPrimaryCount }
						previousValue={ previousPrimaryCount }
						format={ NUMBER_FORMAT }
					/>
				</TilesGroup>
			) }
		</Widget>
	);
};

export default LeadGenerationPerformanceWidget;
