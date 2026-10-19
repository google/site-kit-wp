/**
 * RecentTrafficBreakdown component stories.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createBreakdownReport,
	getRecentTrafficBreakdownReportOptions,
	provideRecentTrafficBreakdownReports,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import RecentTrafficBreakdown, {
	RecentTrafficBreakdownProps,
} from './RecentTrafficBreakdown';
import { FRESH_DATA_FETCH_OPTIONS } from './reportOptions';

// Each report's total also counts the values that its `limit` leaves out.
const POSTS = createBreakdownReport(
	[
		[ '/ice-cream-is-good-for-your-health/', 82 ],
		[ '/use-spf-every-day/', 21 ],
		[ '/stay-hydrated/', 8 ],
	],
	268
);

const POST_TITLES = {
	'/ice-cream-is-good-for-your-health/': 'Ice cream is good for your health',
	'/use-spf-every-day/':
		'Use SPF every day, even for short walks on cloudy days',
	'/stay-hydrated/': 'Stay hydrated',
};

const CHANNELS = createBreakdownReport(
	[
		[ 'Direct', 96 ],
		[ 'Organic Search', 41 ],
		[ 'Organic Social', 17 ],
	],
	157
);

const REFERRALS = createBreakdownReport(
	[
		[ 'substack.com', 7 ],
		[ 'reddit.com', 3 ],
		[ 'medium.com', 2 ],
	],
	14
);

interface RecentTrafficBreakdownStoryProps extends RecentTrafficBreakdownProps {
	/** Sets the registry state the story needs before it renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
	/** Whether to pause the animations at their first frame, so the loading placeholders keep their color in a visual regression test. */
	pauseAnimation?: boolean;
}

function Template( {
	setupRegistry,
	pauseAnimation = false,
	...props
}: RecentTrafficBreakdownStoryProps ) {
	// The section's styles need the widget and panel classes, and the light
	// rails show only on the widget's white background.
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) => {
				provideSiteInfo( registry );
				provideModules( registry );
				provideModuleRegistrations( registry );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );
				// The posts column requests its report only once the setting
				// to include products has loaded.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setFreshDataIncludesWooCommerceProducts( true );
				registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );

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
					<RecentTrafficBreakdown { ...props } />
				</div>
			</div>
		</WithRegistrySetup>
	);
}

/**
 * Shows the three columns side by side from the desktop breakpoint, and
 * stacked below it, as the `medium` and `small` captures show. A long post
 * title and a long referral source are cut short in the narrow columns of the
 * `large` and `small` captures.
 */
export const Loaded = Template.bind(
	{}
) as Story< RecentTrafficBreakdownStoryProps >;
Loaded.storyName = 'Loaded';
Loaded.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		provideRecentTrafficBreakdownReports( registry, {
			posts: POSTS,
			postTitles: POST_TITLES,
			channels: CHANNELS,
			referrals: createBreakdownReport(
				[
					[ 'substack.com', 7 ],
					[ 'reddit.com', 3 ],
					[
						'android-app://com.google.android.googlequicksearchbox',
						2,
					],
				],
				14
			),
		} ),
};
Loaded.scenario = {};

export const Loading = Template.bind(
	{}
) as Story< RecentTrafficBreakdownStoryProps >;
Loading.storyName = 'Loading';
Loading.args = {
	pauseAnimation: true,
	setupRegistry: ( registry: WPDataRegistry ) =>
		Object.values(
			getRecentTrafficBreakdownReportOptions( registry )
		).forEach( ( options ) =>
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [
					options,
					FRESH_DATA_FETCH_OPTIONS,
				] )
		),
};
Loading.scenario = {
	viewport: 'large',
};

/** The report of the channels column fails, and the other two columns keep their rows. */
export const OneColumnErrored = Template.bind(
	{}
) as Story< RecentTrafficBreakdownStoryProps >;
OneColumnErrored.storyName = 'One Column Errored';
OneColumnErrored.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideRecentTrafficBreakdownReports( registry, {
			posts: POSTS,
			postTitles: POST_TITLES,
			referrals: REFERRALS,
		} );

		const { channels } = getRecentTrafficBreakdownReportOptions( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'test_error',
				message:
					'Request contains an invalid argument. Learn more about the Analytics Data API.',
				data: { status: 400, reason: 'badRequest' },
			},
			'getReport',
			[ channels ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [
				channels,
				FRESH_DATA_FETCH_OPTIONS,
			] );
	},
};
OneColumnErrored.scenario = {
	viewport: 'large',
};

/**
 * A report with no rows is what the API returns for a range with no traffic.
 * The referrals column says no traffic came from other sites, and the other
 * two columns say the site had no visitors.
 */
export const ZeroRows = Template.bind(
	{}
) as Story< RecentTrafficBreakdownStoryProps >;
ZeroRows.storyName = 'Zero Rows';
ZeroRows.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		provideRecentTrafficBreakdownReports( registry, {
			posts: {},
			channels: {},
			referrals: {},
		} ),
};
ZeroRows.scenario = {
	viewport: 'large',
};

/** The two columns left on a site with no published posts keep their widths. */
export const NoPublishedPosts = Template.bind(
	{}
) as Story< RecentTrafficBreakdownStoryProps >;
NoPublishedPosts.storyName = 'No Published Posts';
NoPublishedPosts.args = {
	hasNoPublishedPosts: true,
	setupRegistry: ( registry: WPDataRegistry ) =>
		provideRecentTrafficBreakdownReports( registry, {
			channels: CHANNELS,
			referrals: REFERRALS,
		} ),
};
NoPublishedPosts.scenario = {
	viewport: 'large',
};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/RecentTrafficBreakdown',
	component: RecentTrafficBreakdown,
	parameters: { features: [ 'freshData' ] },
};
