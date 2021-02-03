/**
 * DashboardAllTrafficWidget component
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
import { _x } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { FORM_ALL_TRAFFIC_WIDGET, DATE_RANGE_OFFSET, MODULES_ANALYTICS } from '../../../datastore/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { Grid, Row, Cell } from '../../../../../material-components/layout';
import { getURLPath } from '../../../../../util/getURLPath';
import whenActive from '../../../../../util/when-active';
import SourceLink from '../../../../../components/SourceLink';
import ReportError from '../../../../../components/ReportError';
import ReportZero from '../../../../../components/ReportZero';
import TotalUserCount from './TotalUserCount';
import UserCountGraph from './UserCountGraph';
import DimensionTabs from './DimensionTabs';
import UserDimensionsPieChart from './UserDimensionsPieChart';
import { isZeroReport } from '../../../util';
const { useSelect } = Data;

function DashboardAllTrafficWidget( { Widget } ) {
	const [ firstLoad, setFirstLoad ] = useState( true );
	const [ currentRange, setCurrentRange ] = useState( '' );

	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const dimensionName = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionName' ) || 'ga:channelGrouping' );
	const dimensionValue = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionValue' ) );
	const entityURL = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );

	const {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
	} = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} ) );

	const baseArgs = {
		startDate,
		endDate,
		metrics: [ { expression: 'ga:users' } ],
	};

	const pieArgs = {
		...baseArgs,
		compareStartDate,
		compareEndDate,
		dimensions: [ dimensionName ],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
	};

	const graphArgs = {
		...baseArgs,
		dimensions: [ 'ga:date' ],
	};

	const totalsArgs = {
		...baseArgs,
		compareStartDate,
		compareEndDate,
	};

	if ( entityURL ) {
		pieArgs.url = entityURL;
		graphArgs.url = entityURL;
		totalsArgs.url = entityURL;
	}

	if ( dimensionName && dimensionValue ) {
		graphArgs.dimensionFilters = { [ dimensionName ]: dimensionValue };
		totalsArgs.dimensionFilters = { [ dimensionName ]: dimensionValue };
	}

	const pieChartLoaded = useSelect( ( select ) => select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ pieArgs ] ) );
	const pieChartError = useSelect( ( select ) => select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ pieArgs ] ) );
	const pieChartReport = useSelect( ( select ) => select( MODULES_ANALYTICS ).getReport( pieArgs ) );

	const userCountGraphLoaded = useSelect( ( select ) => select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ graphArgs ] ) );
	const userCountGraphError = useSelect( ( select ) => select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ graphArgs ] ) );
	const userCountGraphReport = useSelect( ( select ) => select( MODULES_ANALYTICS ).getReport( graphArgs ) );

	const totalUsersLoaded = useSelect( ( select ) => select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ totalsArgs ] ) );
	const totalUsersError = useSelect( ( select ) => select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ totalsArgs ] ) );
	const totalUsersReport = useSelect( ( select ) => select( MODULES_ANALYTICS ).getReport( totalsArgs ) );

	let reportType;
	switch ( dimensionName ) {
		case 'ga:country':
			reportType = 'visitors-geo';
			break;
		case 'ga:deviceCategory':
			reportType = 'visitors-mobile-overview';
			break;
		case 'ga:channelGrouping':
		default:
			reportType = 'trafficsources-overview';
			break;
	}

	let reportArgs = {};
	if ( entityURL ) {
		reportArgs = {
			'explorer-table.plotKeys': '[]',
			'_r.drilldown': `analytics.pagePath:${ getURLPath( entityURL ) }`,
		};
	}

	const serviceReportURL = useSelect( ( select ) => select( MODULES_ANALYTICS ).getServiceReportURL( reportType, reportArgs ) );

	useEffect( () => {
		if ( dateRange !== currentRange ) {
			setFirstLoad( true );
			setCurrentRange( dateRange );
		} else if ( pieChartLoaded && totalUsersLoaded && userCountGraphLoaded ) {
			setFirstLoad( false );
		}
	}, [
		pieChartLoaded,
		totalUsersLoaded,
		userCountGraphLoaded,
		dateRange,
		currentRange,
	] );

	if ( pieChartError ) {
		return <ReportError moduleSlug="analytics" error={ pieChartError } />;
	}

	if ( isZeroReport( pieChartReport ) ) {
		// TODO: Replace with `props.WidgetReportZero` once legacy dashboard UI has been removed.
		return <ReportZero moduleSlug="analytics" />;
	}

	return (
		<Widget
			className="googlesitekit-widget--footer-v2"
			Footer={ () => (
				<SourceLink
					className="googlesitekit-data-block__source"
					name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					href={ serviceReportURL }
					external
				/>
			) }
			noPadding
		>
			<Grid>
				<Row>
					<Cell
						className="googlesitekit-widget--analyticsAllTraffic__totals"
						lgSize={ 7 }
						mdSize={ 8 }
					>
						<TotalUserCount
							loaded={ totalUsersLoaded && ! firstLoad }
							report={ totalUsersReport }
							error={ totalUsersError }
							dimensionValue={ dimensionValue }
						/>

						<UserCountGraph
							loaded={ userCountGraphLoaded && ! firstLoad }
							error={ userCountGraphError }
							report={ userCountGraphReport }
						/>
					</Cell>

					<Cell
						className="googlesitekit-widget--analyticsAllTraffic__dimensions"
						lgSize={ 5 }
						mdSize={ 8 }
					>
						<DimensionTabs
							loaded={ ! firstLoad }
							dimensionName={ dimensionName }
						/>

						<UserDimensionsPieChart
							dimensionName={ dimensionName }
							dimensionValue={ dimensionValue }
							sourceLink={ serviceReportURL }
							loaded={ pieChartLoaded && ! firstLoad }
							report={ pieChartReport }
						/>
					</Cell>
				</Row>
			</Grid>
		</Widget>
	);
}

export default whenActive( { moduleName: 'analytics' } )( DashboardAllTrafficWidget );
