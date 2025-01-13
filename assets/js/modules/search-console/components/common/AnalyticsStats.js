/**
 * AnalyticsStats component for SearchFunnelWidgetGA4.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { Grid, Row, Cell } from '../../../../material-components';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { extractAnalytics4DashboardData } from '../../../analytics-4/utils';
import GoogleChart from '../../../../components/GoogleChart';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import useViewOnly from '../../../../hooks/useViewOnly';
import { getDateString } from '../../../../util';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

export default function AnalyticsStats( props ) {
	const {
		data,
		selectedStats,
		dateRangeLength,
		dataLabels,
		tooltipDataFormats,
		chartDataFormats,
		statsColor,
		gatheringData,
		moduleSlug,
	} = props;

	const isViewOnly = useViewOnly();

	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( moduleSlug )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( moduleSlug )
	);
	const referenceDate = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const propertyCreateTime = useSelect( ( select ) => {
		if ( isViewOnly ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();
	} );

	let dateMarkers = [];

	if ( propertyCreateTime ) {
		dateMarkers = [
			{
				// Valid use of `new Date()` with an argument.
				// eslint-disable-next-line sitekit/no-direct-date
				date: getDateString( new Date( propertyCreateTime ) ),
				text: __(
					'Google Analytics property created',
					'google-site-kit'
				),
			},
		];
	}

	if ( ! analyticsModuleActive || ! analyticsModuleConnected ) {
		return null;
	}

	const googleChartData = extractAnalytics4DashboardData(
		data,
		selectedStats,
		dateRangeLength,
		referenceDate,
		dataLabels,
		tooltipDataFormats,
		chartDataFormats
	);

	const [ , ...ticks ] = googleChartData
		.slice( 1 )
		.map( ( [ date ] ) => date );

	const options = {
		...AnalyticsStats.chartOptions,
		hAxis: {
			...AnalyticsStats.chartOptions.hAxis,
			ticks,
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
						dateMarkers={ dateMarkers }
						loadingHeight="270px"
						loadingWidth="100%"
						options={ options }
						gatheringData={ gatheringData }
					/>
				</Cell>
			</Row>
		</Grid>
	);
}

AnalyticsStats.propTypes = {
	data: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ).isRequired,
	dateRangeLength: PropTypes.number.isRequired,
	selectedStats: PropTypes.number.isRequired,
	dataLabels: PropTypes.arrayOf( PropTypes.string ).isRequired,
	tooltipDataFormats: PropTypes.arrayOf( PropTypes.func ).isRequired,
	statsColor: PropTypes.string.isRequired,
	gatheringData: PropTypes.bool,
	moduleSlug: PropTypes.string.isRequired,
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
		left: 60,
		right: 25,
	},
	legend: {
		position: 'top',
		textStyle: {
			color: '#616161',
			fontSize: 12,
		},
	},
	hAxis: {
		format: 'MMM d',
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
