/**
 * Traffic Overview chart.
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
import { FC, useMemo } from 'react';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import GoogleChart from '@/js/components/GoogleChart';
import VisuallyHidden from '@/js/components/VisuallyHidden';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { getDateString, getLocale, numFmt, stringToDate } from '@/js/util';
import ChartLegend from './ChartLegend';
import { getTrafficChartData } from './getTrafficChartData';
import {
	TRAFFIC_CHART_LINE_COLOR,
	TRAFFIC_CHART_OPTIONS,
} from './trafficChartOptions';

export interface TrafficChartProps {
	/** The daily-visitors report for the selected range. */
	report?: Report;
}

const TrafficChart: FC< TrafficChartProps > = ( { report } ) => {
	const viewOnly = useViewOnly();

	const { startDate, endDate } = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	const daysInRange = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeNumberOfDays(),
		[]
	);

	const propertyCreateTime = useSelect(
		( select: Select ) => {
			// A view-only dashboard never receives the Analytics property's
			// creation time.
			if ( viewOnly ) {
				return undefined;
			}

			return select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();
		},
		[ viewOnly ]
	);

	const { chartData, ticks, hasVisitors } = getTrafficChartData( {
		report,
		startDate,
		endDate,
	} );

	const [ , ...points ] = chartData;

	const options = {
		...TRAFFIC_CHART_OPTIONS,
		hAxis: {
			...TRAFFIC_CHART_OPTIONS.hAxis,
			ticks,
			// A baseline on the last day draws the gray line along the right edge
			// of the chart area.
			baseline: points[ points.length - 1 ]?.[ 0 ],
		},
		vAxis: {
			...TRAFFIC_CHART_OPTIONS.vAxis,
			// With no maximum, Google Charts draws a line of zeros across the
			// middle of the chart area.
			viewWindow: {
				...TRAFFIC_CHART_OPTIONS.vAxis.viewWindow,
				...( hasVisitors ? {} : { max: 100 } ),
			},
		},
	};

	const propertyCreateDate = propertyCreateTime
		? // eslint-disable-next-line sitekit/no-direct-date -- The date comes from the property's creation time, not from the reference date.
		  getDateString( new Date( propertyCreateTime ) )
		: undefined;

	// `GoogleChart` draws a marker only for a day inside the selected range.
	// The screen-reader sentence about that day follows the same rule.
	const markerDate =
		propertyCreateDate &&
		propertyCreateDate >= startDate &&
		propertyCreateDate <= endDate
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
					daysInRange,
					'google-site-kit'
				),
				daysInRange
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

	return (
		<div className="googlesitekit-traffic-overview__chart">
			<GoogleChart
				chartType="LineChart"
				data={ chartData }
				dateMarkers={ dateMarkers }
				height="256px"
				loadingHeight="224px"
				options={ options }
				width="100%"
			/>
			<ChartLegend items={ legendItems } />
			{ points.map( ( [ day, visitors ] ) => (
				<VisuallyHidden key={ getDateString( day ) }>
					{ sprintf(
						/* translators: 1: a day, such as "January 15, 2025". 2: the visitors on that day, such as "1.2K" */
						_n(
							'%1$s: %2$s visitor',
							'%1$s: %2$s visitors',
							visitors,
							'google-site-kit'
						),
						dayFormatter.format( day ),
						numFmt( visitors )
					) }
				</VisuallyHidden>
			) ) }
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

export default TrafficChart;
