/**
 * DashboardAllTrafficWidget component
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
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Widgets from 'googlesitekit-widgets';
import { STORE_NAME as MODULES_ANALYTICS, FORM_ALL_TRAFFIC_WIDGET } from '../../../datastore/constants';
import { STORE_NAME as CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { STORE_NAME as CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import whenActive from '../../../../../util/when-active';
import TotalUserCount from './TotalUserCount';
import UserCountGraph from './UserCountGraph';
import DimensionTabs from './DimensionTabs';
import UserDimensionsPieChart from './UserDimensionsPieChart';
import SourceLink from '../../../../../components/SourceLink';
import { Grid, Row, Cell } from '../../../../../material-components/layout';
const { Widget } = Widgets.components;
const { useSelect } = Data;

function DashboardAllTrafficWidget() {
	const dimensionName = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionName' ) || 'ga:channelGrouping' );
	const dimensionValue = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionValue' ) );
	const entityURL = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );

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
			'_r.drilldown': `analytics.pagePath:${ entityURL }`,
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
						lgSize={ 7 }
						mdSize={ 4 }
						smSize={ 4 }
					>
						<TotalUserCount dimensionName={ dimensionName } dimensionValue={ dimensionValue } />
						<UserCountGraph dimensionName={ dimensionName } dimensionValue={ dimensionValue } />
					</Cell>
					<Cell
						className="googlesitekit-widget--analyticsAllTrafficV2__dimensions"
						lgSize={ 5 }
						mdSize={ 4 }
						smSize={ 4 }
					>
						<DimensionTabs dimensionName={ dimensionName } />

						<UserDimensionsPieChart
							dimensionName={ dimensionName }
							entityURL={ entityURL }
							sourceLink={ serviceReportURL }
						/>
					</Cell>
				</Row>
			</Grid>
		</Widget>
	);
}

export default whenActive( { moduleName: 'analytics' } )( DashboardAllTrafficWidget );
