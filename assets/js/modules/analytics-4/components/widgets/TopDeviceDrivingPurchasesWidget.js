/**
 * TopDeviceDrivingPurchases component.
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
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
} from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { numFmt } from '../../../../util';
import { get } from 'lodash';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

function TopDeviceDrivingPurchases( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const totalPurchasesReportOptions = {
		...dates,
		metrics: [
			{
				name: 'ecommercePurchases',
			},
		],
	};

	const deviceReportOptions = {
		...dates,
		dimensions: [ 'deviceCategory' ],
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
			select( MODULES_ANALYTICS_4 ).getReport(
				totalPurchasesReportOptions
			),
		[ totalPurchasesReportOptions ]
	);

	const deviceReport = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getReport( deviceReportOptions ),
		[ deviceReportOptions ]
	);

	const error = useSelect( ( select ) => {
		const deviceReportErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ deviceReportOptions ] );

		const totalPurchasesReportErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ totalPurchasesReportOptions ] );

		if ( deviceReportErrors && totalPurchasesReportErrors ) {
			return [ deviceReportErrors, totalPurchasesReportErrors ];
		}

		return deviceReportErrors || totalPurchasesReportErrors || undefined;
	} );

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ totalPurchasesReportOptions ]
			) ||
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ deviceReportOptions ]
			)
	);

	const makeFilter = ( dateRange, dimensionIndex ) => ( row ) =>
		get( row, `dimensionValues.${ dimensionIndex }.value` ) === dateRange;

	// Prevents running a filter on `report.rows` which could be undefined.
	const { rows: totalPurchasesReportRows = [] } = totalPurchasesReport || {};
	const { rows: deviceReportRows = [] } = deviceReport || {};

	const topDevice =
		deviceReportRows.filter( makeFilter( 'date_range_0', 1 ) )[ 0 ]
			?.dimensionValues?.[ 0 ].value || '-';

	const currentTotalPurchasers =
		parseInt(
			totalPurchasesReportRows.filter(
				makeFilter( 'date_range_0', 0 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const currentTopDevicePurchasers =
		parseInt(
			deviceReportRows.filter( makeFilter( 'date_range_0', 1 ) )[ 0 ]
				?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const relativeCurrentTopDevicePurchasers = currentTotalPurchasers
		? currentTopDevicePurchasers / currentTotalPurchasers
		: 0;

	const previousTotalPurchasers =
		parseInt(
			totalPurchasesReportRows.filter(
				makeFilter( 'date_range_1', 0 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const previousTopDevicePurchasers =
		parseInt(
			deviceReportRows.filter( makeFilter( 'date_range_1', 1 ) )[ 0 ]
				?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const relativePreviousTopDevicePurchasers = previousTotalPurchasers
		? previousTopDevicePurchasers / previousTotalPurchasers
		: 0;

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return (
		<MetricTileText
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES }
			metricValue={ topDevice }
			metricValueFormat={ format }
			subText={
				// eslint-disable-next-line @wordpress/valid-sprintf
				sprintf(
					/* translators: %d: Percentage of purchases for the current top device compared to the number of purchases for all devices. */
					__( '%s of total purchases', 'google-site-kit' ),
					numFmt( relativeCurrentTopDevicePurchasers, format )
				)
			}
			previousValue={ relativePreviousTopDevicePurchasers }
			currentValue={ relativeCurrentTopDevicePurchasers }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopDeviceDrivingPurchases.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopDeviceDrivingPurchases );
