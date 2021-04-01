/**
 * PieChart component.
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
 * Internal dependencies
 */
import GoogleChart from '../../../../../components/GoogleChart';
import { extractAnalyticsDataForPieChart } from '../../../util';
import PropTypes from 'prop-types';
import PreviewBlock from '../../../../../components/PreviewBlock';

export default function PieChart( { report, hasFinishedResolution } ) {
	const processedData = extractAnalyticsDataForPieChart( report, { keyColumnIndex: 1 } );

	return hasFinishedResolution ? (
		<div className="googlesitekit-chart googlesitekit-chart--pie">
			<GoogleChart
				data={ processedData }
				options={ PieChart.options }
				chartType="pie"
				id="overview-piechart"
				loadHeight={ 205 }
			/>
		</div>
	) : (
		<PreviewBlock width="282px" height="282px" shape="circular" />
	);
}

PieChart.options = {
	chartArea: {
		width: '100%',
		height: '100%',
	},
	backgroundColor: 'transparent',
	height: 250,
	legend: {
		alignment: 'center',
		textStyle: {
			color: '#5b5b61',
			fontSize: 12,
		},
	},
	slices: {
		0: { color: '#178EC5' },
		1: { color: '#54B23B' },
		2: { color: '#EB5729' },
		3: { color: '#ECED33' },
		4: { color: '#34CBE3' },
		5: { color: '#82E88E' },
	},
	title: null,
	width: '100%',
};

PieChart.propTypes = {
	report: PropTypes.arrayOf( PropTypes.object ),
	hasFinishedResolution: PropTypes.arrayOf( PropTypes.bool ),
};
