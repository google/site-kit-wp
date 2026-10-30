/**
 * Recent activity panel.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import ActivateAnalyticsCTA from '@/js/components/ActivateAnalyticsCTA';
import GatheringDataNotice, {
	NOTICE_STYLE,
} from '@/js/components/GatheringDataNotice';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import useCanViewSharedModule from '@/js/hooks/useCanViewSharedModule';
import {
	LATEST_POST_RECENT_CONTENT_OPTIONS,
	RECENT_ACTIVITY_ANALYTICS_SETUP_CTA_SLUG,
	RECENT_ACTIVITY_TAB_ID,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { useRecentActivityPanelState } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useRecentActivityPanelState';
import FreshMetricsRow from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/FreshMetricsRow';
import InsightNotice from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/InsightNotice';
import LatestPostPerformance from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/LatestPostPerformance';
import RecentActivityAccessError from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/RecentActivityAccessError';
import RecentActivityZeroData from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/RecentActivityZeroData';
import RecentTrafficBreakdown from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/RecentTrafficBreakdown';
import SeeAllRecentPostsLink from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/SeeAllRecentPostsLink';
import { getFreshDataWindowStart } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getFreshDataWindow';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';

const RecentActivityPanel: FC = () => {
	const [ windowStart ] = useState( () =>
		// The reference date has no time of day, so the last 24 hours are
		// counted back from the current time. It is read once, so the report
		// options don't change between renders.
		// eslint-disable-next-line sitekit/no-direct-date
		getFreshDataWindowStart( Date.now() )
	);

	const isAnalyticsConnected = useSelect(
		( select: Select ) =>
			select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
		[]
	);

	const canViewSharedAnalytics4 = useCanViewSharedModule(
		MODULE_SLUG_ANALYTICS_4
	);

	const panelState = useRecentActivityPanelState( windowStart );

	const isGatheringData = useInViewSelect< boolean | undefined >(
		( select: Select ) =>
			isAnalyticsConnected && canViewSharedAnalytics4
				? select( MODULES_ANALYTICS_4 ).isGatheringData()
				: undefined,
		[ isAnalyticsConnected, canViewSharedAnalytics4 ]
	);

	const recentContent = useInViewSelect< RecentContentItem[] | undefined >(
		( select: Select ) =>
			isAnalyticsConnected
				? select( MODULES_ANALYTICS_4 ).getRecentContent(
						LATEST_POST_RECENT_CONTENT_OPTIONS
				  )
				: undefined,
		[ isAnalyticsConnected ]
	);

	// Only an empty `recentContent` array means that the site has no
	// published posts, because `recentContent` is `undefined` while it loads
	// and when its request fails.
	const hasNoPublishedPosts = recentContent?.length === 0;

	return (
		<div
			className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--recent-activity"
			role="tabpanel"
			aria-labelledby={ RECENT_ACTIVITY_TAB_ID }
		>
			{ isAnalyticsConnected === false && (
				<ActivateAnalyticsCTA
					analyticsEventLabel="recent_activity"
					dismissedItemSlug={
						RECENT_ACTIVITY_ANALYTICS_SETUP_CTA_SLUG
					}
				/>
			) }
			{ isAnalyticsConnected && panelState === 'access-error' && (
				<RecentActivityAccessError />
			) }
			{ isAnalyticsConnected && panelState !== 'access-error' && (
				<Fragment>
					{ isGatheringData === true && (
						<GatheringDataNotice style={ NOTICE_STYLE.LARGE } />
					) }
					{ panelState === 'zero-data' && <RecentActivityZeroData /> }
					{ panelState === 'default' && (
						<Fragment>
							{ isGatheringData === false && <InsightNotice /> }
							<FreshMetricsRow windowStart={ windowStart } />
							{ isGatheringData === false && (
								<RecentTrafficBreakdown
									hasNoPublishedPosts={ hasNoPublishedPosts }
								/>
							) }
						</Fragment>
					) }
					{ /*
					 * The latest post's own date range starts the day before
					 * the post was published. So it can have data when the
					 * tab's three days have none.
					 */ }
					{ canViewSharedAnalytics4 && ! hasNoPublishedPosts && (
						<Fragment>
							<LatestPostPerformance />
							<SeeAllRecentPostsLink />
						</Fragment>
					) }
				</Fragment>
			) }
		</div>
	);
};

export default RecentActivityPanel;
