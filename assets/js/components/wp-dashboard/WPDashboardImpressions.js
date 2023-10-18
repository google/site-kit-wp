/**
 * WPDashboardImpressions component.
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
	MODULES_SEARCH_CONSOLE,
} from '../../modules/search-console/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import DataBlock from '../DataBlock';
import PreviewBlock from '../PreviewBlock';
import { NOTICE_STYLE } from '../GatheringDataNotice';
import { calculateChange } from '../../util';
import sumObjectListValue from '../../util/sum-object-list-value';
import { partitionReport } from '../../util/partition-report';
import WPDashboardReportError from './WPDashboardReportError';
const { useSelect, useInViewSelect } = Data;

const WPDashboardImpressions = () => {
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

	const data = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getReport( reportArgs )
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
	const totalImpressions = sumObjectListValue( currentRange, 'impressions' );
	const totalOlderImpressions = sumObjectListValue(
		compareRange,
		'impressions'
	);
	const totalImpressionsChange = calculateChange(
		totalOlderImpressions,
		totalImpressions
	);

	const gatheringDataProps = {
		gatheringData: isGatheringData,
		gatheringDataNoticeStyle: NOTICE_STYLE.SMALL,
	};

	return (
		<DataBlock
			className="googlesitekit-wp-dashboard-stats__data-table overview-total-impressions"
			title={ __( 'Total Impressions', 'google-site-kit' ) }
			datapoint={ totalImpressions }
			change={ totalImpressionsChange }
			changeDataUnit="%"
			{ ...gatheringDataProps }
		/>
	);
};

export default WPDashboardImpressions;
