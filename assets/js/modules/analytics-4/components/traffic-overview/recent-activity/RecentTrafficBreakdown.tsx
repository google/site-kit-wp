/**
 * Recent activity traffic breakdown.
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
import { useInstanceId } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';
import { useFreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import { useFreshDataReport } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataReport';
import {
	getRecentTopChannelsReportArgs,
	getRecentTopPostsReportArgs,
	getRecentTopReferralsReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { getRecentTrafficBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/utils/getRecentTrafficBreakdownRows';
import RecentTrafficBreakdownColumn from './RecentTrafficBreakdownColumn';
import TopPostsColumn from './TopPostsColumn';

export interface RecentTrafficBreakdownProps {
	/** Whether the site has no published posts, which leaves out the "Top posts by visitors" column. */
	hasNoPublishedPosts?: boolean;
}

const RecentTrafficBreakdown: FC< RecentTrafficBreakdownProps > = ( {
	hasNoPublishedPosts = false,
} ) => {
	const headingID = String(
		useInstanceId(
			RecentTrafficBreakdown,
			'googlesitekit-traffic-overview__recent-traffic-breakdown-heading'
		)
	);

	const dateRange = useFreshDataDateRange();

	const [
		topPostsReportArgs,
		topChannelsReportArgs,
		topReferralsReportArgs,
	] = useMemo(
		() => [
			getRecentTopPostsReportArgs( dateRange ),
			getRecentTopChannelsReportArgs( dateRange ),
			getRecentTopReferralsReportArgs( dateRange ),
		],
		[ dateRange ]
	);

	// The posts column requests its own report, so nothing requests that
	// report while the site has no published posts.
	const topChannels = useFreshDataReport( topChannelsReportArgs );
	const topReferrals = useFreshDataReport( topReferralsReportArgs );

	return (
		<section
			className="googlesitekit-traffic-overview__recent-traffic-breakdown"
			aria-labelledby={ headingID }
		>
			<Typography
				as="h3"
				type={ TYPE_TITLE }
				size={ SIZE_MEDIUM }
				id={ headingID }
				className="googlesitekit-traffic-overview__recent-traffic-breakdown-heading"
			>
				{ __( 'What’s affecting recent traffic?', 'google-site-kit' ) }
			</Typography>
			<div className="googlesitekit-traffic-overview__recent-traffic-breakdown-columns">
				{ ! hasNoPublishedPosts && (
					<TopPostsColumn reportArgs={ topPostsReportArgs } />
				) }
				<RecentTrafficBreakdownColumn
					title={ __(
						'Top channels by visitors',
						'google-site-kit'
					) }
					rows={ getRecentTrafficBreakdownRows( topChannels.report ) }
					loading={ topChannels.loading }
					error={ topChannels.error }
					onRetry={ topChannels.retry }
				/>
				<RecentTrafficBreakdownColumn
					title={ __(
						'Top referrals by visitors',
						'google-site-kit'
					) }
					rows={ getRecentTrafficBreakdownRows(
						topReferrals.report
					) }
					loading={ topReferrals.loading }
					error={ topReferrals.error }
					onRetry={ topReferrals.retry }
				/>
			</div>
		</section>
	);
};

export default RecentTrafficBreakdown;
