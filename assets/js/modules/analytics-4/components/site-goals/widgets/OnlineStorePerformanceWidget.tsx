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
import { createInterpolateElement } from '@wordpress/element';

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
import {
	GOAL_DRIVER_IDS,
	GOAL_TYPES,
	GoalDriversSection,
	useGoalDriversData,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import {
	NUMBER_FORMAT,
	PERCENT_FORMAT,
} from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';

// TODO: Replace hardcoded selected drivers with datastore-backed selection in #12578.
const DEFAULT_SELECTED_GOAL_DRIVER_IDS = [
	GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
	GOAL_DRIVER_IDS.TOP_PAGES,
	GOAL_DRIVER_IDS.VISITOR_TYPE,
];

const EVENT_RATE_LABELS = {
	purchase: __( 'Sales Rate', 'google-site-kit' ),
	add_to_cart: __( 'Add to Cart Rate', 'google-site-kit' ),
};

const EVENT_TOTAL_LABELS = {
	purchase: __( 'Total Sales', 'google-site-kit' ),
	add_to_cart: __( 'Total products added to cart', 'google-site-kit' ),
};

const OnlineStorePerformanceWidget: FC< WidgetComponentProps > = ( {
	Widget,
	WidgetNull,
	WidgetReportError,
} ) => {
	const primaryEvent: 'purchase' | 'add_to_cart' | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPrimaryEcommerceEvent(),
		[]
	);
	const { drivers, hasExpandableRows } = useGoalDriversData( {
		goalType: GOAL_TYPES.ECOMMERCE,
		primaryEvent,
		selectedDriverIDs: DEFAULT_SELECTED_GOAL_DRIVER_IDS,
	} );

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

	const [ primaryEventReport, engagementReport ] =
		useInViewSelect(
			( select: Select ) =>
				reportOptions.map( ( options ) =>
					select( MODULES_ANALYTICS_4 ).getReport( options )
				),
			reportOptions
		) || [];

	const [ loading, error ] = useSelect(
		( select: Select ) => [
			select( MODULES_ANALYTICS_4 ).areReportsLoading( ...reportOptions ),
			select( MODULES_ANALYTICS_4 ).getFirstReportError(
				...reportOptions
			),
		],
		reportOptions
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
	} = processReports( primaryEventReport, engagementReport );

	return (
		<Widget>
			<WidgetHeaderTitle
				title={ __( 'Online store performance', 'google-site-kit' ) }
			/>

			{ loading && <PreviewBlock width="100%" height="100px" /> }

			{ ! loading && (
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

			<GoalDriversSection
				drivers={ drivers }
				hasExpandableRows={ hasExpandableRows }
				goalType={ GOAL_TYPES.ECOMMERCE }
			/>
		</Widget>
	);
};

export default OnlineStorePerformanceWidget;
