/**
 * GoogleChart Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import GoogleChart from './';
import { WithTestRegistry } from '../../../../tests/js/utils';

function Template( args ) {
	return <GoogleChart { ...args } />;
}

export const LineChartGatheringData = Template.bind( {} );
LineChartGatheringData.storyName = 'Line Chart - Gathering Data';
LineChartGatheringData.args = {
	chartType: 'LineChart',
	data: [
		[
			{ label: 'Day', type: 'date' },
			{
				p: { html: true, role: 'tooltip' },
				role: 'tooltip',
				type: 'string',
			},
			{ label: 'Impressions', type: 'number' },
			{ label: 'Previous period', type: 'number' },
		],
	],
	options: {
		chart: {
			title: 'Search Traffic Summary',
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
			format: 'MMM d',
			gridlines: {
				color: '#fff',
			},
			textStyle: {
				color: '#616161',
				fontSize: 12,
			},
			ticks: [],
		},
		vAxis: {
			direction: 1,
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
		series: {
			0: {
				color: '#4285f4',
				targetAxisIndex: 0,
			},
			1: {
				color: '#4285f4',
				targetAxisIndex: 0,
				lineDashStyle: [ 3, 3 ],
				lineWidth: 1,
			},
		},
	},
	gatheringData: true,
};

export default {
	title: 'Components/GoogleChart',
	component: GoogleChart,
	decorators: [
		( Story, { parameters } ) => {
			return (
				<WithTestRegistry features={ parameters.features || [] }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
