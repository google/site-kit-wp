/**
 * WP Dashboard Clicks Component Stories.
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
	setupSearchConsoleAnalyticsZeroData,
	setupSearchConsoleGatheringData,
	setupSearchConsoleMockReports,
	widgetDecorators,
} from './common.stories';
import WPDashboardClicks from './WPDashboardClicks';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';

const WidgetWithComponentProps =
	withWPDashboardWidgetComponentProps( 'widget-slug' )( WPDashboardClicks );

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
	setupRegistry: setupSearchConsoleMockReports,
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: setupSearchConsoleGatheringData,
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: setupSearchConsoleAnalyticsZeroData,
};

export default {
	title: 'Views/WPDashboardApp/WPDashboardClicks',
	decorators: widgetDecorators,
};
