/**
 * WPDashboardImpressions component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { STORE_NAME } from '../../modules/search-console/datastore/constants';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { extractSearchConsoleDashboardData, isZeroReport } from '../../modules/search-console/util';
import { trackEvent } from '../../util/tracking';
import DataBlock from '../data-block';
import PreviewBlock from '../PreviewBlock';
import ReportError from '../ReportError';
import ReportZero from '../ReportZero';
const { useSelect } = Data;

const WPDashboardImpressions = () => {
	const { data, error, loading } = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		const commonArgs = {
			dateRange: select( CORE_USER ).getDateRange(),
		};

		const args = {
			dimensions: 'date',
			compareDateRanges: true,
			...commonArgs,
		};

		return {
			data: store.getReport( args ),
			error: store.getErrorForSelector( 'getReport', [ args ] ),
			loading: ! store.hasFinishedResolution( 'getReport', [ args ] ),
		};
	} );

	useEffect( () => {
		if ( error ) {
			trackEvent( 'plugin_setup', 'search_console_error', error.message );
		}
	}, [ error ] );

	if ( ! data || ! data.length ) {
		return null;
	}

	const processedData = extractSearchConsoleDashboardData( data );

	const {
		totalImpressions,
		totalImpressionsChange,
	} = processedData;

	if ( loading ) {
		return <PreviewBlock width="48%" height="92px" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="search-console" error={ error } />;
	}

	if ( isZeroReport( data ) ) {
		return <ReportZero moduleSlug="search-console" />;
	}

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
