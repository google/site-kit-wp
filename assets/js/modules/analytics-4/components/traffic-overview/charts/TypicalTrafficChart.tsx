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
import { FC, useMemo } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GoogleChart from '@/js/components/GoogleChart';
import VisuallyHidden from '@/js/components/VisuallyHidden';
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getPropertyCreateDate } from '@/js/modules/analytics-4/utils/property-create-date';
import { getLocale, stringToDate } from '@/js/util';
import ChartLegend from './ChartLegend';
import { getTypicalTrafficChartData } from './getTypicalTrafficChartData';
import SelectedRangeRegion from './SelectedRangeRegion';
import { TRAFFIC_CHART_LINE_COLOR } from './trafficChartOptions';
import TypicalTrafficChartHeader from './TypicalTrafficChartHeader';
import { TYPICAL_TRAFFIC_CHART_OPTIONS } from './typicalTrafficChartOptions';

// The `react-google-charts` types leave out `getChartLayoutInterface()`.
interface ChartLayoutInterface {
	/** Returns the chart area's top edge and height, in pixels. */
	getChartAreaBoundingBox: () => { top: number; height: number };
	/** Returns the horizontal position of a day on the chart, in pixels. */
	getXLocation: ( day: Date ) => number;
}

interface ChartReadyEvent {
	/** The chart wrapper `GoogleChart` passes to its `onReady` handler. */
	chartWrapper: {
		getChart: () => {
			getChartLayoutInterface: () => ChartLayoutInterface;
		} | null;
	};
}

export interface TypicalTrafficChartProps {
	/** The daily rows of the benchmarking response, oldest first. */
	dailyTraffic: BenchmarkingDailyTrafficRow[];
	/** The first day of the selected date range, as `YYYY-MM-DD`. */
	selectedStartDate: string;
	/** The last day of the selected date range, as `YYYY-MM-DD`. */
	selectedEndDate: string;
	/** The number of days in the selected date range. */
	daysInSelectedRange: number;
	/** The Analytics property's creation time in milliseconds, as `getPropertyCreateTime()` returns it. */
	propertyCreateTime?: number;
}

const TypicalTrafficChart: FC< TypicalTrafficChartProps > = ( {
	dailyTraffic,
	selectedStartDate,
	selectedEndDate,
	daysInSelectedRange,
	propertyCreateTime,
} ) => {
	// `useInstanceId` is typed as `string | number`, and an `id` takes a string.
	const regionID = `${ useInstanceId(
		TypicalTrafficChart,
		'googlesitekit-traffic-overview__selected-range-region'
	) }`;

	const {
		chartData,
		ticks,
		maximumVisitors,
		windowStartDate,
		windowEndDate,
	} = getTypicalTrafficChartData( { dailyTraffic } );

	const [ , ...points ] = chartData;

	const options = {
		...TYPICAL_TRAFFIC_CHART_OPTIONS,
		hAxis: {
			...TYPICAL_TRAFFIC_CHART_OPTIONS.hAxis,
			ticks,
			// Puts the gray baseline on the right edge of the chart area.
			baseline: points[ points.length - 1 ]?.[ 0 ],
		},
		vAxis: {
			...TYPICAL_TRAFFIC_CHART_OPTIONS.vAxis,
			// The busiest day of the window sets the scale. Google Charts rounds
			// the top of the axis up to the gridline above it.
			maxValue: maximumVisitors,
			// When every day is at zero, Google Charts needs a maximum, or it
			// draws the line across the middle of the chart area.
			viewWindow: {
				...TYPICAL_TRAFFIC_CHART_OPTIONS.vAxis.viewWindow,
				...( maximumVisitors ? {} : { max: 100 } ),
			},
		},
	};

	const propertyCreateDate = getPropertyCreateDate( propertyCreateTime );

	// `GoogleChart` draws a marker only on a plotted day, and the screen-reader
	// sentence follows the same rule.
	const markerDate =
		propertyCreateDate &&
		windowStartDate &&
		windowEndDate &&
		propertyCreateDate >= windowStartDate &&
		propertyCreateDate <= windowEndDate
			? propertyCreateDate
			: undefined;

	const dateMarkers = markerDate
		? [
				{
					date: markerDate,
					text: __(
						'Google Analytics property created',
						'google-site-kit'
					),
				},
		  ]
		: undefined;

	const legendItems = [
		{
			label: sprintf(
				/* translators: %d: the number of days in the selected date range, such as "28" */
				_n(
					'Last %d day traffic',
					'Last %d days traffic',
					daysInSelectedRange,
					'google-site-kit'
				),
				daysInSelectedRange
			),
			color: TRAFFIC_CHART_LINE_COLOR,
		},
	];

	const dayFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat( getLocale(), {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			} ),
		[]
	);

	// Google Charts fires `ready` again after every redraw, including the one
	// after the browser window is resized, so the region follows the chart.
	function positionSelectedRangeRegion( { chartWrapper }: ChartReadyEvent ) {
		const layout = chartWrapper.getChart()?.getChartLayoutInterface();
		const region = document.getElementById( regionID );

		if ( ! layout || ! region ) {
			return;
		}

		const { top, height } = layout.getChartAreaBoundingBox();
		const left = layout.getXLocation( stringToDate( selectedStartDate ) );
		const right = layout.getXLocation( stringToDate( selectedEndDate ) );

		Object.assign( region.style, {
			top: `${ top }px`,
			height: `${ height }px`,
			left: `${ left }px`,
			width: `${ right - left }px`,
		} );
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-traffic-overview__chart',
				'googlesitekit-traffic-overview__chart--typical-traffic',
				{
					// The marker's icon sits above the chart area, so the
					// header leaves room for it.
					'googlesitekit-traffic-overview__chart--has-date-marker':
						!! markerDate,
				}
			) }
		>
			<TypicalTrafficChartHeader />
			<GoogleChart
				chartType="LineChart"
				data={ chartData }
				dateMarkers={ dateMarkers }
				height="256px"
				onReady={ positionSelectedRangeRegion }
				options={ options }
				plottedEndDate={ windowEndDate }
				plottedStartDate={ windowStartDate }
				width="100%"
			>
				<SelectedRangeRegion id={ regionID } />
			</GoogleChart>
			<ChartLegend items={ legendItems } />
			{ markerDate && (
				<VisuallyHidden>
					{ sprintf(
						/* translators: %s: the day the property was created, such as "January 15, 2025" */
						__(
							'Google Analytics property created on %s.',
							'google-site-kit'
						),
						dayFormatter.format( stringToDate( markerDate ) )
					) }
				</VisuallyHidden>
			) }
		</div>
	);
};

export default TypicalTrafficChart;
