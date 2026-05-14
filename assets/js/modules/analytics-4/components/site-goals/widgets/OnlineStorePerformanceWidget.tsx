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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Fragment, createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect, Select } from 'googlesitekit-data';
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
import type {
	Report,
	ReportRow,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import {
	NUMBER_FORMAT,
	PERCENT_FORMAT,
} from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';

const EVENT_RATE_LABELS = {
	purchase: __( 'Sales Rate', 'google-site-kit' ),
	add_to_cart: __( 'Add to Cart Rate', 'google-site-kit' ),
};

const EVENT_TOTAL_LABELS = {
	purchase: __( 'Total Sales', 'google-site-kit' ),
	add_to_cart: __( 'Total products added to cart', 'google-site-kit' ),
};

function processSecondaryEventsReport(
	secondaryEventsReport: Report | undefined,
	secondaryEvents: ( keyof typeof EVENT_TOTAL_LABELS )[]
) {
	if ( ! secondaryEventsReport || ! secondaryEvents.length ) {
		return [];
	}

	const { rows = [] } = secondaryEventsReport;

	return secondaryEvents.map( ( eventName ) => ( {
		eventName,
		label: EVENT_TOTAL_LABELS[ eventName ] || eventName,
		currentCount:
			parseInt(
				( rows as ReportRow[] ).find(
					( row ) =>
						row?.dimensionValues?.[ 0 ]?.value === eventName &&
						row?.dimensionValues?.[ 1 ]?.value === 'date_range_0'
				)?.metricValues?.[ 0 ]?.value ?? '',
				10
			) || 0,
		previousCount:
			parseInt(
				( rows as ReportRow[] ).find(
					( row ) =>
						row?.dimensionValues?.[ 0 ]?.value === eventName &&
						row?.dimensionValues?.[ 1 ]?.value === 'date_range_1'
				)?.metricValues?.[ 0 ]?.value ?? '',
				10
			) || 0,
	} ) );
}

const OnlineStorePerformanceWidget: FC< WidgetComponentProps > = ( {
	Widget,
	WidgetNull,
	WidgetReportError,
} ) => {
	const primaryEvent: keyof typeof EVENT_TOTAL_LABELS | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPrimaryEcommerceEvent(),
		[]
	);

	const secondaryEcommerceEvents: ( keyof typeof EVENT_TOTAL_LABELS )[] =
		useSelect(
			( select: Select ) =>
				primaryEvent
					? select( MODULES_ANALYTICS_4 ).getSecondaryEcommerceEvents(
							primaryEvent
					  )
					: [],
			[ primaryEvent ]
		);

	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} ),
		[]
	);

	const reportOptions: ReportOptions[] = [];

	if ( primaryEvent ) {
		reportOptions.push( {
			...dates,
			metrics: [ { name: 'eventCount' } ],
			dimensions: [ { name: 'eventName' } ],
			dimensionFilters: {
				eventName: primaryEvent,
			},
			reportID:
				'analytics-4_online-store-performance-widget_primaryEventReportOptions',
		} );

		reportOptions.push( {
			...dates,
			metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
			reportID: 'analytics-4_site-goals_engagementReportOptions',
		} );
	}

	if ( secondaryEcommerceEvents?.length ) {
		reportOptions.push( {
			...dates,
			metrics: [ { name: 'eventCount' } ],
			dimensions: [ { name: 'eventName' } ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: secondaryEcommerceEvents,
				},
			},
			reportID:
				'analytics-4_online-store-performance-widget_secondaryEventsReportOptions',
		} );
	}

	const [ primaryEventReport, engagementReport, secondaryEventsReport ] =
		useInViewSelect(
			( select: Select ) =>
				reportOptions.map( ( options ) =>
					select( MODULES_ANALYTICS_4 ).getReport( options )
				),
			// Passing reportOptions directly as an array causes errors because
			// the array size changes—which is not allowed.
			//
			// So we wrap it in an object to ensure the array size remains
			// consistent between renders.
			[ { reportOptions } ]
		) || [];

	const [ loading, error ] = useSelect(
		( select: Select ) => [
			select( MODULES_ANALYTICS_4 ).areReportsLoading( ...reportOptions ),
			select( MODULES_ANALYTICS_4 ).getFirstReportError(
				...reportOptions
			),
		],
		// Passing reportOptions directly as an array causes errors because
		// the array size changes—which is not allowed.
		//
		// So we wrap it in an object to ensure the array size remains
		// consistent between renders.
		[ { reportOptions } ]
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
		currentEngagementRate,
		previousEngagementRate,
	} = processReports( primaryEventReport, engagementReport );

	const secondaryEventTiles = processSecondaryEventsReport(
		secondaryEventsReport,
		secondaryEcommerceEvents || []
	);

	return (
		<Widget
			Header={ WidgetHeaderTitle }
			headerContents={ __(
				'Online Store Performance',
				'google-site-kit'
			) }
			collapsible
		>
			{ loading && <PreviewBlock width="100%" height="100px" /> }

			{ ! loading && ! error && (
				<Fragment>
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
											// TODO: Update the link to the relevant support URL once it's created.
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

					<TilesGroup
						className="googlesitekit-site-goals-visitor-engagement"
						title={ __(
							'How are your visitors engaging?',
							'google-site-kit'
						) }
					>
						<Tile
							title={ __( 'Engagement rate', 'google-site-kit' ) }
							subtitle={ sprintf(
								/* translators: %s: formatted number of total sessions */
								__( '%s total sessions', 'google-site-kit' ),
								numFmt( currentSessions, NUMBER_FORMAT )
							) }
							currentValue={ currentEngagementRate }
							previousValue={ previousEngagementRate }
							format={ PERCENT_FORMAT }
						/>
						{ secondaryEventTiles.map(
							( {
								eventName,
								label,
								currentCount,
								previousCount,
							} ) => (
								<Tile
									key={ eventName }
									title={ label }
									subtitle={ sprintf(
										/* translators: %s: GA4 event name */
										__( '“%s” events', 'google-site-kit' ),
										eventName
									) }
									currentValue={ currentCount }
									previousValue={ previousCount }
									format={ NUMBER_FORMAT }
								/>
							)
						) }
					</TilesGroup>
				</Fragment>
			) }
		</Widget>
	);
};

export default OnlineStorePerformanceWidget;
