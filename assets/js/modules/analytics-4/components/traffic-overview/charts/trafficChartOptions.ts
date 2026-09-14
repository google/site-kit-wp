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

/** The hex value of `$c-neutral-n-500`, the Sass token for an axis label. */
const AXIS_LABEL_COLOR = '#6c726e';

/** The hex value of `$c-violet-v-600`, the Sass token for the chart's line. */
const LINE_COLOR = '#462083';

/** The Google Charts options for the traffic chart. */
export const TRAFFIC_CHART_OPTIONS = {
	animation: {
		startup: true,
	},
	curveType: 'function',
	height: 256,
	width: '100%',
	colors: [ LINE_COLOR ],
	chartArea: {
		left: 0,
		right: 40,
		height: 224,
		top: 8,
	},
	legend: {
		position: 'none',
	},
	hAxis: {
		format: 'MMM d',
		// The chart shows no vertical gridlines. Setting the gridline count to
		// `0` also moves the date labels, so the lines are transparent instead.
		gridlines: {
			color: 'transparent',
		},
		textPosition: 'out',
		textStyle: {
			fontName: 'Google Sans Text',
		},
	},
	hAxes: {
		0: {
			textStyle: {
				color: AXIS_LABEL_COLOR,
			},
		},
	},
	vAxis: {
		// The hex value of `$c-neutral-n-400`, the Sass token for the baseline.
		baselineColor: '#7b807d',
		gridlines: {
			// The hex value of `$c-neutral-n-50`, the Sass token for a gridline.
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
	// The line uses the second value axis, so `vAxes[ 1 ]` sets the color of
	// its labels.
	vAxes: {
		1: {
			textStyle: {
				color: AXIS_LABEL_COLOR,
			},
		},
	},
	series: {
		0: {
			color: LINE_COLOR,
			lineWidth: 3,
			// The visitor counts are on the right, because Google Charts renders
			// the second value axis there.
			targetAxisIndex: 1,
		},
	},
	focusTarget: 'category',
	crosshair: {
		color: LINE_COLOR,
		opacity: 0.1,
		orientation: 'vertical',
		trigger: 'both',
	},
};
