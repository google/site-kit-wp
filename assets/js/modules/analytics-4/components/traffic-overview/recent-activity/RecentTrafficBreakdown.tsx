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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { TableTile } from '@/js/modules/analytics-4/components/common/tiles';
import { useFreshDataReport } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataReport';
import { isZeroReport } from '@/js/modules/analytics-4/utils/is-zero-report';
import PlainPermalinkTopPostsColumn from './PlainPermalinkTopPostsColumn';
import { getTopChannelsReportOptions } from './reportOptions';
import TopChannelsColumn from './TopChannelsColumn';
import TopPostsColumn from './TopPostsColumn';
import TopReferralsColumn from './TopReferralsColumn';

export interface RecentTrafficBreakdownProps {
	/** Whether the site has no published posts, which leaves out the "Top posts by visitors" column. */
	hasNoPublishedPosts?: boolean;
}

const RecentTrafficBreakdown: FC< RecentTrafficBreakdownProps > = ( {
	hasNoPublishedPosts = false,
} ) => {
	// `useInstanceId` is typed as `string | number`, and `aria-labelledby`
	// takes a string.
	const instanceID = useInstanceId(
		RecentTrafficBreakdown,
		'googlesitekit-traffic-overview__recent-traffic-breakdown-heading'
	);
	const headingID = `${ instanceID }`;

	const isUsingPlainPermalinks = useSelect(
		( select: Select ) => select( CORE_SITE ).isUsingPlainPermalinks(),
		[]
	);

	// The channels report counts every visit, so it is empty only when
	// Analytics recorded no visit in the Recent activity date range. The Figma
	// design leaves the section out then. `TopChannelsColumn` requests the
	// same report, so this adds no request.
	const { report: channelsReport } = useFreshDataReport(
		getTopChannelsReportOptions
	);

	// The columns render while the report loads, so the posts and referrals
	// columns request their reports without waiting for it.
	if ( channelsReport && isZeroReport( channelsReport ) ) {
		return null;
	}

	// `isUsingPlainPermalinks()` is `undefined` until the site info loads.
	// Until then, a loading tile renders in place of either posts column, so
	// neither sends a request for the wrong kind of site.
	let postsColumn = (
		<TableTile
			title={ __( 'Top posts by visitors', 'google-site-kit' ) }
			titleAs="h4"
			loading
		/>
	);

	if ( isUsingPlainPermalinks === true ) {
		postsColumn = <PlainPermalinkTopPostsColumn />;
	} else if ( isUsingPlainPermalinks === false ) {
		postsColumn = <TopPostsColumn />;
	}

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
				{ ! hasNoPublishedPosts && postsColumn }
				<TopChannelsColumn />
				<TopReferralsColumn />
			</div>
		</section>
	);
};

export default RecentTrafficBreakdown;
