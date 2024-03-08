/**
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
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET as DATE_RANGE_OFFSET_ANALYTICS,
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';
import GoogleChart from '../GoogleChart';
import { UNIQUE_VISITORS_CHART_OPTIONS } from './chart-options';
import { extractAnalytics4DashboardData } from '../../modules/analytics-4/utils/extract-dashboard-data';
const { useSelect, useInViewSelect } = Data;

export default function WPDashboardUniqueVisitorsChartGA4( {
	WPDashboardReportError,
} ) {
	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isGatheringData()
	);
	const googleChartsCollisionError = useSelect( ( select ) =>
		select( CORE_UI ).getValue( 'googleChartsCollisionError' )
	);

	const { startDate, endDate, compareStartDate, compareEndDate } = useSelect(
		( select ) =>
			select( CORE_USER ).getDateRangeDates( {
				compare: true,
				offsetDays: DATE_RANGE_OFFSET_ANALYTICS,
			} )
	);

	const dateRangeLength = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeNumberOfDays()
	);

	const reportArgs = {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		metrics: [ { name: 'totalUsers' } ],
		dimensions: [ 'date' ],
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
	};

	const data = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( reportArgs )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportArgs ]
			)
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportArgs,
		] )
	);

	// If we can't load Google Charts, don't display this component at all.
	if ( googleChartsCollisionError ) {
		return null;
	}

	if ( error ) {
		return (
			<WPDashboardReportError moduleSlug="analytics-4" error={ error } />
		);
	}

	const googleChartData = extractAnalytics4DashboardData(
		data,
		0,
		dateRangeLength,
		[ __( 'Unique Visitors', 'google-site-kit' ) ],
		[ ( x ) => parseFloat( x ).toLocaleString() ]
	);

	const [ , ...ticks ] = googleChartData
		.slice( 1 )
		.map( ( [ date ] ) => date );
	const options = {
		...UNIQUE_VISITORS_CHART_OPTIONS,
		hAxis: {
			...UNIQUE_VISITORS_CHART_OPTIONS.hAxis,
			ticks,
		},
	};

	const currentValueIndex = 2;
	const previousValueIndex = 3;
	const isZeroChart = ! googleChartData
		.slice( 1 )
		.some(
			( datum ) =>
				datum[ currentValueIndex ] > 0 ||
				datum[ previousValueIndex ] > 0
		);

	if ( isZeroChart ) {
		options.hAxis.ticks = [ new Date() ];
	}

	return (
		<div className="googlesitekit-unique-visitors-chart-widget">
			<h3>
				{ sprintf(
					/* translators: %s: number of days */
					_n(
						'Unique visitors over the last %s day',
						'Unique visitors over the last %s days',
						dateRangeLength,
						'google-site-kit'
					),
					dateRangeLength
				) }
			</h3>
			<GoogleChart
				chartType="LineChart"
				data={ googleChartData }
				loadingHeight="270px"
				loadingWidth="100%"
				loaded={ ! ( loading || isGatheringData === undefined ) }
				options={ options }
				gatheringData={ isGatheringData }
			/>
		</div>
	);
}

WPDashboardUniqueVisitorsChartGA4.propTypes = {
	WPDashboardReportError: PropTypes.elementType.isRequired,
};
