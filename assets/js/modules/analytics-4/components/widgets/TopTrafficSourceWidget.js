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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import MetricTileText from '../../../../components/KeyMetrics/MetricTileText';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { numFmt } from '../../../../util';
import { get } from 'lodash';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

const { useSelect, useInViewSelect } = Data;

function TopTrafficSourceWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const totalUsersReportOptions = {
		...dates,
		metrics: [
			{
				name: 'totalUsers',
			},
		],
	};

	const trafficSourceReportOptions = {
		...dates,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		limit: 1,
		orderBy: 'totalUsers',
	};

	const totalUsersReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( totalUsersReportOptions )
	);

	const trafficSourceReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( trafficSourceReportOptions )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			trafficSourceReportOptions,
		] )
	);

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

	const makeFilter = ( dateRange, dimensionIndex ) => ( row ) =>
		get( row, `dimensionValues.${ dimensionIndex }.value` ) === dateRange;

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
			title={ __( 'Top Traffic Source', 'google-site-kit' ) }
			metricValue={ topTrafficSource }
			metricValueFormat={ format }
			subText={
				// eslint-disable-next-line @wordpress/valid-sprintf
				sprintf(
					/* translators: %d: Percentage of users for the current top traffic source compared to the number of total users for all traffic sources. */
					__( '%s of total traffic', 'google-site-kit' ),
					numFmt( relativeCurrentTopTrafficSourceUsers, format )
				)
			}
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
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopTrafficSourceWidget );
