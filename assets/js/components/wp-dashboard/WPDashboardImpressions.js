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
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { DATE_RANGE_OFFSET, MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { isZeroReport } from '../../modules/search-console/util';
import DataBlock from '../DataBlock';
import PreviewBlock from '../PreviewBlock';
import ReportError from '../ReportError';
import ReportZero from '../ReportZero';
import { calculateChange, trackEvent } from '../../util';
import sumObjectListValue from '../../util/sum-object-list-value';
const { useSelect } = Data;

const WPDashboardImpressions = () => {
	const { compareStartDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} ) );

	const args = {
		startDate: compareStartDate,
		endDate,
		dimensions: 'date',
	};

	const data = useSelect( ( select ) => select( MODULES_SEARCH_CONSOLE ).getReport( args ) );
	const error = useSelect( ( select ) => select( MODULES_SEARCH_CONSOLE ).getErrorForSelector( 'getReport', [ args ] ) );
	const loading = useSelect( ( select ) => ! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution( 'getReport', [ args ] ) );

	useEffect( () => {
		if ( error ) {
			trackEvent( 'plugin_setup', 'search_console_error', error.message );
		}
	}, [ error ] );

	if ( loading ) {
		return <PreviewBlock width="48%" height="92px" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="search-console" error={ error } />;
	}

	if ( isZeroReport( data ) ) {
		return <ReportZero moduleSlug="search-console" />;
	}

	const half = Math.floor( data.length / 2 );
	const latestData = data.slice( half );
	const olderData = data.slice( 0, half );

	const totalImpressions = sumObjectListValue( latestData, 'impressions' );
	const totalOlderImpressions = sumObjectListValue( olderData, 'impressions' );
	const totalImpressionsChange = calculateChange( totalOlderImpressions, totalImpressions );

	return (
		<DataBlock
			className="googlesitekit-wp-dashboard-stats__data-table overview-total-impressions"
			title={ __( 'Total Impressions', 'google-site-kit' ) }
			datapoint={ totalImpressions }
			change={ totalImpressionsChange }
			changeDataUnit="%"
		/>
	);
};

export default WPDashboardImpressions;
