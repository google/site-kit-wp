/**
 * Admin Bar Unique Visitors GA4 component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DataBlock from '../DataBlock';
import { useSelect } from 'googlesitekit-data';
import PreviewBlock from '../PreviewBlock';
import { NOTICE_STYLE } from '../GatheringDataNotice';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { calculateChange } from '../../util';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';

function AdminBarUniqueVisitorsGA4( { WidgetReportError } ) {
	const isGatheringData = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isGatheringData()
	);
	const url = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);
	const dateRangeDates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);
	const reportArgs = {
		...dateRangeDates,
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		url,
	};

	const analyticsData = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( reportArgs )
	);
	const hasFinishedResolution = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
			reportArgs,
		] )
	);
	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportArgs,
		] )
	);

	if ( ! hasFinishedResolution || isGatheringData === undefined ) {
		return <PreviewBlock width="auto" height="59px" />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics-4" error={ error } />;
	}

	const totalUsers = analyticsData?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value;
	const previousTotalUsers =
		analyticsData?.totals?.[ 1 ]?.metricValues?.[ 0 ]?.value;

	const gatheringDataProps = {
		gatheringData: isGatheringData,
		gatheringDataNoticeStyle: NOTICE_STYLE.SMALL,
	};

	return (
		<DataBlock
			className="overview-total-users"
			title={ __( 'Total Users', 'google-site-kit' ) }
			datapoint={ totalUsers }
			change={ calculateChange( previousTotalUsers, totalUsers ) }
			changeDataUnit="%"
			{ ...gatheringDataProps }
		/>
	);
}

export default AdminBarUniqueVisitorsGA4;
