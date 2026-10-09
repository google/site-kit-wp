/**
 * Recent activity latest post performance.
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
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import PreviewBlock from '@/js/components/PreviewBlock';
import ReportError from '@/js/components/ReportError';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { LATEST_POST_RECENT_CONTENT_OPTIONS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import EngagementOutcomesGroup from './EngagementOutcomesGroup';
import LatestPostHeader from './LatestPostHeader';
import { PostReportArgs } from './postReportOptions';
import TrafficSourcesGroup from './TrafficSourcesGroup';
import { getPostWindow } from './utils/getPostWindow';
import VisitorBreakdownGroup from './VisitorBreakdownGroup';

const LatestPostPerformance: FC = () => {
	const headingID = useInstanceId(
		LatestPostPerformance,
		'googlesitekit-traffic-overview__latest-post-performance-heading'
	) as string;

	const recentContent = useInViewSelect< RecentContentItem[] | undefined >(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getRecentContent(
				LATEST_POST_RECENT_CONTENT_OPTIONS
			),
		[]
	);

	const recentContentError = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getRecentContent',
				[ LATEST_POST_RECENT_CONTENT_OPTIONS ]
			),
		[]
	);

	const referenceDate = useSelect(
		( select: Select ) => select( CORE_USER ).getReferenceDate(),
		[]
	);

	const post = recentContent?.[ 0 ];

	const reportArgs = useMemo< PostReportArgs | undefined >(
		() =>
			post
				? {
						permalink: post.permalink,
						...getPostWindow( post.publishedAt, referenceDate ),
				  }
				: undefined,
		[ post, referenceDate ]
	);

	return (
		<section
			className="googlesitekit-traffic-overview__latest-post-performance"
			aria-labelledby={ headingID }
		>
			<Typography
				as="h3"
				type={ TYPE_TITLE }
				size={ SIZE_MEDIUM }
				id={ headingID }
				className="googlesitekit-traffic-overview__latest-post-performance-heading"
			>
				{ __(
					'Latest post performance since published',
					'google-site-kit'
				) }
			</Typography>

			{ !! recentContentError && (
				<ReportError
					moduleSlug={ MODULE_SLUG_ANALYTICS_4 }
					error={ recentContentError }
				/>
			) }

			{ ! recentContentError && ! reportArgs && (
				<PreviewBlock width="100%" height="190px" />
			) }

			{ post && reportArgs && (
				<Fragment>
					<LatestPostHeader post={ post } />
					<div className="googlesitekit-traffic-overview__latest-post-tiles">
						<VisitorBreakdownGroup reportArgs={ reportArgs } />
						<TrafficSourcesGroup reportArgs={ reportArgs } />
						<EngagementOutcomesGroup reportArgs={ reportArgs } />
					</div>
				</Fragment>
			) }
		</section>
	);
};

export default LatestPostPerformance;
