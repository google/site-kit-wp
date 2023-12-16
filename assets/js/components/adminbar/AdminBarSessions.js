/**
 * Admin Bar Sessions component.
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
import DataBlock from '../DataBlock';
import PreviewBlock from '../PreviewBlock';
import { NOTICE_STYLE } from '../GatheringDataNotice';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	MODULES_ANALYTICS,
	DATE_RANGE_OFFSET,
} from '../../modules/analytics/datastore/constants';
import { calculateChange } from '../../util';
const { useSelect } = Data;

function AdminBarSessions( { WidgetReportError } ) {
	const isGatheringData = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
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
		dimensions: 'ga:date',
		limit: 10,
		metrics: [
			{
				expression: 'ga:sessions',
				alias: 'Sessions',
			},
		],
		url,
	};

	const analyticsData = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( reportArgs )
	);
	const hasFinishedResolution = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [
			reportArgs,
		] )
	);
	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [
			reportArgs,
		] )
	);

	if ( ! hasFinishedResolution || isGatheringData === undefined ) {
		return <PreviewBlock width="auto" height="59px" />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics" error={ error } />;
	}

	const { totals } = analyticsData[ 0 ].data;
	const lastMonth = totals[ 0 ].values;
	const previousMonth = totals[ 1 ].values;
	const totalSessions = lastMonth[ 0 ];
	const totalSessionsChange = calculateChange(
		previousMonth[ 0 ],
		lastMonth[ 0 ]
	);

	const gatheringDataProps = {
		gatheringData: isGatheringData,
		gatheringDataNoticeStyle: NOTICE_STYLE.SMALL,
	};

	return (
		<DataBlock
			className="overview-total-sessions"
			title={ __( 'Total Sessions', 'google-site-kit' ) }
			datapoint={ totalSessions }
			change={ totalSessionsChange }
			changeDataUnit="%"
			{ ...gatheringDataProps }
		/>
	);
}

export default AdminBarSessions;
