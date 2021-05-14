/**
 * DashboardUniqueVisitorsWidget component.
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
import { calculateChange, getURLPath } from '../../../../util';
import { isZeroReport } from '../../util';
import { generateDateRangeArgs } from '../../util/report-date-range-args';
import whenActive from '../../../../util/when-active';
import PreviewBlock from '../../../../components/PreviewBlock';
import DataBlock from '../../../../components/DataBlock';
import Sparkline from '../../../../components/Sparkline';
import parseDimensionStringToDate from '../../util/parseDimensionStringToDate';

const { useSelect } = Data;

function DashboardUniqueVisitorsWidget( { WidgetReportZero, WidgetReportError } ) {
	const sparklineArgs = useSelect( selectSparklineArgs, [] );
	const args = useSelect( selectReportArgs, [] );
	const loading = useSelect( ( select ) => {
		return ! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ sparklineArgs ] ) ||
			! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ args ] );
	}, [ sparklineArgs, args ] );
	const error = useSelect( ( select ) => {
		return select( STORE_NAME ).getErrorForSelector( 'getReport', [ sparklineArgs ] ) ||
			select( STORE_NAME ).getErrorForSelector( 'getReport', [ args ] );
	}, [ sparklineArgs, args ] );
	const sparkData = useSelect( ( select ) => select( STORE_NAME ).getReport( sparklineArgs ), [ sparklineArgs ] );
	const visitorsData = useSelect( ( select ) => select( STORE_NAME ).getReport( args ), [ args ] );
	const serviceURL = useSelect(
		( select ) => {
			const dates = select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} );
			const drilldowns = [ 'analytics.trafficChannel:Organic Search' ];
			const url = select( CORE_SITE ).getCurrentEntityURL();
			if ( url ) {
				drilldowns.push( `analytics.pagePath:${ getURLPath( url ) }` );
			}
			return select( STORE_NAME ).getServiceReportURL( 'acquisition-channels', {
				'_r.drilldown': drilldowns.join( ',' ),
				...generateDateRangeArgs( dates ),
			} );
		},
		[ args ]
	);

	if ( loading ) {
		return <PreviewBlock width="100%" height="202px" />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( sparkData ) || isZeroReport( visitorsData ) ) {
		return <WidgetReportZero moduleSlug="analytics" />;
	}

	const sparkLineData = [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Unique Visitors from Search' },
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
			title={ __( 'Unique Visitors from Search', 'google-site-kit' ) }
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

/**
 * Selects args used for sparkline report from the store.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Function} select Registry select.
 * @return {Object} Sparkline args.
 */
export const selectSparklineArgs = ( select ) => {
	return {
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Users',
			},
		],
		dimensions: [ 'ga:date', 'ga:channelGrouping' ],
		dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
		url: select( CORE_SITE ).getCurrentEntityURL(),
		...select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} ),
	};
};

/**
 * Selects report args from the store.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Function} select Registry select.
 * @return {Object} Report args.
 */
export const selectReportArgs = ( select ) => {
	return {
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
		dimensions: [ 'ga:channelGrouping' ],
		...select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} ),
	};
};

export default whenActive( {
	moduleName: 'analytics',
	FallbackComponent: ( { WidgetActivateModuleCTA } ) => <WidgetActivateModuleCTA moduleSlug="analytics" />,
	IncompleteComponent: ( { WidgetCompleteModuleActivationCTA } ) => <WidgetCompleteModuleActivationCTA moduleSlug="analytics" />,
} )( DashboardUniqueVisitorsWidget );
