/**
 * WPDashboardUniqueVisitors component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as MODULES_ANALYTICS } from '../../modules/analytics/datastore/constants';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user/constants';
import PreviewBlock from '../PreviewBlock';
import ReportError from '../ReportError';
import {
	readableLargeNumber,
	calculateChange,
} from '../../util';
import DataBlock from '../DataBlock';
import { parseTotalUsersData, userReportDataDefaults } from '../../modules/analytics/util';
const { useSelect } = Data;

const WPDashboardUniqueVisitors = () => {
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );

	const args = {
		dateRange,
		...userReportDataDefaults,
	};

	const data = useSelect( ( select ) => select( MODULES_ANALYTICS ).getReport( args ) );
	const error = useSelect( ( select ) => select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] ) );
	const loading = useSelect( ( select ) => ! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ args ] ) );

	if ( loading ) {
		return <PreviewBlock width="48%" height="92px" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	const {
		totalUsers,
		previousTotalUsers,
	} = parseTotalUsersData( data );

	const totalUsersChange = calculateChange( previousTotalUsers, totalUsers );

	return (
		<DataBlock
			className="googlesitekit-wp-dashboard-stats__data-table overview-total-users"
			title={ __( 'Total Unique Visitors', 'google-site-kit' ) }
			datapoint={ readableLargeNumber( totalUsers ) }
			change={ totalUsersChange }
			changeDataUnit="%"
		/>
	);
};

export default WPDashboardUniqueVisitors;
