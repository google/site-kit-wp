/**
 * Admin Bar Clicks component.
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
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_SEARCH_CONSOLE, DATE_RANGE_OFFSET } from '../../modules/search-console/datastore/constants';
import { calculateChange } from '../../util';
import { isZeroReport } from '../../modules/search-console/util/is-zero-report';
import PreviewBlock from '../PreviewBlock';
import ReportError from '../ReportError';
import DataBlock from '../DataBlock';
import sumObjectListValue from '../../util/sum-object-list-value';
const { useSelect } = Data;

function AdminBarClicks( { WidgetReportZero } ) {
	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	const { compareStartDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} ) );
	const reportArgs = {
		startDate: compareStartDate,
		endDate,
		dimensions: 'date',
		url,
	};

	const searchConsoleData = useSelect( ( select ) => select( MODULES_SEARCH_CONSOLE ).getReport( reportArgs ) );
	const hasFinishedResolution = useSelect( ( select ) => select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution( 'getReport', [ reportArgs ] ) );
	const error = useSelect( ( select ) => select( MODULES_SEARCH_CONSOLE ).getErrorForSelector( 'getReport', [ reportArgs ] ) );

	if ( ! hasFinishedResolution ) {
		return <PreviewBlock width="auto" height="59px" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="search-console" error={ error } />;
	}

	if ( isZeroReport( searchConsoleData ) ) {
		return <WidgetReportZero moduleSlug="search-console" />;
	}

	// Split the data in two chunks.
	const half = Math.floor( searchConsoleData.length / 2 );
	const latestData = searchConsoleData.slice( half );
	const olderData = searchConsoleData.slice( 0, half );

	const totalClicks = sumObjectListValue( latestData, 'clicks' );
	const totalOlderClicks = sumObjectListValue( olderData, 'clicks' );
	const totalClicksChange = calculateChange( totalOlderClicks, totalClicks );

	return (
		<DataBlock
			className="overview-total-clicks"
			title={ __( 'Total Clicks', 'google-site-kit' ) }
			datapoint={ totalClicks }
			change={ totalClicksChange }
			changeDataUnit="%"
		/>
	);
}

export default AdminBarClicks;
