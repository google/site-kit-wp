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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { DATE_RANGE_OFFSET, MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { isZeroReport } from '../../modules/search-console/util';
import { calculateChange, trackEvent } from '../../util';
import sumObjectListValue from '../../util/sum-object-list-value';
import { partitionReport } from '../../util/partition-report';
import DataBlock from '../DataBlock';
import PreviewBlock from '../PreviewBlock';
const { useSelect } = Data;

const WPDashboardClicks = ( { WidgetReportZero, WidgetReportError } ) => {
	const { compareStartDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} ) );
	const dateRangeLength = useSelect( ( select ) => select( CORE_USER ).getDateRangeNumberOfDays() );

	const reportArgs = {
		startDate: compareStartDate,
		endDate,
		dimensions: 'date',
	};

	const data = useSelect( ( select ) => select( MODULES_SEARCH_CONSOLE ).getReport( reportArgs ) );
	const error = useSelect( ( select ) => select( MODULES_SEARCH_CONSOLE ).getErrorForSelector( 'getReport', [ reportArgs ] ) );
	const loading = useSelect( ( select ) => ! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution( 'getReport', [ reportArgs ] ) );

	useEffect( () => {
		if ( error ) {
			trackEvent( 'plugin_setup', 'search_console_error', error.message );
		}
	}, [ error ] );

	if ( loading ) {
		return <PreviewBlock width="48%" height="92px" />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="search-console" error={ error } />;
	}

	if ( isZeroReport( data ) ) {
		return <WidgetReportZero moduleSlug="search-console" />;
	}

	const { compareRange, currentRange } = partitionReport( data, { dateRangeLength } );
	const totalClicks = sumObjectListValue( currentRange, 'clicks' );
	const totalOlderClicks = sumObjectListValue( compareRange, 'clicks' );
	const totalClicksChange = calculateChange( totalOlderClicks, totalClicks );

	return (
		<DataBlock
			className="googlesitekit-wp-dashboard-stats__data-table overview-total-clicks"
			title={ __( 'Total Clicks', 'google-site-kit' ) }
			datapoint={ totalClicks }
			change={ totalClicksChange }
			changeDataUnit="%"
		/>
	);
};

export default WPDashboardClicks;
