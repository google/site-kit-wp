/**
 * WP Dashboard Session Duration GA4 component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

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
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { calculateChange } from '../../util';
import DataBlock from '../DataBlock';
import PreviewBlock from '../PreviewBlock';
import { NOTICE_STYLE } from '../GatheringDataNotice';
const { useSelect, useInViewSelect } = Data;

function WPDashboardSessionDurationGA4( { WPDashboardReportError } ) {
	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isGatheringData()
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
				name: 'averageSessionDuration',
			},
		],
	};

	const analytics4Data = useInViewSelect(
		( select ) => select( MODULES_ANALYTICS_4 ).getReport( reportArgs ),
		[ reportArgs ]
	);
	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportArgs,
		] )
	);
	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportArgs ]
			)
	);

	if ( loading || isGatheringData === undefined ) {
		return <PreviewBlock width="48%" height="92px" />;
	}

	if ( error ) {
		return (
			<WPDashboardReportError moduleSlug="analytics-4" error={ error } />
		);
	}

	const { totals } = analytics4Data;
	const lastMonth = totals?.[ 0 ]?.metricValues?.[ 0 ]?.value;
	const previousMonth = totals?.[ 1 ]?.metricValues?.[ 0 ]?.value;
	const averageSessionDuration = lastMonth;
	const averageSessionDurationChange = calculateChange(
		previousMonth,
		lastMonth
	);

	const gatheringDataProps = {
		gatheringData: isGatheringData,
		gatheringDataNoticeStyle: NOTICE_STYLE.SMALL,
	};

	return (
		<DataBlock
			className="googlesitekit-wp-dashboard-stats__data-table overview-average-session-duration"
			title={ __( 'Avg. Time on Page', 'google-site-kit' ) }
			datapoint={ averageSessionDuration }
			datapointUnit="s"
			change={ averageSessionDurationChange }
			changeDataUnit="%"
			{ ...gatheringDataProps }
		/>
	);
}

WPDashboardSessionDurationGA4.propTypes = {
	WPDashboardReportError: PropTypes.elementType.isRequired,
};

export default WPDashboardSessionDurationGA4;
