/**
 * ConnectGA4CTATileWidget Component Stories.
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
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import {
	provideKeyMetrics,
	provideModules,
} from '../../../../../../tests/js/utils';
import { KM_ANALYTICS_LOYAL_VISITORS } from '../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsConnectGA4CTATile'
)( ConnectGA4CTATileWidget );

const Template = () => <WidgetWithComponentProps />;

export const Default = Template.bind( {} );
Default.storyName = 'ConnectGA4CTATileWidget';
Default.scenario = {
	label: 'KeyMetrics/ConnectGA4CTATileWidget',
	delay: 250,
};
Default.parameters = {
	features: [ 'userInput' ],
};

export default {
	title: 'Key Metrics/ConnectGA4CTATileWidget',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: false,
						connected: false,
					},
				] );
				provideKeyMetrics( registry, {
					widgetSlugs: [ KM_ANALYTICS_LOYAL_VISITORS ],
				} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
