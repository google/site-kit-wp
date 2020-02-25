/**
 * Sparkline component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import GoogleChart from 'GoogleComponents/google-chart';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import { Component } from '@wordpress/element';

class Sparkline extends Component {
	render() {
		const {
			data,
			change,
			id,
			invertChangeColor,
			loadSmall,
			loadCompressed,
			loadHeight,
			loadText,
		} = this.props;

		if ( ! data ) {
			return 'loading...';
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
				0 <= parseFloat( change ) ? positiveColor : negativeColor,
			],
		};

		return (
			<div className="googlesitekit-analytics-sparkline-chart-wrap">
				<GoogleChart
					data={ data }
					options={ chartOptions }
					id={ id }
					loadSmall={ loadSmall }
					loadCompressed={ loadCompressed }
					loadHeight={ loadHeight }
					loadText={ loadText }
				/>
			</div>
		);
	}
}

Sparkline.propTypes = {
	invertChangeColor: PropTypes.bool,
	loadSmall: PropTypes.bool,
	loadCompressed: PropTypes.bool,
	loadHeight: PropTypes.number,
	loadText: PropTypes.bool,
};

Sparkline.defaultProps = {
	invertChangeColor: false,
	loadSmall: true,
	loadCompressed: true,
	loadHeight: 46,
	loadText: false,
};

export default withInstanceId( Sparkline );
