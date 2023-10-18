/**
 * WPDashboardUniqueVisitors component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import Data from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS,
} from '../../modules/analytics/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import PreviewBlock from '../PreviewBlock';
import { calculateChange } from '../../util';
import DataBlock from '../DataBlock';
import { NOTICE_STYLE } from '../GatheringDataNotice';
import WPDashboardReportError from './WPDashboardReportError';
const { useSelect, useInViewSelect } = Data;

const WPDashboardUniqueVisitors = () => {
	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
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
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
	};

	const data = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( reportArgs )
	);
	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [
			reportArgs,
		] )
	);
	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [
				reportArgs,
			] )
	);

	if ( loading || isGatheringData === undefined ) {
		return <PreviewBlock width="48%" height="92px" />;
	}

	if ( error ) {
		return (
			<WPDashboardReportError moduleSlug="analytics" error={ error } />
		);
	}

	const { totals } = data[ 0 ].data;
	const lastMonth = totals[ 0 ].values;
	const previousMonth = totals[ 1 ].values;
	const totalUsers = lastMonth[ 0 ];
	const previousTotalUsers = previousMonth[ 0 ];

	const gatheringDataProps = {
		gatheringData: isGatheringData,
		gatheringDataNoticeStyle: NOTICE_STYLE.SMALL,
	};

	return (
		<DataBlock
			className="googlesitekit-wp-dashboard-stats__data-table overview-total-users"
			title={ __( 'Total Unique Visitors', 'google-site-kit' ) }
			datapoint={ totalUsers }
			change={ calculateChange( previousTotalUsers, totalUsers ) }
			changeDataUnit="%"
			{ ...gatheringDataProps }
		/>
	);
};

export default WPDashboardUniqueVisitors;
