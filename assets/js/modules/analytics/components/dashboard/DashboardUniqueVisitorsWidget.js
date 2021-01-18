/**
 * DashboardAllTrafficWidget component.
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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { DATE_RANGE_OFFSET, STORE_NAME } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/DataBlock';
import Sparkline from '../../../../components/Sparkline';
import { calculateChange } from '../../../../util';
import { getURLPath } from '../../../../util/getURLPath';
import ReportError from '../../../../components/ReportError';
import parseDimensionStringToDate from '../../util/parseDimensionStringToDate';
import { isZeroReport } from '../../util';
import { generateDateRangeArgs } from '../../util/report-date-range-args';

const { useSelect } = Data;

function DashboardUniqueVisitorsWidget( { WidgetReportZero } ) {
	const {
		loading,
		error,
		sparkData,
		serviceURL,
		visitorsData,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		const {
			compareStartDate,
			compareEndDate,
			startDate,
			endDate,
		} = select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const commonArgs = {
			startDate,
			endDate,
		};

		const url = select( CORE_SITE ).getCurrentEntityURL();
		if ( url ) {
			commonArgs.url = url;
		}

		const sparklineArgs = {
			dimensions: 'ga:date',
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Users',
				},
			],
			...commonArgs,
		};

		// This request needs to be separate from the sparkline request because it would result in a different total if it included the ga:date dimension.
		const args = {
			compareStartDate,
			compareEndDate,
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Total Users',
				},
			],
			...commonArgs,
		};

		return {
			loading: ! store.hasFinishedResolution( 'getReport', [ sparklineArgs ] ) || ! store.hasFinishedResolution( 'getReport', [ args ] ),
			error: store.getErrorForSelector( 'getReport', [ sparklineArgs ] ) || store.getErrorForSelector( 'getReport', [ args ] ),
			// Due to the nature of these queries, we need to run them separately.
			sparkData: store.getReport( sparklineArgs ),
			serviceURL: store.getServiceReportURL( 'visitors-overview', {
				'_r.drilldown': url ? `analytics.pagePath:${ getURLPath( url ) }` : undefined,
				...generateDateRangeArgs( { startDate, endDate, compareStartDate, compareEndDate } ),
			} ),
			visitorsData: store.getReport( args ),
		};
	} );

	if ( loading ) {
		return <PreviewBlock width="100%" height="202px" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( sparkData ) || isZeroReport( visitorsData ) ) {
		return <WidgetReportZero moduleSlug="analytics" />;
	}

	const sparkLineData = [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Unique Visitors' },
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
	const totalUsers = totals[ 0 ].values[ 0 ];
	const previousTotalUsers = totals[ 1 ].values[ 0 ];
	const totalUsersChange = calculateChange( previousTotalUsers, totalUsers );

	return (
		<DataBlock
			className="overview-total-users"
			title={ __( 'Unique Visitors', 'google-site-kit' ) }
			datapoint={ totalUsers }
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

export default whenActive( {
	moduleName: 'analytics',
	FallbackComponent: ( { WidgetActivateModuleCTA } ) => <WidgetActivateModuleCTA moduleSlug="analytics" />,
	IncompleteComponent: ( { WidgetCompleteModuleActivationCTA } ) => <WidgetCompleteModuleActivationCTA moduleSlug="analytics" />,
} )( DashboardUniqueVisitorsWidget );
