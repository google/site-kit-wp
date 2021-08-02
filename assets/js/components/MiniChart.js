/**
 * MiniChart component.
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

function MiniChart( { index, change } ) {
	const colors = [
		'#178EC5',
		'#54B23B',
		'#EB5729',
		'#ECED33',
		'#34CBE3',
		'#82E88E',
	];

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

	const percent = +( change * 100 ).toFixed( 1 );
	const data = [
		[ 'source', 'percent' ],
		[ '', percent ],
		[ '', 100 - percent ],
	];

	return (
		<div className="googlesitekit-mini-chart">
			<GoogleChart
				chartType="PieChart"
				data={ data }
				loadingHeight="24px"
				options={ options }
			/>
		</div>
	);
}

MiniChart.propTypes = {
	index: PropTypes.number.isRequired,
	change: PropTypes.number.isRequired,
};

export default MiniChart;
