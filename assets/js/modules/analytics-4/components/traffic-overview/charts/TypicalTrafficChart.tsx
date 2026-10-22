/**
 * Typical Traffic chart.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * Internal dependencies
 */
import GoogleChart from '@/js/components/GoogleChart';
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import ChartLegend from './ChartLegend';
import { getTrafficLegendItem } from './getTrafficLegendItem';
import { getTypicalTrafficChartData } from './getTypicalTrafficChartData';
import { TRAFFIC_CHART_OPTIONS } from './trafficChartOptions';
import TypicalTrafficChartHeader from './TypicalTrafficChartHeader';

export interface TypicalTrafficChartProps {
	/** The daily rows of the benchmarking response, one for each day of the selected date range, oldest first. The chart draws one point for each row. */
	dailyTraffic: BenchmarkingDailyTrafficRow[];
	/** The number of days in the selected date range, which the legend's label names, such as "Last 28 days traffic". */
	daysInSelectedRange: number;
}

const TypicalTrafficChart: FC< TypicalTrafficChartProps > = ( {
	dailyTraffic,
	daysInSelectedRange,
} ) => {
	const { chartData, ticks, maximumVisitors } = getTypicalTrafficChartData( {
		dailyTraffic,
	} );

	const [ , ...points ] = chartData;

	const options = {
		...TRAFFIC_CHART_OPTIONS,
		hAxis: {
			...TRAFFIC_CHART_OPTIONS.hAxis,
			ticks,
			// The same last-day baseline as `TrafficChart`.
			baseline: points[ points.length - 1 ]?.[ 0 ],
		},
		vAxis: {
			...TRAFFIC_CHART_OPTIONS.vAxis,
			// Google Charts ends the axis on a round number at or above the
			// busiest day. When every day is `0`, it draws the line of zeros
			// across the middle of the chart area, so the axis runs to 100, as in
			// `TrafficChart`.
			viewWindow: {
				...TRAFFIC_CHART_OPTIONS.vAxis.viewWindow,
				...( maximumVisitors ? {} : { max: 100 } ),
			},
		},
	};

	// Unlike `TrafficChart`, the chart passes no `dateMarkers`, so it never
	// marks the day the Analytics property was created. A preset date range
	// ends on the reference date and lasts at most 90 days, so it never
	// includes that day: `useHasTypicalTrafficTab()` shows the tab only for a
	// property created at least thirteen months before the reference date. A
	// calendar month or a custom range from `DateRangePicker`, behind the
	// `datePicker` feature flag, can include that day, and the chart does not
	// mark it there either.
	//
	// The chart passes no `gatheringData` either. With it, `GoogleChart` would
	// show its gathering data notice over the chart, and `getChartOptions()`
	// would fit the horizontal axis to the selected date range and end the
	// value axis at 100. No issue builds the tab's own gathering data design
	// yet.
	return (
		<div className="googlesitekit-traffic-overview__chart googlesitekit-traffic-overview__chart--typical-traffic">
			<TypicalTrafficChartHeader />
			<GoogleChart
				chartType="LineChart"
				data={ chartData }
				height="256px"
				options={ options }
				width="100%"
			/>
			<ChartLegend
				items={ [ getTrafficLegendItem( daysInSelectedRange ) ] }
			/>
		</div>
	);
};

export default TypicalTrafficChart;
