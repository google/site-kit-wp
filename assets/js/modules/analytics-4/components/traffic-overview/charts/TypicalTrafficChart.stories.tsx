/**
 * Typical Traffic Overview chart stories.
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
import { PublishedPost } from './getTypicalTrafficChartData';
import {
	getPlaceholderDailyTraffic,
	getPlaceholderPublishedPosts,
} from './placeholderTrafficChartData';
import TypicalTrafficChart from './TypicalTrafficChart';

const dailyTraffic = getPlaceholderDailyTraffic( '2025-01-09', '2025-02-05' );

// Each post has a URL, so its tooltip links to the Site Kit dashboard for it.
const postsWithURLs = getPlaceholderPublishedPosts( dailyTraffic ).map(
	( post, index ) => ( {
		...post,
		url: `http://example.com/post-${ index + 1 }/`,
	} )
);

/**
 * Connects Analytics and sets one date range, so every story shows the same
 * days.
 *
 * @since n.e.x.t
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

	// The typical traffic view ends its ranges on the day before the reference
	// date, the last full day, so `last-28-days` covers the days of
	// `dailyTraffic`, from `2025-01-09` to `2025-02-05`.
	registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-06' );
	registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
}

interface TypicalTrafficChartStoryProps {
	/** The visits on each day the chart shows, oldest first, each with the bounds of its typical range. */
	dailyTraffic: BenchmarkingDailyTrafficRow[];
	/** Sets the registry state before the story renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
	/** The posts published in the range. */
	publishedPosts?: PublishedPost[];
	/** The number of days of traffic the band is fitted on, which its tooltip names in weeks. */
	bandReferenceDays?: number;
}

function Template( {
	dailyTraffic: storyDailyTraffic,
	setupRegistry,
	gatheringData,
	publishedPosts,
	bandReferenceDays,
}: TypicalTrafficChartStoryProps ) {
	// The chart's styles are scoped to the widget and the panel, so the story
	// renders inside both.
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div className="googlesitekit-widget--analyticsTrafficOverview">
				<div className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--typical-traffic">
					<TypicalTrafficChart
						dailyTraffic={ storyDailyTraffic }
						gatheringData={ gatheringData }
						publishedPosts={ publishedPosts }
						bandReferenceDays={ bandReferenceDays }
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
export const Ready = Template.bind(
	{}
) as Story< TypicalTrafficChartStoryProps >;
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
) as Story< TypicalTrafficChartStoryProps >;
TypicalTrafficRangeAndPublishedPosts.storyName =
	'Typical Traffic Range And Published Posts';
TypicalTrafficRangeAndPublishedPosts.args = {
	dailyTraffic: addTypicalTrafficRange( dailyTraffic ),
	publishedPosts: postsWithURLs,
	// A year of traffic before the range's 28 days.
	bandReferenceDays: 364,
	setupRegistry: commonSetup,
};

/**
 * The pointer is on the day of a published post, so a tooltip over the post's
 * dot shows its title, the day it was published, and a link to the Site Kit
 * dashboard for it.
 */
export const PublishedPostTooltip = Template.bind(
	{}
) as Story< TypicalTrafficChartStoryProps >;
PublishedPostTooltip.storyName = 'Published Post Tooltip';
PublishedPostTooltip.args = {
	dailyTraffic: addTypicalTrafficRange( dailyTraffic ),
	publishedPosts: postsWithURLs,
	bandReferenceDays: 364,
	setupRegistry: commonSetup,
};
PublishedPostTooltip.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	// The first post's dot. The visual regression tests read the scenario from
	// the source, so the selector must be a literal: the fill is
	// `PUBLISHED_POST_COLOR`.
	hoverSelector: '[id^="googlesitekit-chart-"] svg circle[fill="#a983e6"]',
	postInteractionWait: 500,
	viewport: 'large',
};

/**
 * A range with no daily traffic. The value axis ends at `100`, and the line
 * runs flat along the bottom.
 */
export const NoVisitors = Template.bind(
	{}
) as Story< TypicalTrafficChartStoryProps >;
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
) as Story< TypicalTrafficChartStoryProps >;
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
) as Story< TypicalTrafficChartStoryProps >;
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
	title: 'Modules/Analytics4/Components/Traffic Overview/TypicalTrafficChart',
	component: TypicalTrafficChart,
};
