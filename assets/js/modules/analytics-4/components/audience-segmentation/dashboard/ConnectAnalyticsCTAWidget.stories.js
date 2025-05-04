/**
 * ConnectAnalyticsCTAWidget Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { provideModuleRegistrations } from '../../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import ConnectAnalyticsCTAWidget from './ConnectAnalyticsCTAWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'audienceSegmentationConnectAnalytics'
)( ConnectAnalyticsCTAWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'ConnectAnalyticsCTAWidget';
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/ConnectAnalyticsCTAWidget',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/ConnectAnalyticsCTAWidget',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModuleRegistrations( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
