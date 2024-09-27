/**
 * TopTrafficSourceDrivingPurchasesWidget component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import MetricTileText from '../../../../components/KeyMetrics/MetricTileText';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
} from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { numFmt } from '../../../../util';
import { get } from 'lodash';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

function TopTrafficSourceDrivingPurchasesWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const detectedEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getDetectedEvents()
	);
	const hasDetectedEvent = detectedEvents?.includes( 'purchase' );

	const totalPurchasesReportOptions = {
		...dates,
		metrics: [
			{
				name: 'ecommercePurchases',
			},
		],
	};

	const trafficSourceReportOptions = {
		...dates,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		metrics: [
			{
				name: 'ecommercePurchases',
			},
		],
		limit: 1,
		orderBy: 'ecommercePurchases',
	};

	const totalPurchasesReport = useInViewSelect(
		( select ) =>
			hasDetectedEvent
				? select( MODULES_ANALYTICS_4 ).getReport(
						totalPurchasesReportOptions
				  )
				: undefined,
		[ hasDetectedEvent, totalPurchasesReportOptions ]
	);
	// ecommercePurchases metric will always be assigned a value, unlike most
	// other metrics, where rows would be empty if there is no data, ecommercePurchases
	// will assign value `0` for each date range if there is no event data. So we need
	// to verify that value is non-zero for one of the rows, to allow report request for
	// traffic source. Otherwise zero data will be incorrectly displayed, showing zero for
	// purchases and comparison, but still include the traffic source.
	const hasPurchases = totalPurchasesReport?.rows
		? totalPurchasesReport?.rows?.[ 0 ]?.metricValues?.[ 0 ]?.value > 0 ||
		  totalPurchasesReport?.rows?.[ 1 ]?.metricValues?.[ 0 ]?.value > 0
		: false;

	const trafficSourceReport = useInViewSelect(
		( select ) =>
			hasDetectedEvent && hasPurchases
				? select( MODULES_ANALYTICS_4 ).getReport(
						trafficSourceReportOptions
				  )
				: undefined,
		[ hasDetectedEvent, hasPurchases, trafficSourceReportOptions ]
	);

	const error = useSelect( ( select ) => {
		const trafficSourceReportErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ trafficSourceReportOptions ] );

		const totalPurchasesReportErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ totalPurchasesReportOptions ] );

		if ( trafficSourceReportErrors && totalPurchasesReportErrors ) {
			return [ trafficSourceReportErrors, totalPurchasesReportErrors ];
		}

		return (
			trafficSourceReportErrors || totalPurchasesReportErrors || undefined
		);
	} );

	const loading = useSelect( ( select ) =>
		hasDetectedEvent
			? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ totalPurchasesReportOptions ]
			  ) ||
			  ( ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ trafficSourceReportOptions ]
			  ) &&
					hasPurchases )
			: undefined
	);

	const makeFilter = ( dateRange, dimensionIndex ) => ( row ) =>
		get( row, `dimensionValues.${ dimensionIndex }.value` ) === dateRange;

	// Prevents running a filter on `report.rows` which could be undefined.
	const { rows: totalPurchasesReportRows = [] } = totalPurchasesReport || {};
	const { rows: trafficSourceReportRows = [] } = trafficSourceReport || {};

	const topTrafficSource =
		trafficSourceReportRows.filter( makeFilter( 'date_range_0', 1 ) )[ 0 ]
			?.dimensionValues?.[ 0 ].value || '-';

	const currentTotalPurchases =
		parseInt(
			totalPurchasesReportRows.filter(
				makeFilter( 'date_range_0', 0 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;

	const currentTopTrafficSourcePurchases =
		parseInt(
			trafficSourceReportRows.filter(
				makeFilter( 'date_range_0', 1 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const relativeCurrentTopTrafficSourcePurchases = currentTotalPurchases
		? currentTopTrafficSourcePurchases / currentTotalPurchases
		: 0;

	const previousTotalPurchases =
		parseInt(
			totalPurchasesReportRows.filter(
				makeFilter( 'date_range_1', 0 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;

	const previousTopTrafficSourcePurchases =
		parseInt(
			trafficSourceReportRows.filter(
				makeFilter( 'date_range_1', 1 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;

	const relativePreviousTopTrafficSourcePurchases = previousTotalPurchases
		? previousTopTrafficSourcePurchases / previousTotalPurchases
		: 0;

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return (
		<MetricTileText
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES }
			metricValue={ topTrafficSource }
			metricValueFormat={ format }
			subText={
				// eslint-disable-next-line @wordpress/valid-sprintf
				sprintf(
					/* translators: %s: Percentage of purchases for the current top traffic source compared to the number of total purchases for all traffic sources. */
					__( '%s of total purchases', 'google-site-kit' ),
					numFmt( relativeCurrentTopTrafficSourcePurchases, format )
				)
			}
			previousValue={ relativePreviousTopTrafficSourcePurchases }
			currentValue={ relativeCurrentTopTrafficSourcePurchases }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopTrafficSourceDrivingPurchasesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopTrafficSourceDrivingPurchasesWidget );
