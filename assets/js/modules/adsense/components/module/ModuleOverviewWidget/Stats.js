/**
 * ModuleOverviewWidget component.
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
import { getCurrencyPattern } from '../../../../../components/GoogleChart/utils';
import { getSiteStatsDataForGoogleChart, isZeroReport } from '../../../util';
import { Grid, Row, Cell } from '../../../../../material-components';
import GoogleChart from '../../../../../components/GoogleChart';

export default function Stats( props ) {
	const { metrics, currentRangeData, previousRangeData, selectedStats } =
		props;

	const dataMap = getSiteStatsDataForGoogleChart(
		currentRangeData,
		previousRangeData,
		Object.values( metrics )[ selectedStats ],
		selectedStats + 1, // Since we have the dimension in first position, then the metrics, we need the +1 offset.
		currentRangeData.headers[ selectedStats + 1 ]
	);

	const colors = [ '#6380b8', '#4bbbbb', '#3c7251', '#8e68cb' ];

	function getFormat( { type, currencyCode } = {} ) {
		if ( type === 'METRIC_CURRENCY' ) {
			return getCurrencyPattern( currencyCode );
		}

		const formats = {
			METRIC_TALLY: undefined,
			METRIC_RATIO: 'percent',
			METRIC_DECIMAL: 'decimal',
			METRIC_MILLISECONDS: undefined,
		};

		return formats[ type ];
	}

	const [ , ...ticks ] = dataMap.slice( 1 ).map( ( [ date ] ) => date );

	const options = {
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
			format: 'MMM d',
			gridlines: {
				color: '#fff',
			},
			textStyle: {
				color: '#616161',
				fontSize: 12,
			},
			ticks,
		},
		vAxis: {
			format: getFormat( currentRangeData.headers[ selectedStats + 1 ] ),
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
		series: {
			0: {
				color: colors[ selectedStats ],
				targetAxisIndex: 0,
			},
			1: {
				color: colors[ selectedStats ],
				targetAxisIndex: 0,
				lineDashStyle: [ 3, 3 ],
				lineWidth: 1,
			},
		},
	};

	if (
		isZeroReport( currentRangeData, selectedStats + 1 ) &&
		isZeroReport( previousRangeData, selectedStats + 1 )
	) {
		options.vAxis.viewWindow.max = 100;
	} else {
		options.vAxis.viewWindow.max = undefined;
	}

	return (
		<Grid className="googlesitekit-adsense-site-stats">
			<Row>
				<Cell size={ 12 }>
					<GoogleChart
						chartType="LineChart"
						data={ dataMap }
						loadingHeight="270px"
						loadingWidth="100%"
						options={ options }
					/>
				</Cell>
			</Row>
		</Grid>
	);
}

Stats.propTypes = {
	metrics: PropTypes.object,
	currentRangeData: PropTypes.object,
	previousRangeData: PropTypes.object,
	selectedStats: PropTypes.number.isRequired,
};
