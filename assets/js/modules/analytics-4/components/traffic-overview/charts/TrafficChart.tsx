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
import { Fragment, createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import GoogleChart from '@/js/components/GoogleChart';
import Link from '@/js/components/Link';
import VisuallyHidden from '@/js/components/VisuallyHidden';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getPropertyCreateDate } from '@/js/modules/analytics-4/utils/property-create-date';
import { getDateString, getLocale, numFmt, stringToDate } from '@/js/util';
import ChartLegend, { ChartLegendItem } from './ChartLegend';
import { getPropertyCreatedDateMarkers } from './getPropertyCreatedDateMarkers';
import { getPropertyCreatedMarkerDate } from './getPropertyCreatedMarkerDate';
import {
	PublishedPost,
	TypicalTrafficRangeDay,
	getTrafficChartData,
} from './getTrafficChartData';
import { getTrafficLegendItem } from './getTrafficLegendItem';
import PropertyCreatedScreenReaderText from './PropertyCreatedScreenReaderText';
import {
	PUBLISHED_POST_COLOR,
	TRAFFIC_CHART_OPTIONS,
	TYPICAL_TRAFFIC_RANGE_COLOR,
} from './trafficChartOptions';

export interface TrafficChartProps {
	/** The visits on each day of the selected range, oldest first. */
	dailyTraffic?: BenchmarkingDailyTrafficRow[];
	/** Whether the daily traffic has arrived. */
	loaded?: boolean;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
	/** The typical range of visitors for each day that has one, which the chart draws as a band behind the line. */
	typicalTrafficRange?: TypicalTrafficRangeDay[];
	/** The posts published in the selected range. The chart marks the day of each with a dot on the line. */
	publishedPosts?: PublishedPost[];
}

const TrafficChart: FC< TrafficChartProps > = ( {
	dailyTraffic,
	loaded = true,
	gatheringData = false,
	typicalTrafficRange,
	publishedPosts,
} ) => {
	const { startDate, endDate } = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	const daysInRange = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeNumberOfDays(),
		[]
	);

	const propertyCreateTime = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPropertyCreateTime(),
		[]
	);

	const {
		chartData,
		days,
		ticks,
		hasVisitors,
		hasTypicalTrafficRange,
		hasPublishedPosts,
	} = getTrafficChartData( {
		dailyTraffic,
		startDate,
		endDate,
		gatheringData,
		typicalTrafficRange,
		publishedPosts,
	} );

	const options = {
		...TRAFFIC_CHART_OPTIONS,
		hAxis: {
			...TRAFFIC_CHART_OPTIONS.hAxis,
			ticks,
			// A baseline on the last day draws the gray line along the right edge
			// of the chart area.
			baseline: days[ days.length - 1 ]?.date,
			// `getChartOptions()` drops the ticks while the property is gathering
			// data unless the chart sets a horizontal view window of its own.
			...( gatheringData && {
				viewWindow: {
					min: stringToDate( startDate ),
					max: stringToDate( endDate ),
				},
			} ),
		},
		vAxis: {
			...TRAFFIC_CHART_OPTIONS.vAxis,
			// With nothing above zero and no maximum, Google Charts draws a line
			// of zeros across the middle of the chart area. Otherwise, it ends
			// the axis above both the line and the typical range.
			viewWindow: {
				...TRAFFIC_CHART_OPTIONS.vAxis.viewWindow,
				...( hasVisitors || hasTypicalTrafficRange
					? {}
					: { max: 100 } ),
			},
		},
	};

	const legendItems: ChartLegendItem[] = [
		getTrafficLegendItem( daysInRange ),
	];

	if ( hasTypicalTrafficRange ) {
		legendItems.push( {
			label: __( 'Typical traffic range', 'google-site-kit' ),
			color: TYPICAL_TRAFFIC_RANGE_COLOR,
			swatch: 'area',
			info: createInterpolateElement(
				__(
					'Site Kit analyzes the last 18 months of your traffic history to estimate a typical range, so you can see when visits are higher or lower than expected. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					// TODO: Point the link at the typical traffic range's support
					// page.
					a: <Link href="#" external hideExternalIndicator />,
				}
			),
			isBeta: true,
		} );
	}

	if ( hasPublishedPosts ) {
		legendItems.push( {
			label: __( 'Published post', 'google-site-kit' ),
			color: PUBLISHED_POST_COLOR,
			swatch: 'dot',
		} );
	}

	const propertyCreateDate = getPropertyCreateDate( propertyCreateTime );

	// `GoogleChart` draws a marker only for a day inside the selected range.
	// The screen-reader sentence about that day follows the same rule.
	const markerDate = getPropertyCreatedMarkerDate(
		propertyCreateDate,
		startDate,
		endDate
	);

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
				dateMarkers={ getPropertyCreatedDateMarkers( markerDate ) }
				gatheringData={ gatheringData }
				height="256px"
				loaded={ loaded }
				loadingHeight="276px"
				options={ options }
				width="100%"
			/>
			{ loaded && <ChartLegend items={ legendItems } /> }
			{ loaded &&
				! gatheringData &&
				days.map( ( { date, visitors, typicalRange, posts } ) => (
					<Fragment key={ getDateString( date ) }>
						<VisuallyHidden>
							{ typicalRange
								? sprintf(
										/* translators: 1: a day, such as "January 15, 2025". 2: the visitors on that day, such as "1.2K". 3: the fewest visitors that are typical for that day. 4: the most visitors that are typical for that day */
										_n(
											'%1$s: %2$s visitor, typical range %3$s to %4$s',
											'%1$s: %2$s visitors, typical range %3$s to %4$s',
											visitors,
											'google-site-kit'
										),
										dayFormatter.format( date ),
										numFmt( visitors ),
										numFmt( typicalRange.min ),
										numFmt( typicalRange.max )
								  )
								: sprintf(
										/* translators: 1: a day, such as "January 15, 2025". 2: the visitors on that day, such as "1.2K" */
										_n(
											'%1$s: %2$s visitor',
											'%1$s: %2$s visitors',
											visitors,
											'google-site-kit'
										),
										dayFormatter.format( date ),
										numFmt( visitors )
								  ) }
						</VisuallyHidden>
						{ posts.map( ( { title }, index ) => (
							// Keyed by position: two posts on one day can share a
							// title, and nothing here reorders them.
							<VisuallyHidden key={ index }>
								{ sprintf(
									/* translators: 1: a day, such as "January 15, 2025". 2: the title of the post published on that day */
									__(
										'Post published on %1$s: %2$s',
										'google-site-kit'
									),
									dayFormatter.format( date ),
									title
								) }
							</VisuallyHidden>
						) ) }
					</Fragment>
				) ) }
			{ loaded && markerDate && (
				<PropertyCreatedScreenReaderText date={ markerDate } />
			) }
		</div>
	);
};

export default TrafficChart;
