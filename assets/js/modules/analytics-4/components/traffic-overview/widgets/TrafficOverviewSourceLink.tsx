/**
 * Traffic Overview source link.
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
import { _x } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import SourceLink from '@/js/components/SourceLink';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { getURLPath } from '@/js/util';

const TrafficOverviewSourceLink: FC = () => {
	const viewOnly = useViewOnly();

	const serviceReportURL = useSelect(
		( select: Select ) => {
			if ( viewOnly ) {
				return undefined;
			}

			const entityURL = select( CORE_SITE ).getCurrentEntityURL();

			const { startDate, endDate, compareStartDate, compareEndDate } =
				select( CORE_USER ).getDateRangeDates( { compare: true } );

			const reportArgs = {
				dates: {
					startDate,
					endDate,
					compareStartDate,
					compareEndDate,
				},
				// The Analytics URL takes this parameter as `collectionId`, so
				// the key keeps that spelling.
				// eslint-disable-next-line sitekit/acronym-case
				otherArgs: { collectionId: 'life-cycle' },
				// On the entity dashboard the link filters the Analytics
				// report to the path of the page the user is viewing.
				...( isURL( entityURL )
					? {
							filters: {
								unifiedPagePathScreen: getURLPath( entityURL ),
							},
					  }
					: {} ),
			};

			return select( MODULES_ANALYTICS_4 ).getServiceReportURL(
				'lifecycle-traffic-acquisition-v2',
				reportArgs
			);
		},
		[ viewOnly ]
	);

	return (
		<SourceLink
			className="googlesitekit-data-block__source"
			name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			href={ serviceReportURL }
			external
		/>
	);
};

export default TrafficOverviewSourceLink;
