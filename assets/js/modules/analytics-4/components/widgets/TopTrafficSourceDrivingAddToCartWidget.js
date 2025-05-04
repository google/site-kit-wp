/**
 * TopTrafficSourceDrivingAddToCartWidget component.
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
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
} from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
	ENUM_CONVERSION_EVENTS,
} from '../../datastore/constants';
import { numFmt } from '../../../../util';
import { get } from 'lodash';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

function TopTrafficSourceDrivingAddToCartWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const detectedEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getDetectedEvents()
	);
	const hasDetectedEvent = detectedEvents?.includes(
		ENUM_CONVERSION_EVENTS.ADD_TO_CART
	);

	const totalAddToCartReportOptions = {
		...dates,
		metrics: [
			{
				name: 'addToCarts',
			},
		],
	};

	const trafficSourceReportOptions = {
		...dates,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		metrics: [
			{
				name: 'addToCarts',
			},
		],
		limit: 1,
		orderBy: 'addToCarts',
	};

	const totalAddToCartReport = useInViewSelect(
		( select ) =>
			hasDetectedEvent
				? select( MODULES_ANALYTICS_4 ).getReport(
						totalAddToCartReportOptions
				  )
				: undefined,
		[ hasDetectedEvent, totalAddToCartReportOptions ]
	);

	const trafficSourceReport = useInViewSelect(
		( select ) =>
			hasDetectedEvent
				? select( MODULES_ANALYTICS_4 ).getReport(
						trafficSourceReportOptions
				  )
				: undefined,
		[ hasDetectedEvent, trafficSourceReportOptions ]
	);

	const error = useSelect( ( select ) => {
		const trafficSourceReportErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ trafficSourceReportOptions ] );

		const totalAddToCartReportErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ totalAddToCartReportOptions ] );

		if ( trafficSourceReportErrors && totalAddToCartReportErrors ) {
			return [ trafficSourceReportErrors, totalAddToCartReportErrors ];
		}

		return (
			trafficSourceReportErrors || totalAddToCartReportErrors || undefined
		);
	} );

	const loading = useSelect( ( select ) =>
		hasDetectedEvent
			? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ totalAddToCartReportOptions ]
			  ) ||
			  ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ trafficSourceReportOptions ]
			  )
			: undefined
	);

	const makeFilter = ( dateRange, dimensionIndex ) => ( row ) =>
		get( row, `dimensionValues.${ dimensionIndex }.value` ) === dateRange;

	// Prevents running a filter on `report.rows` which could be undefined.
	const { rows: totalAddToCartReportRows = [] } = totalAddToCartReport || {};
	const { rows: trafficSourceReportRows = [] } = trafficSourceReport || {};

	const topTrafficSource =
		trafficSourceReportRows.filter( makeFilter( 'date_range_0', 1 ) )[ 0 ]
			?.dimensionValues?.[ 0 ].value || '-';

	const currentTotalAddToCart =
		parseInt(
			totalAddToCartReportRows.filter(
				makeFilter( 'date_range_0', 0 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;

	const currentTopTrafficSourceAddToCart =
		parseInt(
			trafficSourceReportRows.filter(
				makeFilter( 'date_range_0', 1 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const relativeCurrentTopTrafficSourceAddToCart = currentTotalAddToCart
		? currentTopTrafficSourceAddToCart / currentTotalAddToCart
		: 0;

	const previousTotalAddToCart =
		parseInt(
			totalAddToCartReportRows.filter(
				makeFilter( 'date_range_1', 0 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;

	const previousTopTrafficSourceAddToCart =
		parseInt(
			trafficSourceReportRows.filter(
				makeFilter( 'date_range_1', 1 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const relativePreviousTopTrafficSourceAddToCart = previousTotalAddToCart
		? previousTopTrafficSourceAddToCart / previousTotalAddToCart
		: 0;

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return (
		<MetricTileText
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART }
			metricValue={ topTrafficSource }
			metricValueFormat={ format }
			subText={ sprintf(
				/* translators: %s: Percentage of add to carts for the current top traffic source compared to the number of total add to carts for all traffic sources. */
				__( '%s of total add to carts', 'google-site-kit' ),
				numFmt( relativeCurrentTopTrafficSourceAddToCart, format )
			) }
			previousValue={ relativePreviousTopTrafficSourceAddToCart }
			currentValue={ relativeCurrentTopTrafficSourceAddToCart }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopTrafficSourceDrivingAddToCartWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopTrafficSourceDrivingAddToCartWidget );
