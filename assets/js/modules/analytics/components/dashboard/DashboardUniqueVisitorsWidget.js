/**
 * DashboardAllTrafficWidget component.
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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import ErrorText from '../../../../components/error-text';
import PreviewBlock from '../../../../components/preview-block';
import DataBlock from '../../../../components/data-block';
import Sparkline from '../../../../components/sparkline';
import { siteAnalyticsReportDataDefaults, extractAnalyticsDashboardSparklineData, userReportDataDefaults, parseTotalUsersData } from '../../util';
import { extractForSparkline, getSiteKitAdminURL, changeToPercent, readableLargeNumber } from '../../../../util';
const { useSelect } = Data;

function DashboardUniqueVisitorsWidget() {
	const {
		sparkData,
		sparkDataError,
		visitorsData,
		visitorsDataError,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const args = {
			dateRange: select( CORE_USER ).getDateRange(),
		};

		const url = select( CORE_SITE ).getCurrentEntityURL();
		if ( url ) {
			args.url = url;
		}

		const sparkDataArgs = {
			...siteAnalyticsReportDataDefaults,
			...args,
		};

		const visitorsDataArgs = {
			...userReportDataDefaults,
			...args,
		};

		return {
			sparkData: store.getReport( sparkDataArgs ),
			sparkDataError: store.getErrorForSelector( 'getReport', [ sparkDataArgs ] ),
			visitorsData: store.getReport( visitorsDataArgs ),
			visitorsDataError: store.getErrorForSelector( 'getReport', [ visitorsDataArgs ] ),
		};
	} );

	if ( visitorsDataError || sparkDataError ) {
		return (
			<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
				<ErrorText message={ ( visitorsDataError || sparkDataError ).message } />
			</div>
		);
	}

	if ( ! visitorsData || ! sparkData ) {
		return <PreviewBlock width="100%" height="202px" />;
	}

	const extractedAnalytics = extractAnalyticsDashboardSparklineData( sparkData );

	const { previousTotalUsers, totalUsers } = parseTotalUsersData( visitorsData );
	const totalUsersChange = changeToPercent( previousTotalUsers, totalUsers );

	return (
		<DataBlock
			className="overview-total-users"
			title={ __( 'Unique Visitors from Search', 'google-site-kit' ) }
			datapoint={ readableLargeNumber( totalUsers ) }
			change={ totalUsersChange }
			changeDataUnit="%"
			source={ {
				name: _x( 'Analytics', 'Service name', 'google-site-kit' ),
				link: getSiteKitAdminURL( 'googlesitekit-module-analytics', {} ),
			} }
			sparkline={
				extractedAnalytics &&
					<Sparkline
						data={ extractForSparkline( extractedAnalytics, 1 ) }
						change={ totalUsersChange }
					/>
			}
		/>
	);
}

export default whenActive( { moduleName: 'analytics' } )( DashboardUniqueVisitorsWidget );
