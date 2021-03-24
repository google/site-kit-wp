/**
 * SiteStats component the ModuleOverviewWidget widget.
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
import { extractAnalyticsDashboardData, getTimeColumnVaxisFormat } from '../../../util';
import GoogleChart from '../../../../../components/GoogleChart';
import PreviewBlock from '../../../../../components/PreviewBlock';
import { Cell, Row, Grid } from '../../../../../material-components';
const { useSelect } = Data;

export default function SiteStats( { loaded, selectedStat, report } ) {
	const currentDayCount = useSelect( ( select ) => select( CORE_USER ).getDateRangeNumberOfDays() );

	if ( ! loaded ) {
		return (
			<PreviewBlock width="100%" height="270px" />
		);
	}

	const dataMap = extractAnalyticsDashboardData( report, {
		selectedStats: selectedStat,
		currentMonthMetricIndex: 0,
		previousMonthMetricIndex: 1,
		days: currentDayCount,
	} );

	let vAxisFormat;
	if ( dataMap[ 0 ][ selectedStat ]?.type === 'timeofday' ) {
		vAxisFormat = getTimeColumnVaxisFormat( dataMap, selectedStat );
	}

	const options = {
		...SiteStats.options,
		vAxis: {
			...SiteStats.options.vAxis,
			format: vAxisFormat,
		},
		series: {
			0: {
				color: SiteStats.colorMap[ selectedStat ],
				targetAxisIndex: 0,
			},
			1: {
				color: SiteStats.colorMap[ selectedStat ],
				targetAxisIndex: 0,
				lineDashStyle: [ 3, 3 ],
				lineWidth: 1,
			},
		},
	};

	return (
		<Grid className="googlesitekit-analytics-site-stats">
			<Row>
				<Cell size={ 12 }>
					<GoogleChart
						chartType="line"
						selectedStats={ [ selectedStat ] }
						data={ dataMap }
						options={ options }
					/>
				</Cell>
			</Row>
		</Grid>
	);
}

SiteStats.propTypes = {
	loaded: PropTypes.bool.isRequired,
	selectedStat: PropTypes.number.isRequired,
	report: PropTypes.arrayOf( PropTypes.object ),
};

SiteStats.defaultProps = {
	report: [],
};

SiteStats.colorMap = {
	0: '#4285f4',
	1: '#27bcd4',
	2: '#1b9688',
	3: '#673ab7',
};

SiteStats.options = {
	chart: {
		title: '',
	},
	curveType: 'line',
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
