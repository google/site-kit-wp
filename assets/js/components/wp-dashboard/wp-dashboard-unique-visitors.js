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
import { STORE_NAME } from '../../modules/analytics/datastore/constants';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user/constants';
import PreviewBlock from '../PreviewBlock';
import ReportError from '../ReportError';
import {
	readableLargeNumber,
	changeToPercent,
} from '../../util';
import DataBlock from '../data-block';
import { parseTotalUsersData, userReportDataDefaults } from '../../modules/analytics/util';
const { useSelect } = Data;

const WPDashboardUniqueVisitors = () => {
	const { data, loading, error } = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		const commonArgs = {
			dateRange: select( CORE_USER ).getDateRange(),
		};

		const args = {
			...userReportDataDefaults,
			...commonArgs,
		};

		return {
			data: store.getReport( args ),
			loading: ! store.hasFinishedResolution( 'getReport', [ args ] ),
			error: store.getErrorForSelector( 'getReport', [ args ] ),
		};
	} );

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

	const totalUsersChange = changeToPercent( previousTotalUsers, totalUsers );

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
