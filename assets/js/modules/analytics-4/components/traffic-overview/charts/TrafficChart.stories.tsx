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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { Story } from '@/js/types/Story';
import { getPreviousDate } from '@/js/util';
import { provideModules, provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import { createDailyVisitorsReport } from './test-utils';
import TrafficChart from './TrafficChart';

/** The visitors on each day of the range, from its first day. */
const DAILY_VISITORS = [
	120, 138, 96, 74, 151, 164, 149, 181, 158, 203, 226, 198, 174, 212, 245,
	231, 268, 254, 289, 262, 240, 277, 305, 291, 268, 314, 336, 322,
];

/**
 * Builds a daily-visitors report over `last-28-days`.
 *
 * @since n.e.x.t
 *
 * @param {Array<number>} dailyVisitors The visitors on each day, from the range's first day.
 * @return {Object} The daily-visitors report.
 */
function createReport( dailyVisitors: number[] ): Report {
	return createDailyVisitorsReport(
		dailyVisitors.map( ( visitors, dayIndex ) => [
			// `2025-01-09` is the first day of `last-28-days` against the
			// reference date `commonSetup` sets.
			getPreviousDate( '2025-01-09', -dayIndex ),
			visitors,
		] )
	);
}

/**
 * Connects Analytics and fixes the date range, so every story shows the same
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

	registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
}

interface TrafficChartStoryProps {
	/** The daily-visitors report the chart shows. */
	report: Report;
	/** Sets the registry state the story needs before it renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
}

function Template( { report, setupRegistry }: TrafficChartStoryProps ) {
	// The chart's styles are scoped to the widget and the panel, so the story
	// renders inside both.
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div className="googlesitekit-widget--analyticsTrafficOverview">
				<div className="googlesitekit-traffic-overview__panel">
					<TrafficChart report={ report } />
				</div>
			</div>
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} ) as Story< TrafficChartStoryProps >;
Ready.storyName = 'Ready';
Ready.args = {
	report: createReport( DAILY_VISITORS ),
	setupRegistry: commonSetup,
};

/**
 * A range with no traffic comes back with a zero total and no rows. The value
 * axis ends at `100`. The line runs flat along the bottom.
 */
export const NoVisitors = Template.bind(
	{}
) as Story< TrafficChartStoryProps >;
NoVisitors.storyName = 'No Visitors';
NoVisitors.args = {
	report: { totals: [ { metricValues: [ { value: '0' } ] } ] },
	setupRegistry: commonSetup,
};
NoVisitors.scenario = { viewport: 'large' };

/**
 * The property was created inside the range. The chart marks that day, which
 * explains the days at zero before it.
 */
export const PropertyCreatedInRange = Template.bind(
	{}
) as Story< TrafficChartStoryProps >;
PropertyCreatedInRange.storyName = 'Property Created In Range';
PropertyCreatedInRange.args = {
	report: createReport(
		DAILY_VISITORS.map( ( visitors, dayIndex ) =>
			dayIndex < 7 ? 0 : visitors
		)
	),
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyCreateTime( '2025-01-16T12:00:00' );
	},
};
PropertyCreatedInRange.scenario = { viewport: 'large' };

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TrafficChart',
	component: TrafficChart,
};
