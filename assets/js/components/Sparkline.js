/**
 * Sparkline component.
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
import GoogleChartV2 from './GoogleChartV2';

function Sparkline( {
	change,
	data,
	invertChangeColor,
	loadingHeight,
} ) {
	if ( ! data ) {
		return null;
	}

	const positiveColor = ! invertChangeColor ? 'green' : 'red';
	const negativeColor = ! invertChangeColor ? 'red' : 'green';

	const chartOptions = {
		title: '',
		backgroundColor: 'transparent',
		curveType: 'line',
		width: '100%',
		height: '50',
		enableInteractivity: false,
		chartArea: {
			height: '100%',
			width: '100%',
		},
		legend: { position: 'none' },
		axisFontSize: 0,
		hAxis: {
			baselineColor: 'none',
			ticks: [],
		},
		vAxis: {
			baselineColor: 'none',
			ticks: [],
		},
		axes: [],
		colors: [
			0 <= ( parseFloat( change ) || 0 ) ? positiveColor : negativeColor,
		],
	};

	return (
		<div className="googlesitekit-analytics-sparkline-chart-wrap">
			<GoogleChartV2
				chartType="LineChart"
				data={ data }
				loadingHeight={ loadingHeight }
				options={ chartOptions }
			/>
		</div>
	);
}

Sparkline.propTypes = {
	invertChangeColor: PropTypes.bool,
	loadingHeight: PropTypes.string,
};

Sparkline.defaultProps = {
	invertChangeColor: false,
	loadingHeight: '46px',
};

export default Sparkline;
