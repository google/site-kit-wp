/**
 * MiniChart component.
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
import { colors } from 'GoogleComponents/colors';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class MiniChart extends Component {
	render() {
		const { index, percent } = this.props;

		const options = {
			backgroundColor: 'transparent',
			chartArea: {
				width: '100%',
				height: '100%',
			},
			enableInteractivity: false,
			height: 28,
			legend: {
				position: 'none',
			},
			slices: {
				0: {
					color: colors[ index ],
				},
				1: {
					color: '#e6e6e6',
				},
			},
			title: null,
			tooltip: {
				trigger: 'none',
			},
			width: 28,
		};

		const data = [
			[ 'source', 'percent' ],
			[ '', +percent ],
			[ '', ( 100 - percent ) ],
		];

		return (
			<div className="googlesitekit-mini-chart">
				<GoogleChart
					data={ data }
					options={ options }
					chartType="pie"
					loadSmall
					loadCompressed
					loadHeight={ 24 }
					loadText={ false }
					id={ 'minichart' + index }
				/>
			</div>
		);
	}
}

export default MiniChart;
