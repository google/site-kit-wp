
/**
 * UserCountGraph component
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME as MODULES_ANALYTICS, DATE_RANGE_OFFSET } from '../../../../analytics/datastore/constants';
import { isZeroReport } from '../../../../analytics/util/is-zero-report';
import GoogleChart from '../../../../../components/GoogleChart';
import { extractAnalyticsDashboardData, reduceAnalyticsRowsData, extractAnalyticsChartData } from '../../../util';
import PreviewBlock from '../../../../../components/PreviewBlock';
import ReportError from '../../../../../components/ReportError';
import ReportZero from '../../../../../components/ReportZero';
const { useSelect } = Data;

// eslint-disable-next-line no-unused-vars
export default function UserCountGraph( { dimensionName, dimensionValue } ) {
	const currentEntityURL = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const dateRangeDates = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} ) );

	const args = {
		startDate: dateRangeDates.startDate,
		endDate: dateRangeDates.endDate,
		dimensions: [ 'ga:date' ],
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
		orderby: {
			fieldName: 'ga:date',
			sortOrder: 'DESCENDING',
		},
		limit: 100,
	};

	if ( currentEntityURL ) {
		args.url = currentEntityURL;
	}

	if ( dimensionName && dimensionValue ) {
		args.dimensions.push( dimensionName );
		args.dimensionFilters = {
			[ dimensionName ]: dimensionValue,
		};
	}

	const loaded = useSelect( ( select ) => select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ args ] ) );
	const error = useSelect( ( select ) => select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] ) );
	const report = useSelect( ( select ) => select( MODULES_ANALYTICS ).getReport( args ) );

	useEffect( () => {
		console.log( 'report', report );
		console.log( 'dateRangeDates', dateRangeDates );
	}, [ report ] );

	if ( ! loaded ) {
		return <PreviewBlock width="282px" height="282px" shape="circular" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( report ) ) {
		return <ReportZero moduleSlug="analytics" />;
	}

	const chartData = extractAnalyticsChartData( report, 'ga:users', dateRange );

	return (
		<div>
			<GoogleChart
				chartType="area"
				// selectedStats={ selectedStats }
				data={ chartData }
				options={ {
				// chart: {
				// 	title: 'TEST TEST TEST',
				// },
					animation: {
						startup: true,
					},
					curveType: 'function',
					height: 270,
					width: '100%',
					// backgroundColor: '#eef4fd', // rgba(26, 115, 232, 0.08) over the white background.
					colors: [ '#1a73e8' ],
					chartArea: {
						height: '80%',
						width: '100%',
					},
					legend: {
						position: 'right',
						textStyle: {
							color: '#616161',
							fontSize: 12,
						},
					},
					hAxis: {
						baselineColor: '#eef4fd', // rgba(26, 115, 232, 0.08) over the white background.
						format: 'MMMM d',
						gridlines: {
							color: '#ffffff',
						},
						textStyle: {
							color: '#616161',
							fontSize: 12,
						},
						// title: 'Nov',
					},
					vAxis: {
						gridlines: {
							color: '#ece9f1',
						},
						minValue: 0,
						textStyle: {
							color: '#616161',
							fontSize: 12,
						},
						titleTextStyle: {
							color: '#616161',
							fontSize: 12,
							italic: false,
						},
					},
					// focusTarget: 'category',
					crosshair: {
						color: 'blue',
						opacity: 0.1,
						orientation: 'vertical',
						trigger: 'both',
					},
				} }
			/>
		</div>
	);
}

UserCountGraph.propTypes = {
	dimensionName: PropTypes.string,
	dimensionValue: PropTypes.string,
};
