/**
 * WPDashboardUniqueVisitorsChart Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
	setupAnalyticsGatheringData,
	setupAnalyticsMockReports,
	setupAnalyticsZeroData,
	widgetDecorators,
} from './common.stories';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { freezeFetch } from '../../../../tests/js/utils';
import WPDashboardUniqueVisitorsChart from './WPDashboardUniqueVisitorsChart';

const WidgetWithComponentProps = withWPDashboardWidgetComponentProps(
	'widget-slug'
)( WPDashboardUniqueVisitorsChart );

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
	setupRegistry: setupAnalyticsMockReports,
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'GatheringData';
GatheringData.args = {
	setupRegistry: setupAnalyticsGatheringData,
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: setupAnalyticsZeroData,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading Data';
Loading.args = {
	setupRegistry: () => {
		freezeFetch( RegExp( '/google-site-kit/v1/modules/analytics/data/' ) );
	},
};

export default {
	title: 'Views/WPDashboardApp/WPDashboardUniqueVisitorsChart',
	decorators: widgetDecorators,
};
