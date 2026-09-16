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
import { getGraphReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';
import { getAnalytics4MockResponse } from '@/js/modules/analytics-4/utils/data-mock';
import { Story } from '@/js/types/Story';
import { provideModules, provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import TrafficChart from './TrafficChart';

// `last-28-days` against the `2025-02-05` reference date that `commonSetup` sets
// runs from `2025-01-09` to `2025-02-05`.
const dailyVisitorsReport = getAnalytics4MockResponse(
	getGraphReportArgs( { startDate: '2025-01-09', endDate: '2025-02-05' } )
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

	registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
}

interface TrafficChartStoryProps {
	/** The daily-visitors report the chart shows. */
	report: Report;
	/** Sets the registry state before the story renders. */
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

/**
 * This story runs no visual check, because the `TrafficOverviewWidget` Main
 * Dashboard scenario already captures the chart with visitors.
 */
export const Ready = Template.bind( {} ) as Story< TrafficChartStoryProps >;
Ready.storyName = 'Ready';
Ready.args = {
	report: dailyVisitorsReport,
	setupRegistry: commonSetup,
};

/**
 * A site with no visitors in the whole range. The value axis ends at `100`,
 * and the line runs flat along the bottom.
 */
export const NoVisitors = Template.bind(
	{}
) as Story< TrafficChartStoryProps >;
NoVisitors.storyName = 'No Visitors';
NoVisitors.args = {
	report: { totals: [ { metricValues: [ { value: '0' } ] } ] },
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
	report: {
		...dailyVisitorsReport,
		// The property was created on `2025-01-16`, so the seven days before it
		// have no visitors.
		rows: dailyVisitorsReport.rows.map(
			( row: ReportRow, dayIndex: number ) =>
				dayIndex < 7
					? { ...row, metricValues: [ { value: '0' } ] }
					: row
		),
	},
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

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/TrafficChart',
	component: TrafficChart,
};
