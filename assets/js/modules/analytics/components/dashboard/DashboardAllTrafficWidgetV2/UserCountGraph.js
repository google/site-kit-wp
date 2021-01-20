
/**
 * UserCountGraph component
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS, DATE_RANGE_OFFSET } from '../../../../analytics/datastore/constants';
import { isZeroReport } from '../../../../analytics/util/is-zero-report';
import GoogleChart from '../../../../../components/GoogleChart';
import parseDimensionStringToDate from '../../../util/parseDimensionStringToDate';
import PreviewBlock from '../../../../../components/PreviewBlock';
import ReportError from '../../../../../components/ReportError';
import ReportZero from '../../../../../components/ReportZero';
const { useSelect } = Data;

/**
 * Extracts the data required from an analytics 'site-analytics' request for an Area chart.
 *
 * @since 1.24.0
 * @private
 *
 * @param {Object} reports The data returned from the Analytics API call.
 * @return {Array} Required data from 'site-analytics' request.
 */
const extractUserCountAnalyticsChartData = ( reports ) => {
	if ( ! reports || ! reports.length ) {
		return null;
	}

	return [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: '' },
			{ type: 'number', label: 'Users' },
		],
		...reports[ 0 ].data.rows.map( ( row ) => {
			const { values } = row.metrics[ 0 ];
			const dateString = row.dimensions[ 0 ];
			const date = parseDimensionStringToDate( dateString );

			return [
				date,
				null,
				values[ 0 ],
			];
		} ),
	];
};

export default function UserCountGraph( { dimensionName, dimensionValue } ) {
	const currentEntityURL = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const { startDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} ) );

	const args = {
		startDate,
		endDate,
		dimensions: [ 'ga:date' ],
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Users',
			},
		],
	};

	if ( currentEntityURL ) {
		args.url = currentEntityURL;
	}

	if ( dimensionName && dimensionValue ) {
		args.dimensionFilters = {
			[ dimensionName ]: dimensionValue,
		};
	}

	const loaded = useSelect( ( select ) => select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ args ] ) );
	const error = useSelect( ( select ) => select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] ) );
	const report = useSelect( ( select ) => select( MODULES_ANALYTICS ).getReport( args ) );

	if ( ! loaded ) {
		return <PreviewBlock width="100%" height="300px" shape="square" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( report ) ) {
		return <ReportZero moduleSlug="analytics" />;
	}

	const chartData = extractUserCountAnalyticsChartData( report, 'ga:users', dateRange );

	return (
		<div>
			<GoogleChart
				chartType="line"
				data={ chartData }
				options={ {
					animation: {
						startup: true,
					},
					curveType: 'function',
					height: 340,
					width: '100%',
					colors: [ '#1a73e8' ],
					chartArea: {
						height: '80%',
						width: '90%',
					},
					legend: {
						position: 'none',
					},
					hAxis: {
						backgroundColor: '#eef4fd', // rgba(26, 115, 232, 0.08) over the white background.
						format: 'MMM d',
						gridlines: {
							color: '#ffffff',
						},
						textPosition: 'out',
						textStyle: {
							color: '#616161',
							fontSize: 12,
						},
						ticks: [ new Date( startDate ), new Date( endDate ) ],
					},
					vAxes: {
						0: {
							baseline: 0,
							gridlines: {
								color: '#ffffff',
							},
							viewWindow: {
								max: 1,
								min: 0,
							},
							viewWindowMode: 'explicit',
							textPosition: 'none',
							ticks: [],
						},
						1: {
							gridlines: {
								color: '#ece9f1',
							},
							lineWidth: 3,
							minorGridlines: {
								color: '#ffffff',
							},
							minValue: 0,
							textStyle: {
								color: '#616161',
								fontSize: 12,
							},
							textPosition: 'out',
							viewWindow: {
								min: 0,
							},
						},
					},
					series: {
						0: { targetAxisIndex: 0, lineWidth: 0 },
						1: { color: '#1a73e8', lineWidth: 3, targetAxisIndex: 1 },
					},
					crosshair: {
						color: '#1a73e8',
						opacity: 0.1,
						orientation: 'vertical',
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
