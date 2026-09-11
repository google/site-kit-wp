/**
 * Traffic Overview chart options.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { TRAFFIC_CHART_LINE_COLOR } from '@/js/modules/analytics-4/components/traffic-overview/constants';

/** The Google Charts options for the traffic chart. */
export const TRAFFIC_CHART_OPTIONS = {
	animation: {
		startup: true,
	},
	curveType: 'function',
	// The design's frame is 248 px tall, with a 224 px chart area and the date
	// labels under it.
	height: 248,
	width: '100%',
	colors: [ TRAFFIC_CHART_LINE_COLOR ],
	chartArea: {
		left: 7,
		right: 40,
		height: 224,
		top: 4,
	},
	legend: {
		position: 'none',
	},
	hAxis: {
		format: 'MMM d',
		// The design has no vertical gridlines. A gridline count of `0` moves
		// the date labels too, so the lines are transparent instead.
		gridlines: {
			color: 'transparent',
		},
		textPosition: 'out',
		textStyle: {
			fontName: 'Google Sans Text',
		},
	},
	vAxis: {
		baselineColor: '#7b807d',
		gridlines: {
			color: '#ebeef0',
		},
		lineWidth: 3,
		minorGridlines: {
			count: 0,
		},
		minValue: 0,
		textStyle: {
			fontName: 'Google Sans Text',
		},
		textPosition: 'out',
		viewWindow: {
			min: 0,
		},
	},
	series: {
		0: {
			color: TRAFFIC_CHART_LINE_COLOR,
			lineWidth: 3,
			// The design puts the value labels on the second value axis,
			// opposite the first.
			targetAxisIndex: 1,
		},
	},
	focusTarget: 'category',
	crosshair: {
		color: TRAFFIC_CHART_LINE_COLOR,
		opacity: 0.1,
		orientation: 'vertical',
		trigger: 'both',
	},
};
