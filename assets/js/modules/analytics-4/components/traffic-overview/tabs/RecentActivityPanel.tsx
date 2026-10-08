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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import ActivateAnalyticsCTA from '@/js/components/ActivateAnalyticsCTA';
import Notice from '@/js/components/Notice';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import {
	RECENT_ACTIVITY_ANALYTICS_SETUP_CTA_SLUG,
	RECENT_ACTIVITY_TAB_ID,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import FreshMetricsRow from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/FreshMetricsRow';
import InsightNotice from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/InsightNotice';
import LatestPostPerformance from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/LatestPostPerformance';
import RecentTrafficBreakdown from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/RecentTrafficBreakdown';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';

const RecentActivityPanel: FC = () => {
	const viewOnly = useViewOnly();

	const isAnalyticsConnected = useSelect(
		( select: Select ) =>
			select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
		[]
	);

	const canViewSharedAnalytics4 = useSelect(
		( select: Select ) => {
			if ( ! viewOnly ) {
				return true;
			}

			return select( CORE_USER ).canViewSharedModule(
				MODULE_SLUG_ANALYTICS_4
			);
		},
		[ viewOnly ]
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
				? select( MODULES_ANALYTICS_4 ).getRecentContent( { count: 1 } )
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
						<Notice
							title={ __(
								'No recent visitor data yet',
								'google-site-kit'
							) }
							description={ __(
								'Analytics hasn’t reported any visits in the last 24 hours. Data may still be on its way.',
								'google-site-kit'
							) }
						/>
					) }
					{ isGatheringData === false && <InsightNotice /> }
					<FreshMetricsRow />
					{ isGatheringData === false && <RecentTrafficBreakdown /> }
					{ ! hasNoPublishedPosts && <LatestPostPerformance /> }
				</Fragment>
			) }
		</div>
	);
};

export default RecentActivityPanel;
