
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
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { DATE_RANGE_OFFSET, FORM_ALL_TRAFFIC_WIDGET } from '../../../../analytics/datastore/constants';
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

export default function UserCountGraph( { loaded, error, report } ) {
	const { startDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ) );
	const graphLineColor = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionColor' ) || '#1a73e8' );

	if ( ! loaded ) {
		return <PreviewBlock width="100%" height="300px" shape="square" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( report ) ) {
		return <ReportZero moduleSlug="analytics" />;
	}

	const chartData = extractUserCountAnalyticsChartData( report );
	const chartOptions = { ...UserCountGraph.chartOptions };

	chartOptions.hAxis.ticks = [ new Date( startDate ), new Date( endDate ) ];
	chartOptions.series[ 1 ].color = graphLineColor;

	return (
		<GoogleChart
			chartType="line"
			data={ chartData }
			options={ chartOptions }
		/>
	);
}

UserCountGraph.propTypes = {
	loaded: PropTypes.bool,
	error: PropTypes.shape( {} ),
	report: PropTypes.shape( {} ),
};

UserCountGraph.chartOptions = {
	animation: {
		startup: true,
	},
	curveType: 'function',
	height: 340,
	width: '100%',
	colors: [ '#1a73e8' ],
	chartArea: {
		height: '80%',
		width: '80%',
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
		1: {
			lineWidth: 3,
			targetAxisIndex: 1,
		},
	},
	crosshair: {
		color: '#1a73e8',
		opacity: 0.1,
		orientation: 'vertical',
	},
};
