/**
 * Recent activity traffic breakdown stories.
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
import { FRESH_DATA_FETCH_OPTIONS } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataReport';
import {
	getRecentTopChannelsReportArgs,
	getRecentTopPostsReportArgs,
	getRecentTopReferralsReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { provideRecentTrafficBreakdownReports } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import RecentTrafficBreakdown from './RecentTrafficBreakdown';

/**
 * The date range of the Recent activity tab, from two days before the
 * reference date to the reference date.
 */
const DATE_RANGE = { startDate: '2025-02-03', endDate: '2025-02-05' };

/**
 * Sets the reference date and connects Analytics.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to set up.
 * @return {void}
 */
function commonSetup( registry: WPDataRegistry ) {
	provideSiteInfo( registry );
	registry.dispatch( CORE_USER ).setReferenceDate( DATE_RANGE.endDate );
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
}

interface RecentTrafficBreakdownStoryProps {
	/** Sets the registry state the story needs before it renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
	/** Whether the site has no published posts, which leaves out the "Top posts by visitors" column. */
	hasNoPublishedPosts?: boolean;
}

function Template( {
	setupRegistry,
	hasNoPublishedPosts,
}: RecentTrafficBreakdownStoryProps ) {
	// The styles of `RecentTrafficBreakdown` apply inside the Recent activity
	// panel of the widget, so the stories render the component inside that
	// panel.
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div className="googlesitekit-widget--analyticsTrafficOverview">
				<div className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--recent-activity">
					<RecentTrafficBreakdown
						hasNoPublishedPosts={ hasNoPublishedPosts }
					/>
				</div>
			</div>
		</WithRegistrySetup>
	);
}

/**
 * The `RecentActivity` story of `TrafficOverviewWidget` captures the "What’s
 * affecting recent traffic?" section at the large size, so the `Default`
 * story captures the small size alone, where the three columns stack.
 */
export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideRecentTrafficBreakdownReports( registry, DATE_RANGE );
	},
};
Default.scenario = {
	viewport: 'small',
};

export const Loading = Template.bind( {} ) as Story;
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		// Each column reads its report under the report options and the
		// fetch options, so the resolution starts under both.
		[
			getRecentTopPostsReportArgs( DATE_RANGE ),
			getRecentTopChannelsReportArgs( DATE_RANGE ),
			getRecentTopReferralsReportArgs( DATE_RANGE ),
		].forEach( ( options ) =>
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [
					options,
					FRESH_DATA_FETCH_OPTIONS,
				] )
		);
	},
};

export const OneColumnError = Template.bind( {} ) as Story;
OneColumnError.storyName = 'One Column Error';
OneColumnError.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideRecentTrafficBreakdownReports( registry, DATE_RANGE );

		// A column renders its error in place of its rows.
		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			'getReport',
			[ getRecentTopChannelsReportArgs( DATE_RANGE ) ]
		);
	},
};
OneColumnError.scenario = {
	viewport: 'large',
};

export const ZeroRows = Template.bind( {} ) as Story;
ZeroRows.storyName = 'Zero Rows';
ZeroRows.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		[
			getRecentTopPostsReportArgs( DATE_RANGE ),
			getRecentTopChannelsReportArgs( DATE_RANGE ),
			getRecentTopReferralsReportArgs( DATE_RANGE ),
		].forEach( ( options ) =>
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options } )
		);
	},
};

export const NoPublishedPosts = Template.bind( {} ) as Story;
NoPublishedPosts.storyName = 'No Published Posts';
NoPublishedPosts.args = {
	hasNoPublishedPosts: true,
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideRecentTrafficBreakdownReports( registry, DATE_RANGE );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/RecentTrafficBreakdown',
	component: RecentTrafficBreakdown,
};
