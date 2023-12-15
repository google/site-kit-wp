/**
 * Admin Bar Sessions GA4 component.
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
import Data from 'googlesitekit-data';
import DataBlock from '../DataBlock';
import PreviewBlock from '../PreviewBlock';
import { NOTICE_STYLE } from '../GatheringDataNotice';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { DATE_RANGE_OFFSET } from '../../modules/analytics/datastore/constants';
import { calculateChange } from '../../util';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
const { useSelect } = Data;

function AdminBarSessionsGA4( { WidgetReportError } ) {
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
		dimensions: [
			{
				name: 'date',
			},
		],
		limit: 10,
		metrics: [
			{
				name: 'sessions',
			},
		],
		url,
	};

	const analytics4Data = useSelect( ( select ) =>
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

	const gatheringDataProps = {
		gatheringData: isGatheringData,
		gatheringDataNoticeStyle: NOTICE_STYLE.SMALL,
	};

	if ( ! hasFinishedResolution || isGatheringData === undefined ) {
		return <PreviewBlock width="auto" height="59px" />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics-4" error={ error } />;
	}

	const { totals } = analytics4Data;
	const lastMonth = totals?.[ 0 ]?.metricValues?.[ 0 ]?.value;
	const previousMonth = totals?.[ 1 ]?.metricValues?.[ 0 ]?.value;
	const totalSessions = lastMonth;
	const totalSessionsChange = calculateChange( previousMonth, lastMonth );

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

export default AdminBarSessionsGA4;
