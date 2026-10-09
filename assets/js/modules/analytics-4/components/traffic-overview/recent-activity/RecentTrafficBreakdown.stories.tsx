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
import { FRESH_DATA_REPORT_FETCH_OPTIONS } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
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

const POSTS = createBreakdownReport( [
	[ '/ice-cream-is-good-for-your-health/', 82 ],
	[ '/use-spf-every-day/', 21 ],
	[ '/stay-hydrated/', 8 ],
	[ '/summer-hats/', 5 ],
	[ '/beach-reads/', 4 ],
] );

const POST_TITLES = {
	'/ice-cream-is-good-for-your-health/': 'Ice cream is good for your health',
	'/use-spf-every-day/': 'Use SPF every day, even for short walks',
	'/stay-hydrated/': 'Stay hydrated',
};

const CHANNELS = createBreakdownReport( [
	[ 'Direct', 96 ],
	[ 'Organic Search', 41 ],
	[ 'Organic Social', 17 ],
	[ 'Referral', 12 ],
	[ 'Email', 4 ],
] );

const REFERRALS = createBreakdownReport( [
	[ 'substack.com', 7 ],
	[ 'reddit.com', 3 ],
	[ 'medium.com', 2 ],
] );

interface RecentTrafficBreakdownStoryProps extends RecentTrafficBreakdownProps {
	/** Sets the registry state the story needs before it renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
	/**
	 * Whether the story pauses its animations. The loading placeholders get
	 * their colour from an animation, which the visual regression tests turn
	 * off unless it is paused.
	 */
	pauseAnimation?: boolean;
}

function Template( {
	setupRegistry,
	pauseAnimation = false,
	...props
}: RecentTrafficBreakdownStoryProps ) {
	function setup( registry: WPDataRegistry ) {
		provideSiteInfo( registry );
		// A column with a report error reads the module list and the
		// Analytics settings.
		provideModules( registry );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		setupRegistry( registry );
	}

	// The section's styles are scoped to the widget and to the Recent activity
	// panel, so the story renders inside both. The widget's white background
	// lets the light rails and loading placeholders show.
	return (
		<WithRegistrySetup func={ setup }>
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
 * The three columns side by side from the desktop breakpoint, and stacked
 * below it, as the `medium` and `small` captures show.
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
			referrals: REFERRALS,
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
					FRESH_DATA_REPORT_FETCH_OPTIONS,
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
				FRESH_DATA_REPORT_FETCH_OPTIONS,
			] );
	},
};
OneColumnErrored.scenario = {
	viewport: 'large',
};

/** A report with no rows is what the API returns for a range with no traffic. */
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

/**
 * Titles and sources that have to be cut short, counts in the thousands, and
 * the widest shares, "(>99.9%)" and "(<0.1%)", whose counts still line up.
 */
export const LongTitlesAndExtremeShares = Template.bind(
	{}
) as Story< RecentTrafficBreakdownStoryProps >;
LongTitlesAndExtremeShares.storyName = 'Long Titles and Extreme Shares';
LongTitlesAndExtremeShares.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		provideRecentTrafficBreakdownReports( registry, {
			posts: createBreakdownReport( [
				[ '/how-to-choose-store-and-serve-ice-cream/', 1840 ],
				[ '/sunscreen-myths/', 1206 ],
				[ '/hydration/', 9 ],
			] ),
			postTitles: {
				'/how-to-choose-store-and-serve-ice-cream/':
					'The complete guide to choosing, storing and serving ice cream on the hottest days of the summer',
				'/sunscreen-myths/':
					'Seven sunscreen myths that dermatologists wish you would stop believing',
				'/hydration/': 'Stay hydrated',
			},
			channels: createBreakdownReport( [
				[ 'Direct', 2999 ],
				[ 'Mobile Push Notifications', 1 ],
			] ),
			referrals: createBreakdownReport( [
				[ 'android-app://com.google.android.googlequicksearchbox', 46 ],
				[
					'newsletter.an-example-publication-with-a-long-name.com',
					31,
				],
				[ 'reddit.com', 3 ],
			] ),
		} ),
};
LongTitlesAndExtremeShares.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/RecentTrafficBreakdown',
	component: RecentTrafficBreakdown,
};
