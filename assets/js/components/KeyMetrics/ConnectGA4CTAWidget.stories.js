/**
 * ConnectGA4CTA Component Stories.
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
import { provideModules } from '../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import ConnectGA4CTAWidget from './ConnectGA4CTAWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsConnectGA4CTA'
)( ConnectGA4CTAWidget );

const Template = () => <WidgetWithComponentProps />;

export const Default = Template.bind( {} );
Default.storyName = 'ConnectGA4CTAWidget';
Default.scenario = {
	label: 'KeyMetrics/ConnectGA4CTAWidget',
	delay: 250,
};
Default.parameters = {
	features: [ 'userInput' ],
};

export default {
	title: 'Key Metrics/ConnectGA4CTAWidget',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				global._googlesitekitUserData.isUserInputCompleted = false;
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: false,
						connected: false,
					},
				] );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
