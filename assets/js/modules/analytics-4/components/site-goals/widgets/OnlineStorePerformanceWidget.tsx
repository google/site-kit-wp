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
import { __, sprintf } from '@wordpress/i18n';

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
import { createInterpolateElement } from '@wordpress/element';

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

const EVENT_RATE_LABELS: Record< string, string > = {
	purchase: __( 'Sales Rate', 'google-site-kit' ),
	add_to_cart: __( 'Add to Cart Rate', 'google-site-kit' ),
};

const EVENT_TOTAL_LABELS: Record< string, string > = {
	purchase: __( 'Total Sales', 'google-site-kit' ),
	add_to_cart: __( 'Total products added to cart', 'google-site-kit' ),
};

function makeFind( dateRangeSlug: string, dimensionIndex: number ) {
	return ( row: ReportRow ) =>
		row?.dimensionValues?.[ dimensionIndex ]?.value === dateRangeSlug;
}

function processReports( eventsReport: Report, sessionsReport: Report ) {
	const { rows: primaryEventRows = [] } = eventsReport || {};
	const { totals: sessionsRows = [] } = sessionsReport || {};

	// dateRange is at dimensionValues[1] since eventName is at [0].
	const currentPrimaryCount =
		parseInt(
			( primaryEventRows as ReportRow[] ).find(
				makeFind( 'date_range_0', 1 )
			)?.metricValues?.[ 0 ]?.value ?? '',
			10
		) || 0;

	const previousPrimaryCount =
		parseInt(
			( primaryEventRows as ReportRow[] ).find(
				makeFind( 'date_range_1', 1 )
			)?.metricValues?.[ 0 ]?.value ?? '',
			10
		) || 0;

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

const OnlineStorePerformanceWidget: FC< WidgetComponentProps > = ( props ) => {
	const { Widget, WidgetNull, WidgetReportError } = props;

	const primaryEvent: string = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPrimaryEcommerceEvent(),
		[]
	);

	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} ),
		[]
	);

	const eventOptions = {
		...dates,
		metrics: [ { name: 'eventCount' } ],
		dimensions: [ { name: 'eventName' } ],
		dimensionFilters: {
			eventName: primaryEvent,
		},
		reportID:
			'analytics-4_online-store-performance-widget_primaryEventReportOptions',
	};

	const sessionsOptions = {
		...dates,
		metrics: [ { name: 'sessions' } ],
		reportID: 'analytics-4_site-goals_sessionsReportOptions',
	};

	const [ primaryEventReport, sessionsReport ] = useInViewSelect(
		( select: Select ) =>
			primaryEvent
				? [
						select( MODULES_ANALYTICS_4 ).getReport( eventOptions ),
						select( MODULES_ANALYTICS_4 ).getReport(
							sessionsOptions
						),
				  ]
				: [],
		[ primaryEvent, eventOptions, sessionsOptions ]
	);

	const loading = useSelect(
		( select: Select ) =>
			primaryEvent
				? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getReport',
						[ eventOptions ]
				  ) ||
				  ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getReport',
						[ sessionsOptions ]
				  )
				: undefined,
		[ primaryEvent, eventOptions ]
	);

	const error = useSelect(
		( select: Select ) =>
			primaryEvent
				? select( MODULES_ANALYTICS_4 ).getErrorForSelector(
						'getReport',
						[ eventOptions ]
				  ) ||
				  select( MODULES_ANALYTICS_4 ).getErrorForSelector(
						'getReport',
						[ sessionsOptions ]
				  )
				: undefined,
		[]
	);

	if ( ! primaryEvent ) {
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
	} = processReports( primaryEventReport, sessionsReport );

	return (
		<Widget>
			<WidgetHeaderTitle
				title={ __( 'Online store performance', 'google-site-kit' ) }
			/>

			{ loading && <PreviewBlock width="100%" height="100px" /> }

			{ ! loading && ! error && (
				<TilesGroup
					className="googlesitekit-site-goals-primary-action"
					title={ __( 'Key action', 'google-site-kit' ) }
				>
					<Tile
						title={
							EVENT_RATE_LABELS[ primaryEvent ] ||
							__( 'Unknown Event', 'google-site-kit' )
						}
						subtitle={ sprintf(
							/* translators: %s: formatted number of total sessions */
							__( '%s total sessions', 'google-site-kit' ),
							numFmt( currentSessions, NUMBER_FORMAT )
						) }
						infoTooltip={ createInterpolateElement(
							__(
								'The percentage of total visitors who successfully completed a key action (like making a purchase or filling out a form). <a>Learn more</a>',
								'google-site-kit'
							),
							{
								a: (
									// eslint-disable-next-line
									<a
										href="#"
										target="_blank"
										rel="noreferrer noopener"
									/>
								),
							}
						) }
						currentValue={ currentRate }
						previousValue={ previousRate }
						format={ PERCENT_FORMAT }
						primary
					/>

					<Tile
						title={
							EVENT_TOTAL_LABELS[ primaryEvent ] ||
							__( 'Unknown Event', 'google-site-kit' )
						}
						subtitle={ sprintf(
							/* translators: %s: GA4 event name */
							__( '“%s” events', 'google-site-kit' ),
							primaryEvent
						) }
						currentValue={ currentPrimaryCount }
						previousValue={ previousPrimaryCount }
						format={ NUMBER_FORMAT }
					/>
				</TilesGroup>
			) }
		</Widget>
	);
};

export default OnlineStorePerformanceWidget;
