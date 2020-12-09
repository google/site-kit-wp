/**
 * DashboardAllTrafficWidget component, mainly used for screen-reader text.
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
import { STORE_NAME as MODULE_ANALYTICS, FORM_ALL_TRAFFIC_WIDGET } from '../../../modules/analytics/datastore/constants';
import { STORE_NAME as CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import whenActive from '../../../util/when-active';
import TotalUserCount from './TotalUserCount';
import UserCountGraph from './UserCountGraph';
import DimensionTabs from './DimensionTabs';
import UserDimensionsPieChart from './UserDimensionsPieChart';
import SourceLink from '../../SourceLink';
const { Widget } = Widgets.components;
const { useSelect } = Data;

function DashboardAllTrafficWidget() {
	const dimensionName = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionName' ) || 'ga:channelGrouping' );
	const dimensionValue = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionValue' ) );
	const serviceReportURL = useSelect( ( select ) => select( MODULE_ANALYTICS ).getServiceReportURL( 'trafficsources-overview' ) );

	return <Widget
		slug="analyticsAllTrafficV2"
		noPadding
		footer={ () => (
			<SourceLink
				className="googlesitekit-data-block__source"
				name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
				href={ serviceReportURL }
				external
			/>
		) }
	>
		<div className="mdc-layout-grid">
			<div className="mdc-layout-grid__inner">
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-8">
					<TotalUserCount dimensionName={ dimensionName } dimensionValue={ dimensionValue } />
					<UserCountGraph dimensionName={ dimensionName } dimensionValue={ dimensionValue } />
				</div>
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-4">
					<DimensionTabs />
					<UserDimensionsPieChart />
				</div>
			</div>
		</div>
	</Widget>;
}

export default whenActive( { moduleName: 'analytics' } )( DashboardAllTrafficWidget );
