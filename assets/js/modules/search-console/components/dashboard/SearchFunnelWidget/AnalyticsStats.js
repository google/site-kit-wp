/**
 * AnalyticsStats component for SearchFunnelWidget.
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
import { Grid, Row, Cell } from '../../../../../material-components';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { extractAnalyticsDashboardData } from '../../../../analytics/util';
import GoogleChart from '../../../../../components/GoogleChart';
const { useSelect } = Data;

const AnalyticsStats = ( {
	data,
	selectedStats,
	dateRangeLength,
	dataLabels,
	dataFormats,
	statsColor,
} ) => {
	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);

	if ( ! analyticsModuleActive || ! analyticsModuleConnected ) {
		return null;
	}

	const googleChartData =
		extractAnalyticsDashboardData(
			data,
			selectedStats,
			dateRangeLength,
			0,
			1,
			dataLabels,
			dataFormats
		) || [];

	const dates = googleChartData.slice( 1 ).map( ( [ date ] ) => date );
	const options = {
		...AnalyticsStats.chartOptions,
		hAxis: {
			...AnalyticsStats.chartOptions.hAxis,
			ticks: dates,
		},
		vAxis: {
			...AnalyticsStats.chartOptions.vAxis,
		},
		series: {
			0: {
				color: statsColor,
				targetAxisIndex: 0,
			},
			1: {
				color: statsColor,
				targetAxisIndex: 0,
				lineDashStyle: [ 3, 3 ],
				lineWidth: 1,
			},
		},
	};

	// The index of the value used to plot the graph.
	const valueIndex = 2;

	const isZeroChart =
		! googleChartData
			.slice( 1 )
			.some( ( datum ) => datum[ valueIndex ] > 0 ) &&
		! googleChartData
			.slice( 1 )
			.some( ( datum ) => datum[ valueIndex + 1 ] > 0 );

	if ( isZeroChart ) {
		const zeroChartViewMax = { 0: 1, 1: 100 }[ selectedStats ];
		options.vAxis.viewWindow.max = zeroChartViewMax;
	} else {
		options.vAxis.viewWindow.max = undefined;
	}

	return (
		<Grid className="googlesitekit-analytics-site-stats">
			<Row>
				<Cell size={ 12 }>
					<GoogleChart
						chartType="LineChart"
						data={ googleChartData }
						loadingHeight="270px"
						loadingWidth="100%"
						options={ options }
					/>
				</Cell>
			</Row>
		</Grid>
	);
};

AnalyticsStats.propTypes = {
	data: PropTypes.arrayOf( PropTypes.object ).isRequired,
	dateRangeLength: PropTypes.number.isRequired,
	selectedStats: PropTypes.number.isRequired,
	dataLabels: PropTypes.arrayOf( PropTypes.string ).isRequired,
	dataFormats: PropTypes.arrayOf( PropTypes.func ).isRequired,
	statsColor: PropTypes.string.isRequired,
};

AnalyticsStats.chartOptions = {
	chart: {
		title: '',
	},
	curveType: 'function',
	height: 270,
	width: '100%',
	chartArea: {
		height: '80%',
		width: '100%',
		left: 60,
	},
	legend: {
		position: 'top',
		textStyle: {
			color: '#616161',
			fontSize: 12,
		},
	},
	hAxis: {
		format: 'M/d/yy',
		gridlines: {
			color: '#fff',
		},
		textStyle: {
			color: '#616161',
			fontSize: 12,
		},
	},
	vAxis: {
		gridlines: {
			color: '#eee',
		},
		minorGridlines: {
			color: '#eee',
		},
		textStyle: {
			color: '#616161',
			fontSize: 12,
		},
		titleTextStyle: {
			color: '#616161',
			fontSize: 12,
			italic: false,
		},
		viewWindow: {
			min: 0,
		},
	},
	focusTarget: 'category',
	crosshair: {
		color: 'gray',
		opacity: 0.1,
		orientation: 'vertical',
		trigger: 'both',
	},
	tooltip: {
		isHtml: true, // eslint-disable-line sitekit/acronym-case
		trigger: 'both',
	},
};

export default AnalyticsStats;
