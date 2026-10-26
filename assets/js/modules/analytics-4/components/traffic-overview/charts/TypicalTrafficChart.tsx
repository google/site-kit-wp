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
import classnames from 'classnames';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import GoogleChart from '@/js/components/GoogleChart';
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import ChartLegend from './ChartLegend';
import { getPropertyCreatedDateMarkers } from './getPropertyCreatedDateMarkers';
import { getPropertyCreatedMarkerDate } from './getPropertyCreatedMarkerDate';
import { getTrafficLegendItem } from './getTrafficLegendItem';
import { getTypicalTrafficChartData } from './getTypicalTrafficChartData';
import PropertyCreatedScreenReaderText from './PropertyCreatedScreenReaderText';
import { TRAFFIC_CHART_OPTIONS } from './trafficChartOptions';
import TypicalTrafficChartHeader from './TypicalTrafficChartHeader';

export interface TypicalTrafficChartProps {
	/** The daily rows of the benchmarking response, one for each day of the selected date range, oldest first. The chart draws one point for each row. */
	dailyTraffic: BenchmarkingDailyTrafficRow[];
	/** The number of days in the selected date range, which the legend's label names, such as "Last 28 days traffic". */
	daysInSelectedRange: number;
	/** The day the Analytics property was created, as `YYYY-MM-DD`. The chart marks it, and reads it to a screen reader, when it is one of the plotted days. */
	propertyCreateDate?: string;
}

const TypicalTrafficChart: FC< TypicalTrafficChartProps > = ( {
	dailyTraffic,
	daysInSelectedRange,
	propertyCreateDate,
} ) => {
	const { chartData, ticks, hasVisitors } = getTypicalTrafficChartData( {
		dailyTraffic,
	} );

	const [ , ...points ] = chartData;

	const options = {
		...TRAFFIC_CHART_OPTIONS,
		hAxis: {
			...TRAFFIC_CHART_OPTIONS.hAxis,
			ticks,
			// Draws the gray line along the right edge of the chart area.
			baseline: points[ points.length - 1 ]?.[ 0 ],
		},
		vAxis: {
			...TRAFFIC_CHART_OPTIONS.vAxis,
			// Google Charts ends the axis on a round number at or above the
			// busiest day. When every day is `0`, it draws the line of zeros
			// across the middle of the chart area. So the axis runs to 100 then,
			// as in `TrafficChart`.
			viewWindow: {
				...TRAFFIC_CHART_OPTIONS.vAxis.viewWindow,
				...( hasVisitors ? {} : { max: 100 } ),
			},
		},
	};

	// The rows are the days of the selected date range, so the first and the
	// last row's day bound the creation day the chart marks.
	const firstDate = dailyTraffic[ 0 ]?.date;
	const lastDate = dailyTraffic[ dailyTraffic.length - 1 ]?.date;
	const markerDate = getPropertyCreatedMarkerDate(
		propertyCreateDate,
		firstDate,
		lastDate
	);

	// No `gatheringData`, so `GoogleChart` doesn't show its gathering data
	// notice over the chart or change the axes.
	return (
		<div
			className={ classnames(
				'googlesitekit-traffic-overview__chart',
				'googlesitekit-traffic-overview__chart--typical-traffic',
				{
					'googlesitekit-traffic-overview__chart--has-date-marker':
						!! markerDate,
				}
			) }
		>
			<TypicalTrafficChartHeader />
			<GoogleChart
				chartType="LineChart"
				data={ chartData }
				dateMarkers={ getPropertyCreatedDateMarkers( markerDate ) }
				height="256px"
				options={ options }
				width="100%"
			/>
			<ChartLegend
				items={ [ getTrafficLegendItem( daysInSelectedRange ) ] }
			/>
			{ markerDate && (
				<PropertyCreatedScreenReaderText date={ markerDate } />
			) }
		</div>
	);
};

export default TypicalTrafficChart;
