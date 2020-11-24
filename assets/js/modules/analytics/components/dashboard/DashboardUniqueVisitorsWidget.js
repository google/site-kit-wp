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
import { STORE_NAME as CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/data-block';
import Sparkline from '../../../../components/Sparkline';
import AnalyticsInactiveCTA from '../../../../components/AnalyticsInactiveCTA';
import { changeToPercent, readableLargeNumber } from '../../../../util';
import ReportError from '../../../../components/ReportError';
import ReportZero from '../../../../components/ReportZero';
import parseDimensionStringToDate from '../../util/parseDimensionStringToDate';
import applyEntityToReportPath from '../../util/applyEntityToReportPath';
import { isZeroReport } from '../../util';

const { useSelect } = Data;

export default function DashboardUniqueVisitorsWidget() {
	const analyticsModule = useSelect( ( select ) => select( CORE_MODULES ).getModule( 'analytics' ) );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );

	const commonArgs = { dateRange };
	if ( url ) {
		commonArgs.url = url;
	}

	const sparklineArgs = {
		...commonArgs,
		dimensions: 'ga:date',
		metrics: [ {
			expression: 'ga:users',
			alias: 'Users',
		} ],
	};

	// This request needs to be separate from the sparkline request because it would result in a different total if it included the ga:date dimension.
	const args = {
		...commonArgs,
		multiDateRange: 1,
		metrics: [ {
			expression: 'ga:users',
			alias: 'Total Users',
		} ],
	};

	const resolvedSparkDataReport = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ sparklineArgs ] ) );
	const resolvedVisitorsReport = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ args ] ) );

	const {
		error,
		sparkData,
		serviceURL,
		visitorsData,
	} = useSelect( ( select ) => {
		if ( ! analyticsModule || ! analyticsModule.active || ! analyticsModule.connected ) {
			return {};
		}

		const store = select( STORE_NAME );

		const accountID = store.getAccountID();
		const profileID = store.getProfileID();
		const internalWebPropertyID = store.getInternalWebPropertyID();
		const path = applyEntityToReportPath( url, `/report/visitors-overview/a${ accountID }w${ internalWebPropertyID }p${ profileID }/` );

		return {
			serviceURL: store.getServiceURL( { path } ),
			// Due to the nature of these queries, we need to run them separately.
			sparkData: store.getReport( sparklineArgs ),
			visitorsData: store.getReport( args ),
			error: store.getErrorForSelector( 'getReport', [ sparklineArgs ] ) || store.getErrorForSelector( 'getReport', [ args ] ),
		};
	} );

	if ( ! analyticsModule ) {
		return null;
	}

	if ( ! analyticsModule.active || ! analyticsModule.connected ) {
		return <AnalyticsInactiveCTA />;
	}

	if ( ! resolvedSparkDataReport || ! resolvedVisitorsReport ) {
		return <PreviewBlock width="100%" height="202px" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( sparkData ) || isZeroReport( visitorsData ) ) {
		return <ReportZero moduleSlug="analytics" />;
	}

	const sparkLineData = [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Bounce Rate' },
		],
	];
	const dataRows = sparkData[ 0 ].data.rows;

	// Loop the rows to build the chart data.
	for ( let i = 0; i < dataRows.length; i++ ) {
		const { values } = dataRows[ i ].metrics[ 0 ];
		const dateString = dataRows[ i ].dimensions[ 0 ];
		const date = parseDimensionStringToDate( dateString );
		sparkLineData.push( [
			date,
			values[ 0 ],
		] );
	}

	const { totals } = visitorsData[ 0 ].data;
	const totalUsers = totals[ 0 ].values;
	const previousTotalUsers = totals[ 1 ].values;
	const totalUsersChange = changeToPercent( previousTotalUsers, totalUsers );

	return (
		<DataBlock
			className="overview-total-users"
			title={ __( 'Unique Visitors', 'google-site-kit' ) }
			datapoint={ readableLargeNumber( totalUsers ) }
			change={ totalUsersChange }
			changeDataUnit="%"
			source={ {
				name: _x( 'Analytics', 'Service name', 'google-site-kit' ),
				link: serviceURL,
				external: true,
			} }
			sparkline={
				sparkLineData &&
					<Sparkline
						data={ sparkLineData }
						change={ totalUsersChange }
					/>
			}
		/>
	);
}
