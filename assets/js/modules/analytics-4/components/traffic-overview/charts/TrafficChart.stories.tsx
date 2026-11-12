/**
 * Traffic Overview chart stories.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { addTypicalTrafficRange } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { Story } from '@/js/types/Story';
import { provideModules, provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import { PublishedPost } from './getTrafficChartData';
import {
	getPlaceholderDailyTraffic,
	getPlaceholderPublishedPosts,
} from './placeholderTrafficChartData';
import TrafficChart from './TrafficChart';

const dailyTraffic = getPlaceholderDailyTraffic( '2025-01-09', '2025-02-05' );

/**
 * Connects Analytics and sets one date range, so every story shows the same
 * days.
 *
 * @since 1.189.0
 *
 * @param {Object} registry The registry to set up.
 * @return {void}
 */
function commonSetup( registry: WPDataRegistry ) {
	provideSiteInfo( registry );
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: true,
		},
	] );

	registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
}

interface TrafficChartStoryProps {
	/** The visits on each day the chart shows, oldest first, each with the bounds of its typical range. */
	dailyTraffic: BenchmarkingDailyTrafficRow[];
	/** Sets the registry state before the story renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
	/** The posts published in the range. */
	publishedPosts?: PublishedPost[];
}

function Template( {
	dailyTraffic: storyDailyTraffic,
	setupRegistry,
	gatheringData,
	publishedPosts,
}: TrafficChartStoryProps ) {
	// The chart's styles are scoped to the widget and the panel, so the story
	// renders inside both.
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div className="googlesitekit-widget--analyticsTrafficOverview">
				<div className="googlesitekit-traffic-overview__panel">
					<TrafficChart
						dailyTraffic={ storyDailyTraffic }
						gatheringData={ gatheringData }
						publishedPosts={ publishedPosts }
					/>
				</div>
			</div>
		</WithRegistrySetup>
	);
}

/**
 * This story runs no visual check, because the `TrafficOverviewWidget` Main
 * Dashboard scenario already captures the chart with visits.
 */
export const Ready = Template.bind( {} ) as Story< TrafficChartStoryProps >;
Ready.storyName = 'Ready';
Ready.args = {
	dailyTraffic,
	setupRegistry: commonSetup,
};

/**
 * The band behind the line is the typical range of visits for each day, and a
 * dot on the line marks each day with a published post. This story runs no
 * visual check, because the `TrafficOverviewWidget` Typical Traffic scenario
 * already captures the chart with both.
 */
export const TypicalTrafficRangeAndPublishedPosts = Template.bind(
	{}
) as Story< TrafficChartStoryProps >;
TypicalTrafficRangeAndPublishedPosts.storyName =
	'Typical Traffic Range And Published Posts';
TypicalTrafficRangeAndPublishedPosts.args = {
	dailyTraffic: addTypicalTrafficRange( dailyTraffic ),
	publishedPosts: getPlaceholderPublishedPosts( dailyTraffic ),
	setupRegistry: commonSetup,
};

/**
 * The site recorded its first traffic partway into the range, so the days
 * before its 28th day of traffic have no typical range. The band starts on
 * that day, and the line on the first day of the range.
 */
export const TypicalTrafficRangeFromPartwayIntoTheRange = Template.bind(
	{}
) as Story< TrafficChartStoryProps >;
TypicalTrafficRangeFromPartwayIntoTheRange.storyName =
	'Typical Traffic Range From Partway Into The Range';
TypicalTrafficRangeFromPartwayIntoTheRange.args = {
	dailyTraffic: addTypicalTrafficRange( dailyTraffic ).map(
		( day, dayIndex ) =>
			dayIndex < 10
				? { ...day, expectedMin: null, expectedMax: null }
				: day
	),
	setupRegistry: commonSetup,
};
TypicalTrafficRangeFromPartwayIntoTheRange.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	viewport: 'large',
};

/**
 * A range with no daily traffic. The value axis ends at `100`, and the line
 * runs flat along the bottom.
 */
export const NoVisitors = Template.bind(
	{}
) as Story< TrafficChartStoryProps >;
NoVisitors.storyName = 'No Visitors';
NoVisitors.args = {
	dailyTraffic: [],
	setupRegistry: commonSetup,
};
NoVisitors.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	viewport: 'large',
};

/**
 * The Analytics property was created on a day inside the range. The chart marks
 * that day, which explains the days at zero before it.
 */
export const PropertyCreatedInRange = Template.bind(
	{}
) as Story< TrafficChartStoryProps >;
PropertyCreatedInRange.storyName = 'Property Created In Range';
PropertyCreatedInRange.args = {
	// The property was created on `2025-01-16`, so the seven days before it
	// have no visits.
	dailyTraffic: dailyTraffic.map( ( row, dayIndex ) =>
		dayIndex < 7 ? { ...row, visits: 0 } : row
	),
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyCreateTime( '2025-01-16T12:00:00' );
	},
};
PropertyCreatedInRange.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	viewport: 'large',
};

/**
 * The Analytics property is still gathering data, on the shortest range the
 * chart offers. The line runs flat along the bottom, under one date label per
 * day.
 */
export const GatheringData = Template.bind(
	{}
) as Story< TrafficChartStoryProps >;
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	dailyTraffic,
	gatheringData: true,
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );
	},
};
GatheringData.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	viewport: 'large',
};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TrafficChart',
	component: TrafficChart,
};
