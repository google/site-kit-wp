/**
 * Typical Traffic Overview chart.
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
import { FC, useMemo, useRef } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import GoogleChart from '@/js/components/GoogleChart';
import VisuallyHidden from '@/js/components/VisuallyHidden';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getPropertyCreateDate } from '@/js/modules/analytics-4/utils/property-create-date';
import { getDateString, getLocale, numFmt, stringToDate } from '@/js/util';
import { getPropertyCreatedDateMarkers } from './getPropertyCreatedDateMarkers';
import { getPropertyCreatedMarkerDate } from './getPropertyCreatedMarkerDate';
import { getTrafficLegendItem } from './getTrafficLegendItem';
import {
	PublishedPost,
	getTypicalTrafficChartData,
} from './getTypicalTrafficChartData';
import { getTypicalTrafficLegendItem } from './getTypicalTrafficLegendItem';
import PropertyCreatedScreenReaderText from './PropertyCreatedScreenReaderText';
import PublishedPostTooltip, {
	PublishedPostTooltipHandle,
} from './PublishedPostTooltip';
import TypicalChartLegend, {
	TypicalChartLegendItem,
} from './TypicalChartLegend';
import {
	PUBLISHED_POST_COLOR,
	TYPICAL_TRAFFIC_CHART_OPTIONS,
} from './typicalTrafficChartOptions';

/** What Google Charts reports when the pointer moves onto or off a day. */
interface ChartMouseEvent {
	/** The day's row in the chart table, which has one row for each day the chart plots. */
	row: number | null;
}

/** The chart that reported a mouse event, as `GoogleChart` passes it. */
interface ChartMouseEventContext {
	chartWrapper: {
		getChart: () => {
			getChartLayoutInterface: () => {
				getXLocation: ( value: Date ) => number;
				getYLocation: ( value: number, axisIndex?: number ) => number;
			};
		};
	};
}

export interface TypicalTrafficChartProps {
	/** The visits on each day of the selected range, oldest first. The bounds on each day's row are its typical range, which the chart draws as a band behind the line. The band covers the whole range or none of it, so the chart leaves it out when a day has null bounds. */
	dailyTraffic?: BenchmarkingDailyTrafficRow[];
	/** Whether the daily traffic has arrived. */
	loaded?: boolean;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
	/** The posts published in the selected range. The chart marks the day of each with a dot on the line. */
	publishedPosts?: PublishedPost[];
	/** The number of days of traffic the band of the range's last day is fitted on, which the band's tooltip names in weeks. Without it, the band has no tooltip. */
	bandReferenceDays?: number | null;
	/** Whether the site's history reaches the same time last year, which the band's tooltip then mentions. */
	lastYearAvailable?: boolean;
}

const TypicalTrafficChart: FC< TypicalTrafficChartProps > = ( {
	dailyTraffic,
	loaded = true,
	gatheringData = false,
	publishedPosts,
	bandReferenceDays,
	lastYearAvailable,
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
		hasVisits,
		hasTypicalTrafficRange,
		hasPublishedPosts,
	} = getTypicalTrafficChartData( {
		dailyTraffic,
		startDate,
		endDate,
		gatheringData,
		publishedPosts,
	} );

	const options = {
		...TYPICAL_TRAFFIC_CHART_OPTIONS,
		hAxis: {
			...TYPICAL_TRAFFIC_CHART_OPTIONS.hAxis,
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
			...TYPICAL_TRAFFIC_CHART_OPTIONS.vAxis,
			// With nothing above zero and no maximum, Google Charts draws a line
			// of zeros across the middle of the chart area. Otherwise, it ends
			// the axis above both the line and the typical range.
			viewWindow: {
				...TYPICAL_TRAFFIC_CHART_OPTIONS.vAxis.viewWindow,
				...( hasVisits || hasTypicalTrafficRange ? {} : { max: 100 } ),
			},
		},
	};

	const legendItems: TypicalChartLegendItem[] = [
		getTrafficLegendItem( daysInRange ),
	];

	if ( hasTypicalTrafficRange ) {
		legendItems.push(
			getTypicalTrafficLegendItem( {
				referenceDays: bandReferenceDays,
				lastYearAvailable,
			} )
		);
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

	// The tooltip keeps the hovered day in its own state: a render of the
	// chart here would make Google Charts draw it again.
	const postTooltipRef = useRef< PublishedPostTooltipHandle >( null );

	function handleChartMouseOver(
		{ row }: ChartMouseEvent,
		{ chartWrapper }: ChartMouseEventContext
	) {
		const day = row === null ? undefined : days[ row ];

		if ( ! day?.posts.length ) {
			postTooltipRef.current?.hide();
			return;
		}

		const chartLayout = chartWrapper.getChart().getChartLayoutInterface();

		postTooltipRef.current?.show( {
			date: day.date,
			posts: day.posts,
			x: chartLayout.getXLocation( day.date ),
			// The line plots against the second value axis.
			y: chartLayout.getYLocation( day.visits, 1 ),
		} );
	}

	function handleChartMouseOut() {
		postTooltipRef.current?.hide();
	}

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
				onMouseOver={
					hasPublishedPosts ? handleChartMouseOver : undefined
				}
				onMouseOut={
					hasPublishedPosts ? handleChartMouseOut : undefined
				}
				options={ options }
				width="100%"
			>
				{ hasPublishedPosts && (
					<PublishedPostTooltip ref={ postTooltipRef } />
				) }
			</GoogleChart>
			{ loaded && <TypicalChartLegend items={ legendItems } /> }
			{ loaded &&
				! gatheringData &&
				days.map( ( { date, visits, typicalRange, posts } ) => (
					<Fragment key={ getDateString( date ) }>
						<VisuallyHidden>
							{ typicalRange
								? sprintf(
										/* translators: 1: a day, such as "January 15, 2025". 2: the visits on that day, such as "1.2K". 3: the fewest visits that are typical for that day. 4: the most visits that are typical for that day */
										_n(
											'%1$s: %2$s visit, typical range %3$s to %4$s',
											'%1$s: %2$s visits, typical range %3$s to %4$s',
											visits,
											'google-site-kit'
										),
										dayFormatter.format( date ),
										numFmt( visits ),
										numFmt( typicalRange.min ),
										numFmt( typicalRange.max )
								  )
								: sprintf(
										/* translators: 1: a day, such as "January 15, 2025". 2: the visits on that day, such as "1.2K" */
										_n(
											'%1$s: %2$s visit',
											'%1$s: %2$s visits',
											visits,
											'google-site-kit'
										),
										dayFormatter.format( date ),
										numFmt( visits )
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

export default TypicalTrafficChart;
