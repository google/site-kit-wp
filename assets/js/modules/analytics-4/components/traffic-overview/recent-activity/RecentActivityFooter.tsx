/**
 * Recent activity footer.
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
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import useTrackSourceLinkClickCallback from '@/js/hooks/useTrackSourceLinkClickCallback';
import useViewOnly from '@/js/hooks/useViewOnly';
import { useFreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { generateDateRangeArgs } from '@/js/modules/search-console/util';

const RecentActivityFooter: FC = () => {
	const viewOnly = useViewOnly();
	const handleClick = useTrackSourceLinkClickCallback();

	const { startDate, endDate } = useFreshDataDateRange();

	const analyticsReportURL = useSelect(
		( select: Select ) => {
			if ( viewOnly ) {
				return undefined;
			}

			return select( MODULES_ANALYTICS_4 ).getServiceReportURL(
				'lifecycle-traffic-acquisition-v2',
				{
					dates: { startDate, endDate },
					otherArgs: {
						// `collectionId` is what Analytics calls this parameter
						// in its URL.
						// eslint-disable-next-line sitekit/acronym-case
						collectionId: 'life-cycle',
					},
				}
			);
		},
		[ viewOnly, startDate, endDate ]
	);

	const searchConsoleReportURL = useSelect(
		( select: Select ) => {
			if ( viewOnly ) {
				return undefined;
			}

			return select( MODULES_SEARCH_CONSOLE ).getServiceReportURL(
				generateDateRangeArgs( { startDate, endDate } )
			);
		},
		[ viewOnly, startDate, endDate ]
	);

	if ( viewOnly ) {
		return null;
	}

	return (
		<div className="googlesitekit-source-link googlesitekit-traffic-overview__sources">
			{ createInterpolateElement(
				sprintf(
					/* translators: 1: a link to the first source, e.g. "Analytics", 2: a link to the second source, e.g. "Search Console" */
					__( 'Sources: %1$s %2$s', 'google-site-kit' ),
					`<analytics>${ _x(
						'Analytics',
						'Service name',
						'google-site-kit'
					) }</analytics>`,
					`<searchConsole>${ _x(
						'Search Console',
						'Service name',
						'google-site-kit'
					) }</searchConsole>`
				),
				{
					analytics: (
						<Link
							href={ analyticsReportURL }
							onClick={ handleClick }
							external
						/>
					),
					searchConsole: (
						<Link
							href={ searchConsoleReportURL }
							onClick={ handleClick }
							external
						/>
					),
				}
			) }
		</div>
	);
};

export default RecentActivityFooter;
