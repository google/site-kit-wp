/**
 * Recent activity fresh metrics row stories.
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

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { provideFreshMetricsReports } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { Story } from '@/js/types/Story';
import { provideModules, provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FreshMetricsRow from './FreshMetricsRow';
import {
	FRESH_DATA_FETCH_OPTIONS,
	getSearchPerformanceReportOptions,
	getTimeZoneReportOptions,
} from './reportOptions';
import { getFreshDataWindowStart } from './utils/getFreshDataWindow';

interface FreshMetricsRowStoryProps {
	/** Sets the registry state the story needs before it renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
	/** Whether to pause the animations at their first frame, so the loading placeholders keep their color in a visual regression test. */
	pauseAnimation?: boolean;
}

/**
 * Connects Analytics and Search Console, and says Analytics has finished
 * gathering data.
 *
 * @since 1.191.0
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
		{
			slug: MODULE_SLUG_SEARCH_CONSOLE,
			active: true,
			connected: true,
		},
	] );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( false );
}

function Template( {
	setupRegistry,
	pauseAnimation = false,
}: FreshMetricsRowStoryProps ) {
	// Each story puts in the reports of the last 24 hours from the current
	// time, as `provideFreshMetricsReports()` does.
	const windowStart = getFreshDataWindowStart( Date.now() );

	// The row's styles apply only inside the widget and the Recent activity
	// panel.
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) => {
				commonSetup( registry );
				setupRegistry( registry );
			} }
		>
			<div
				className={ classnames(
					'googlesitekit-widget',
					'googlesitekit-widget--analyticsTrafficOverview',
					{
						'googlesitekit-vrt-animation-paused': pauseAnimation,
					}
				) }
			>
				<div className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--recent-activity">
					<FreshMetricsRow windowStart={ windowStart } />
				</div>
			</div>
		</WithRegistrySetup>
	);
}

/**
 * Shows the two groups side by side from the desktop breakpoint, and stacked
 * below it in the `medium` and `small` captures.
 */
export const Loaded = Template.bind( {} ) as Story< FreshMetricsRowStoryProps >;
Loaded.storyName = 'Loaded';
Loaded.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		provideFreshMetricsReports( registry, {
			totalVisitors: 157,
			searchPerformance: { clicks: 72, impressions: 8000 },
		} ),
};
Loaded.scenario = {};

export const Loading = Template.bind(
	{}
) as Story< FreshMetricsRowStoryProps >;
Loading.storyName = 'Loading';
Loading.args = {
	pauseAnimation: true,
	setupRegistry: ( registry: WPDataRegistry ) => {
		const windowStart = getFreshDataWindowStart( Date.now() );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [
				getTimeZoneReportOptions( windowStart ),
			] );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.startResolution( 'getReport', [
				getSearchPerformanceReportOptions( windowStart ),
				FRESH_DATA_FETCH_OPTIONS,
			] );
	},
};
Loading.scenario = {
	viewport: 'large',
};

/**
 * Neither Analytics nor Search Console has data for the last 24 hours. This
 * story sets no `scenario`, so it runs no visual check; it combines the
 * notices of Analytics Empty and Search Console Empty.
 */
export const ZeroData = Template.bind(
	{}
) as Story< FreshMetricsRowStoryProps >;
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		provideFreshMetricsReports( registry, {
			totalVisitors: 0,
			searchPerformance: { clicks: 0, impressions: 0 },
		} ),
};

/**
 * Analytics counts no visitors in the last 24 hours, so a notice takes the
 * place of the visitors figure, above the search figures.
 */
export const AnalyticsEmpty = Template.bind(
	{}
) as Story< FreshMetricsRowStoryProps >;
AnalyticsEmpty.storyName = 'Analytics Empty';
AnalyticsEmpty.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		provideFreshMetricsReports( registry, {
			totalVisitors: 0,
			searchPerformance: { clicks: 72, impressions: 8000 },
		} ),
};
AnalyticsEmpty.scenario = {};

/**
 * Search Console returns no rows when the site had no impressions in the last
 * 24 hours, so a notice takes the place of the search figures.
 */
export const SearchConsoleEmpty = Template.bind(
	{}
) as Story< FreshMetricsRowStoryProps >;
SearchConsoleEmpty.storyName = 'Search Console Empty';
SearchConsoleEmpty.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideFreshMetricsReports( registry, { totalVisitors: 157 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				getFreshDataWindowStart( Date.now() )
			),
		} );
	},
};
SearchConsoleEmpty.scenario = {
	viewport: 'large',
};

/** The Search Console report fails, and "Total visitors" keeps its figure. */
export const SearchConsoleError = Template.bind(
	{}
) as Story< FreshMetricsRowStoryProps >;
SearchConsoleError.storyName = 'Search Console Error';
SearchConsoleError.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideFreshMetricsReports( registry, { totalVisitors: 157 } );

		const options = getSearchPerformanceReportOptions(
			getFreshDataWindowStart( Date.now() )
		);

		registry.dispatch( MODULES_SEARCH_CONSOLE ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'Request contains an invalid argument.',
				data: { status: 400, reason: 'badRequest' },
			},
			'getReport',
			[ options ]
		);
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.finishResolution( 'getReport', [
				options,
				FRESH_DATA_FETCH_OPTIONS,
			] );
	},
};
SearchConsoleError.scenario = {
	viewport: 'large',
};

/**
 * The report that gives the time zone of the Analytics property fails, and
 * the search figures keep their numbers. This story sets no `scenario`, so it
 * runs no visual check; it looks like Search Console Error on the other side.
 */
export const AnalyticsError = Template.bind(
	{}
) as Story< FreshMetricsRowStoryProps >;
AnalyticsError.storyName = 'Analytics Error';
AnalyticsError.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		const windowStart = getFreshDataWindowStart( Date.now() );
		const options = getTimeZoneReportOptions( windowStart );

		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'Request contains an invalid argument.',
				data: { status: 400, reason: 'badRequest' },
			},
			'getReport',
			[ options ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport(
			[
				{
					keys: [ new Date( windowStart ).toISOString() ],
					clicks: 72,
					impressions: 8000,
				},
			],
			{ options: getSearchPerformanceReportOptions( windowStart ) }
		);
	},
};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/FreshMetricsRow',
	component: FreshMetricsRow,
};
