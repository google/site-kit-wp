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

const EVENT_RATE_LABELS: Record< string, string > = {
	purchase: __( 'Sales Rate', 'google-site-kit' ),
	add_to_cart: __( 'Add to Cart Rate', 'google-site-kit' ),
};

const EVENT_TOTAL_LABELS: Record< string, string > = {
	purchase: __( 'Total Sales', 'google-site-kit' ),
	add_to_cart: __( 'Total products added to cart', 'google-site-kit' ),
};

const REPORT_METRIC_NAMES: Record< string, string > = {
	purchase: 'ecommercePurchases',
	add_to_cart: 'addToCarts',
};

function makeFind( dateRangeSlug: string, dimensionIndex: number ) {
	return ( row: ReportRow ) =>
		row?.dimensionValues?.[ dimensionIndex ]?.value === dateRangeSlug;
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
		metrics: [ { name: REPORT_METRIC_NAMES[ primaryEvent ] } ],
		reportID:
			'analytics-4_online-store-performance-widget_widget_primaryEventReportOptions',
	};

	const primaryEventReport = useInViewSelect(
		( select: Select ) =>
			primaryEvent
				? select( MODULES_ANALYTICS_4 ).getReport( eventOptions )
				: undefined,
		[ primaryEvent, eventOptions ]
	);

	const loading = useSelect(
		( select: Select ) =>
			primaryEvent
				? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getReport',
						[ eventOptions ]
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
				  )
				: undefined,
		[]
	);

	if ( ! primaryEvent ) {
		return <WidgetNull />;
	}

	const { rows: primaryEventRows = [] } = primaryEventReport || {};

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

	return (
		<Widget>
			<WidgetHeaderTitle
				title={ __( 'Online store performance', 'google-site-kit' ) }
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
					currentLabel={
						EVENT_RATE_LABELS[ primaryEvent ] ||
						__( 'Unknown Event', 'google-site-kit' )
					}
					previousLabel={
						EVENT_TOTAL_LABELS[ primaryEvent ] ||
						__( 'Unknown Event', 'google-site-kit' )
					}
				/>
			) }
		</Widget>
	);
};

export default OnlineStorePerformanceWidget;
