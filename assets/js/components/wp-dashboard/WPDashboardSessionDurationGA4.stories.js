/**
 * WP Dashboard Session Duration GA4 Component Stories.
 *
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
	setupAnalytics4MockReportsWithNoDataInComparisonDateRange,
} from './common-GA4.stories';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import WPDashboardSessionDurationGA4 from './WPDashboardSessionDurationGA4';

const WidgetWithComponentProps = withWPDashboardWidgetComponentProps(
	'widget-slug'
)( WPDashboardSessionDurationGA4 );

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
	setupRegistry: setupAnalytics4MockReports,
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: setupAnalytics4GatheringData,
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: setupAnalytics4ZeroData,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: setupAnalytics4Loading,
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: setupAnalytics4Error,
};

export const NoDataInComparisonDateRange = Template.bind( {} );
NoDataInComparisonDateRange.storyName = 'NoDataInComparisonDateRange';
NoDataInComparisonDateRange.args = {
	setupRegistry: setupAnalytics4MockReportsWithNoDataInComparisonDateRange,
};
NoDataInComparisonDateRange.scenario = {};

export default {
	title: 'Views/WPDashboardApp/WPDashboardSessionDurationGA4',
	decorators: widgetDecorators,
};
