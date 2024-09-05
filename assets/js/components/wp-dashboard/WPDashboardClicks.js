/**
 * WPDashboardClicks component.
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
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_SEARCH_CONSOLE,
} from '../../modules/search-console/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { calculateChange } from '../../util';
import sumObjectListValue from '../../util/sum-object-list-value';
import { partitionReport } from '../../util/partition-report';
import DataBlock from '../DataBlock';
import PreviewBlock from '../PreviewBlock';
import { NOTICE_STYLE } from '../GatheringDataNotice';

function WPDashboardClicks( { WPDashboardReportError } ) {
	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);
	const { compareStartDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);
	const dateRangeLength = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeNumberOfDays()
	);

	const reportArgs = {
		startDate: compareStartDate,
		endDate,
		dimensions: 'date',
	};

	const data = useInViewSelect(
		( select ) => select( MODULES_SEARCH_CONSOLE ).getReport( reportArgs ),
		[ reportArgs ]
	);
	const error = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getErrorForSelector( 'getReport', [
			reportArgs,
		] )
	);
	const loading = useSelect(
		( select ) =>
			! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution(
				'getReport',
				[ reportArgs ]
			)
	);

	if ( loading || isGatheringData === undefined ) {
		return <PreviewBlock width="48%" height="92px" />;
	}

	if ( error ) {
		return (
			<WPDashboardReportError
				moduleSlug="search-console"
				error={ error }
			/>
		);
	}

	const { compareRange, currentRange } = partitionReport( data, {
		dateRangeLength,
	} );
	const totalClicks = sumObjectListValue( currentRange, 'clicks' );
	const totalOlderClicks = sumObjectListValue( compareRange, 'clicks' );
	const totalClicksChange = calculateChange( totalOlderClicks, totalClicks );

	const gatheringDataProps = {
		gatheringData: isGatheringData,
		gatheringDataNoticeStyle: NOTICE_STYLE.SMALL,
	};

	return (
		<DataBlock
			className="googlesitekit-wp-dashboard-stats__data-table overview-total-clicks"
			title={ __( 'Total Clicks', 'google-site-kit' ) }
			datapoint={ totalClicks }
			change={ totalClicksChange }
			changeDataUnit="%"
			{ ...gatheringDataProps }
		/>
	);
}

WPDashboardClicks.propTypes = {
	WPDashboardReportError: PropTypes.elementType.isRequired,
};

export default WPDashboardClicks;
