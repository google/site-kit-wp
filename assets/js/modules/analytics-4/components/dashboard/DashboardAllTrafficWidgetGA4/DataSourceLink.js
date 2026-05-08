/**
 * DashboardAllTrafficWidgetGA4 Data Source Link component
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
	UI_DIMENSION_NAME,
} from '@/js/modules/analytics-4/datastore/constants';
import { getURLPath } from '@/js/util';
import useViewOnly from '@/js/hooks/useViewOnly';
import SourceLink from '@/js/components/SourceLink';

export default function DataSourceLink() {
	const viewOnly = useViewOnly();

	const serviceReportURL = useSelect( ( select ) => {
		if ( viewOnly ) {
			return null;
		}

		const dimensionName =
			select( CORE_UI ).getValue( UI_DIMENSION_NAME ) ||
			'sessionDefaultChannelGrouping';

		const entityURL = select( CORE_SITE ).getCurrentEntityURL();

		const { startDate, endDate, compareStartDate, compareEndDate } = select(
			CORE_USER
		).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET,
		} );

		const reportArgs = {
			dates: {
				startDate,
				endDate,
				compareStartDate,
				compareEndDate,
			},
		};

		let reportType;

		switch ( dimensionName ) {
			case 'country':
				reportType = 'user-demographics-detail';
				reportArgs.details = {
					metric: 'activeUsers',
					dimension: 'country',
				};
				// eslint-disable-next-line sitekit/acronym-case
				reportArgs.otherArgs = { collectionId: 'user' };
				break;
			case 'deviceCategory':
				reportType = 'user-technology-detail';
				reportArgs.details = {
					metric: 'activeUsers',
					dimension: 'deviceCategory',
				};
				// eslint-disable-next-line sitekit/acronym-case
				reportArgs.otherArgs = { collectionId: 'user' };
				break;
			case 'sessionDefaultChannelGrouping':
			default:
				reportType = 'lifecycle-traffic-acquisition-v2';
				// eslint-disable-next-line sitekit/acronym-case
				reportArgs.otherArgs = { collectionId: 'life-cycle' };
				break;
		}

		if ( isURL( entityURL ) ) {
			reportArgs.filters = {
				unifiedPagePathScreen: getURLPath( entityURL ),
			};
		}

		return select( MODULES_ANALYTICS_4 ).getServiceReportURL(
			reportType,
			reportArgs
		);
	} );

	return (
		<SourceLink
			className="googlesitekit-data-block__source"
			name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			href={ serviceReportURL }
			external
		/>
	);
}
