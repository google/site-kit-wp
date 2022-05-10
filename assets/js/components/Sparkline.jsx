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
import GoogleChart from './GoogleChart';

function Sparkline( { change, data, invertChangeColor, loadingHeight } ) {
	if ( ! data ) {
		return null;
	}

	const colors = [];
	const green = 'green';
	const red = 'red';

	if ( change === null ) {
		// Use green color by default if the change can't be determined.
		colors.push( green );
	} else {
		const positiveColor = ! invertChangeColor ? green : red;
		const negativeColor = ! invertChangeColor ? red : green;
		colors.push(
			0 <= ( parseFloat( change ) || 0 ) ? positiveColor : negativeColor
		);
	}

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
		colors,
	};

	// If the line is flat (zero change), we need to adjust it so
	// it sits in line visually with the other graphs.
	if ( ! data.slice( 1 ).some( ( row ) => row[ 1 ] > 0 ) ) {
		chartOptions.vAxis.minValue = 0;
		chartOptions.vAxis.maxValue = 1;
	}

	return (
		<div className="googlesitekit-analytics-sparkline-chart-wrap">
			<GoogleChart
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
