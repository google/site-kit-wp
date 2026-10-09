/**
 * Recent activity latest post header.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { SIZE_SMALL } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import { formatDate } from '@/js/util';
import PushPinIcon from '@/svg/icons/push-pin.svg';

interface LatestPostHeaderProps {
	/** The post to show the title and the publish time of. */
	post: RecentContentItem;
}

const LatestPostHeader: FC< LatestPostHeaderProps > = ( { post } ) => {
	const entityDashboardURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
				permaLink: post.permalink,
			} ),
		[ post.permalink ]
	);

	const timezone = useSelect(
		( select: Select ) => select( CORE_SITE ).getTimezone(),
		[]
	);

	// eslint-disable-next-line sitekit/no-direct-date -- The date comes from the post's publish time, not from the reference date.
	const publishTime = formatDate( new Date( post.publishedAt ), {
		year: undefined,
		month: 'long',
		hour: 'numeric',
		minute: '2-digit',
		// A site set to a UTC offset rather than a named time zone has an
		// empty time zone, which `Intl` rejects, so the browser's is used.
		...( timezone && { timeZone: timezone } ),
	} );

	return (
		<div className="googlesitekit-traffic-overview__latest-post-header">
			<span className="googlesitekit-traffic-overview__latest-post-icon">
				<PushPinIcon width={ 20 } height={ 20 } />
			</span>
			<div>
				<Link
					className="googlesitekit-traffic-overview__latest-post-title"
					href={ entityDashboardURL }
				>
					{ post.title }
				</Link>
				<P
					className="googlesitekit-traffic-overview__latest-post-date"
					size={ SIZE_SMALL }
				>
					{ sprintf(
						/* translators: %s: The date and time the post was published, e.g. "July 14, 14:30". */
						__( 'posted %s', 'google-site-kit' ),
						publishTime
					) }
				</P>
			</div>
		</div>
	);
};

export default LatestPostHeader;
