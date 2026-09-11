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
import { FC } from 'react';

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
import { getTrafficChartData } from './getTrafficChartData';
import { TRAFFIC_CHART_OPTIONS } from './trafficChartOptions';

export interface TrafficChartProps {
	/** The daily-visitors report over the selected range. */
	report?: Report;
}

const TrafficChart: FC< TrafficChartProps > = ( { report } ) => {
	const viewOnly = useViewOnly();

	const { startDate, endDate } = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	const propertyCreateTime = useSelect(
		( select: Select ) => {
			// A view-only dashboard never receives the property's creation time.
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
		},
		vAxis: {
			...TRAFFIC_CHART_OPTIONS.vAxis,
			// Google Charts fits the axis to the data. With no top set, a
			// range where every day is zero draws the line across the middle.
			viewWindow: {
				...TRAFFIC_CHART_OPTIONS.vAxis.viewWindow,
				...( hasVisitors ? {} : { max: 100 } ),
			},
		},
	};

	const propertyCreateDate = propertyCreateTime
		? // Valid use of `new Date()` with an argument.
		  // eslint-disable-next-line sitekit/no-direct-date
		  getDateString( new Date( propertyCreateTime ) )
		: undefined;

	// `GoogleChart` shows a marker only for a date inside the selected range,
	// so the screen-reader line for the creation date checks the range too.
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

	const dayFormat = new Intl.DateTimeFormat( getLocale(), {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	} );

	return (
		<div className="googlesitekit-traffic-overview__chart">
			<GoogleChart
				chartType="LineChart"
				data={ chartData }
				dateMarkers={ dateMarkers }
				height="248px"
				loadingHeight="224px"
				options={ options }
				width="100%"
			/>
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
						dayFormat.format( day ),
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
						dayFormat.format( stringToDate( markerDate ) )
					) }
				</VisuallyHidden>
			) }
		</div>
	);
};

export default TrafficChart;
