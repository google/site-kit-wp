/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * Internal dependencies
 */
import { withWPDashboardWidgetComponentProps } from '../../googlesitekit/widgets/util';
import {
	setupAnalytics4MockReports,
	setupAnalytics4GatheringData,
	setupAnalytics4ZeroData,
	setupAnalytics4Loading,
	setupAnalytics4Error,
	widgetDecorators,
} from './common-GA4.stories';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import WPDashboardUniqueVisitorsChartGA4 from './WPDashboardUniqueVisitorsChartGA4';

const WidgetWithComponentProps = withWPDashboardWidgetComponentProps(
	'widget-slug'
)( WPDashboardUniqueVisitorsChartGA4 );

function Template( { setupRegistry = () => {}, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps { ...args } />
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		setupAnalytics4MockReports( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
	},
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: setupAnalytics4GatheringData,
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry ) => {
		setupAnalytics4ZeroData( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
	},
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading Data';
Loading.args = {
	setupRegistry: setupAnalytics4Loading,
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		setupAnalytics4Error( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
	},
};

export default {
	title: 'Views/WPDashboardApp/WPDashboardUniqueVisitorsChartGA4',
	decorators: widgetDecorators,
};
