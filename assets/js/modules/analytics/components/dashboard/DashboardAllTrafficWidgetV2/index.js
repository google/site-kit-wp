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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Widgets from 'googlesitekit-widgets';
import {
	MODULES_ANALYTICS,
	FORM_ALL_TRAFFIC_WIDGET,
	DATE_RANGE_OFFSET,
	STORE_NAME,
} from '../../../datastore/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../../util/when-active';
import TotalUserCount from './TotalUserCount';
import UserCountGraph from './UserCountGraph';
import DimensionTabs from './DimensionTabs';
import UserDimensionsPieChart from './UserDimensionsPieChart';
import SourceLink from '../../../../../components/SourceLink';
import { Grid, Row, Cell } from '../../../../../material-components/layout';
import { getURLPath } from '../../../../../util/getURLPath';
const { Widget } = Widgets.components;
const { useSelect } = Data;

function DashboardAllTrafficWidget() {
	const dimensionName = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionName' ) || 'ga:channelGrouping' );
	const dimensionValue = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionValue' ) );
	const entityURL = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );

	const dateRangeDatesWithCompare = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} ) );

	const dateRangeDatesWithoutCompare = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} ) );

	const pieArgs = {
		...dateRangeDatesWithCompare,
		metrics: [ { expression: 'ga:users' } ],
		dimensions: [ dimensionName ],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
	};

	const graphArgs = {
		...dateRangeDatesWithoutCompare,
		dimensions: [ 'ga:date' ],
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Users',
			},
		],
	};

	const totalsArgs = {
		...dateRangeDatesWithCompare,
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Users',
			},
		],
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

	const pieLoaded = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ pieArgs ] ) );
	const pieError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ pieArgs ] ) );
	const pieReport = useSelect( ( select ) => select( STORE_NAME ).getReport( pieArgs ) );

	const graphLoaded = useSelect( ( select ) => select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ graphArgs ] ) );
	const graphError = useSelect( ( select ) => select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ graphArgs ] ) );
	const graphReport = useSelect( ( select ) => select( MODULES_ANALYTICS ).getReport( graphArgs ) );

	const totalsLoaded = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ totalsArgs ] ) );
	const totalsError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ totalsArgs ] ) );
	const totalsReport = useSelect( ( select ) => select( STORE_NAME ).getReport( totalsArgs ) );

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

	return (
		<Widget
			slug="analyticsAllTrafficV2"
			className="googlesitekit-widget--footer-v2"
			footer={ () => (
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
						className="googlesitekit-widget--analyticsAllTrafficV2__totals"
						lgSize={ 7 }
						mdSize={ 8 }
					>
						<TotalUserCount
							loaded={ totalsLoaded }
							error={ totalsError }
							report={ totalsReport }
							dimensionValue={ dimensionValue }
						/>

						<UserCountGraph
							loaded={ graphLoaded }
							error={ graphError }
							report={ graphReport }
						/>
					</Cell>

					<Cell
						className="googlesitekit-widget--analyticsAllTrafficV2__dimensions"
						lgSize={ 5 }
						mdSize={ 8 }
					>
						<DimensionTabs
							dimensionName={ dimensionName }
						/>

						<UserDimensionsPieChart
							dimensionName={ dimensionName }
							sourceLink={ serviceReportURL }
							loaded={ pieLoaded }
							error={ pieError }
							report={ pieReport }
						/>
					</Cell>
				</Row>
			</Grid>
		</Widget>
	);
}

export default whenActive( { moduleName: 'analytics' } )( DashboardAllTrafficWidget );
