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
export const TRAFFIC_CHART_LINE_COLOR = '#462083';

/**
 * The hex value of `$c-violet-v-50`, the Sass token for the typical traffic
 * range. The widget's stylesheet finds the band in the chart by this fill.
 */
export const TYPICAL_TRAFFIC_RANGE_COLOR = '#e3d1ff';

/** The hex value of `$c-violet-v-200`, the Sass token for a published post's dot. */
export const PUBLISHED_POST_COLOR = '#a983e6';

/**
 * The style of the point that marks a day with a published post: a dot on the
 * line with a 3px white edge, so the line doesn't run into it.
 *
 * The line draws no points of its own, so `visible` shows this one. Google
 * Charts reads `size` as the radius, to the middle of the edge, so the dot's
 * fill is 16px across.
 */
export const PUBLISHED_POST_POINT_STYLE = `point { visible: true; size: 9.5; fill-color: ${ PUBLISHED_POST_COLOR }; stroke-color: #ffffff; stroke-width: 3; }`;

/** The Google Charts options for the traffic chart. */
export const TRAFFIC_CHART_OPTIONS = {
	animation: {
		startup: true,
	},
	curveType: 'function',
	height: 256,
	width: '100%',
	colors: [ TRAFFIC_CHART_LINE_COLOR ],
	chartArea: {
		left: 16,
		right: 40,
		height: 224,
		top: 8,
	},
	legend: {
		position: 'none',
	},
	hAxis: {
		// The hex value of `$c-neutral-n-200`, the Sass token for the gray line
		// along the right edge of the chart area.
		baselineColor: '#b8bdb9',
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
			color: TRAFFIC_CHART_LINE_COLOR,
			lineWidth: 3,
			// The visit counts are on the right, because Google Charts renders
			// the second value axis there.
			targetAxisIndex: 1,
		},
	},
	// The typical traffic range is a pair of interval columns, which Google
	// Charts fills as an area behind the line, with no edge lines. The legend's
	// swatch for the range has the same opacity.
	intervals: {
		style: 'area',
		color: TYPICAL_TRAFFIC_RANGE_COLOR,
		fillOpacity: 0.5,
		lineWidth: 0,
	},
	focusTarget: 'category',
	crosshair: {
		color: TRAFFIC_CHART_LINE_COLOR,
		opacity: 0.1,
		orientation: 'vertical',
		trigger: 'both',
	},
};
