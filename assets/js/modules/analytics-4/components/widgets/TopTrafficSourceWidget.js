/**
 * TopTrafficSourceWidget component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { get } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import MetricTileText from '@/js/components/KeyMetrics/MetricTileText';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
} from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { numFmt } from '@/js/util';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

/**
 * Builds the Analytics 4 report options for the Top Traffic Source metric.
 *
 * Returns both the total-users report and the per-channel report the tile
 * combines. Both this widget and the metric's PDF tile import this, so the
 * dashboard tile and the report request the same data.
 *
 * @since n.e.x.t
 *
 * @param {Object} dates The date range, including the compare dates.
 * @return {Object} The `totalUsers` and `trafficSource` `getReport` options.
 */
export function getTopTrafficSourceReportOptions( dates ) {
	return {
		totalUsers: {
			...dates,
			metrics: [
				{
					name: 'totalUsers',
				},
			],
			reportID:
				'analytics-4_top-traffic-source-widget_widget_totalUsersReportOptions',
		},
		trafficSource: {
			...dates,
			dimensions: [ 'sessionDefaultChannelGroup' ],
			metrics: [
				{
					name: 'totalUsers',
				},
			],
			limit: 1,
			orderBy: 'totalUsers',
			reportID:
				'analytics-4_top-traffic-source-widget_widget_trafficSourceReportOptions',
		},
	};
}

/**
 * Builds the sub-text for the Top Traffic Source metric tile.
 *
 * Both this widget and the metric's PDF tile import this, so the dashboard tile
 * and the PDF tile show the same sub-text.
 *
 * @since n.e.x.t
 *
 * @param {number} rate The relative share of total traffic for the top source.
 * @return {string} The metric tile sub-text.
 */
export function getTopTrafficSourceSubtext( rate ) {
	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return sprintf(
		/* translators: %s: Percentage of users for the current top traffic source compared to the number of total users for all traffic sources. */
		__( '%s of total traffic', 'google-site-kit' ),
		numFmt( rate, format )
	);
}

function TopTrafficSourceWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} )
	);

	const {
		totalUsers: totalUsersReportOptions,
		trafficSource: trafficSourceReportOptions,
	} = getTopTrafficSourceReportOptions( dates );

	const totalUsersReport = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getReport( totalUsersReportOptions ),
		[ totalUsersReportOptions ]
	);

	const trafficSourceReport = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getReport(
				trafficSourceReportOptions
			),
		[ trafficSourceReportOptions ]
	);

	const error = useSelect( ( select ) => {
		const trafficSourceReportErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ trafficSourceReportOptions ] );

		const totalUsersReportErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ totalUsersReportOptions ] );

		if ( trafficSourceReportErrors && totalUsersReportErrors ) {
			return [ trafficSourceReportErrors, totalUsersReportErrors ];
		}

		return trafficSourceReportErrors || totalUsersReportErrors || undefined;
	} );

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ totalUsersReportOptions ]
			) ||
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ trafficSourceReportOptions ]
			)
	);

	function makeFilter( dateRange, dimensionIndex ) {
		return ( row ) =>
			get( row, `dimensionValues.${ dimensionIndex }.value` ) ===
			dateRange;
	}

	// Prevents running a filter on `report.rows` which could be undefined.
	const { rows: totalUsersReportRows = [] } = totalUsersReport || {};
	const { rows: trafficSourceReportRows = [] } = trafficSourceReport || {};

	const topTrafficSource =
		trafficSourceReportRows.filter( makeFilter( 'date_range_0', 1 ) )[ 0 ]
			?.dimensionValues?.[ 0 ].value || '-';

	const currentTotalUsers =
		parseInt(
			totalUsersReportRows.filter( makeFilter( 'date_range_0', 0 ) )[ 0 ]
				?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const currentTopTrafficSourceUsers =
		parseInt(
			trafficSourceReportRows.filter(
				makeFilter( 'date_range_0', 1 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const relativeCurrentTopTrafficSourceUsers = currentTotalUsers
		? currentTopTrafficSourceUsers / currentTotalUsers
		: 0;

	const previousTotalUsers =
		parseInt(
			totalUsersReportRows.filter( makeFilter( 'date_range_1', 0 ) )[ 0 ]
				?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const previousTopTrafficSourceUsers =
		parseInt(
			trafficSourceReportRows.filter(
				makeFilter( 'date_range_1', 1 )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const relativePreviousTopTrafficSourceUsers = previousTotalUsers
		? previousTopTrafficSourceUsers / previousTotalUsers
		: 0;

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return (
		<MetricTileText
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_TRAFFIC_SOURCE }
			metricValue={ topTrafficSource }
			metricValueFormat={ format }
			subText={ getTopTrafficSourceSubtext(
				relativeCurrentTopTrafficSourceUsers
			) }
			previousValue={ relativePreviousTopTrafficSourceUsers }
			currentValue={ relativeCurrentTopTrafficSourceUsers }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopTrafficSourceWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopTrafficSourceWidget );
