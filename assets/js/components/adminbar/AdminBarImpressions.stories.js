/**
 * Admin Bar Impressions Component Stories.
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
 * Internal dependencies
 */
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
import {
	setupSearchConsoleAnalytics4ZeroData,
	setupSearchConsoleGatheringData,
	setupSearchConsoleMockReports,
	widgetDecorators,
} from './common-GA4-stories';
import AdminBarImpressions from './AdminBarImpressions';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';

const WidgetWithComponentProps =
	withWidgetComponentProps( 'widget-slug' )( AdminBarImpressions );

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
	setupRegistry: setupSearchConsoleAnalytics4ZeroData,
};

export default {
	title: 'Views/AdminBarApp/AdminBarImpressions',
	decorators: widgetDecorators,
};
