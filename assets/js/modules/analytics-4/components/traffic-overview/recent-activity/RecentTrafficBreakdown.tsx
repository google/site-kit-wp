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
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';
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
	// `useInstanceId` is typed as `string | number`, so it is read as a string
	// the way `TextField` does.
	const instanceID = useInstanceId(
		RecentTrafficBreakdown,
		'googlesitekit-traffic-overview__recent-traffic-breakdown-heading'
	);
	const headingID = `${ instanceID }`;

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
				{ ! hasNoPublishedPosts && <TopPostsColumn /> }
				<TopChannelsColumn />
				<TopReferralsColumn />
			</div>
		</section>
	);
};

export default RecentTrafficBreakdown;
