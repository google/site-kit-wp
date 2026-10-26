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
import { useTimeoutFn } from 'react-use';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect } from '@wordpress/element';

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
import { useInView } from '@/js/hooks/useInView';
import useViewContext from '@/js/hooks/useViewContext';
import {
	LATEST_POST_RECENT_CONTENT_OPTIONS,
	RECENT_ACTIVITY_ANALYTICS_SETUP_CTA_SLUG,
	RECENT_ACTIVITY_MINIMUM_VIEW_TIME_MILLISECONDS,
	RECENT_ACTIVITY_TAB_ID,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import FreshMetricsRow from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/FreshMetricsRow';
import InsightNotice from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/InsightNotice';
import LatestPostPerformance from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/LatestPostPerformance';
import RecentTrafficBreakdown from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/RecentTrafficBreakdown';
import SeeAllRecentPostsLink from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/SeeAllRecentPostsLink';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import { trackEventOnce } from '@/js/util';

const RecentActivityPanel: FC = () => {
	const viewContext = useViewContext();
	const inView = useInView();

	const isAnalyticsConnected = useSelect(
		( select: Select ) =>
			select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
		[]
	);

	function trackViewAllRecentPosts() {
		trackEventOnce(
			`${ viewContext }_recent-activity`,
			'view_all_recent_posts'
		);
	}

	// The widget mounts only the shown tab's panel, so this timer runs only
	// while Recent activity is shown. The panel mounts again each time the tab
	// is selected, so `trackEventOnce()` keeps the event to one per page view.
	const [ , clearTimer, resetTimer ] = useTimeoutFn(
		trackViewAllRecentPosts,
		RECENT_ACTIVITY_MINIMUM_VIEW_TIME_MILLISECONDS
	);

	// `useInView()` returns the in-view state of the widget area, so the timer
	// starts again from 0 each time the area comes back into view. Without
	// Analytics, Recent activity shows at load as the card's only tab, so the
	// user never chose it, and the timer doesn't run.
	useEffect( () => {
		if ( inView && isAnalyticsConnected ) {
			resetTimer();
		} else {
			clearTimer();
		}
	}, [ clearTimer, inView, isAnalyticsConnected, resetTimer ] );

	const canViewSharedAnalytics4 = useCanViewSharedModule(
		MODULE_SLUG_ANALYTICS_4
	);

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
			{ isAnalyticsConnected && (
				<Fragment>
					{ isGatheringData === true && (
						<GatheringDataNotice style={ NOTICE_STYLE.LARGE } />
					) }
					{ isGatheringData === false && <InsightNotice /> }
					<FreshMetricsRow />
					{ isGatheringData === false && (
						<RecentTrafficBreakdown
							hasNoPublishedPosts={ hasNoPublishedPosts }
						/>
					) }
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
