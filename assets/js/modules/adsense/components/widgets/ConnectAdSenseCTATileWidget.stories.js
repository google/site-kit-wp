/**
 * ConnectAdSenseCTATileWidget Component Stories.
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
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import ConnectAdSenseCTATileWidget from './ConnectAdSenseCTATileWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsConnectAdSenseCTATile'
)( ConnectAdSenseCTATileWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'ConnectAdSenseCTATileWidget';
Default.scenario = {
	label: 'KeyMetrics/ConnectAdSenseCTATileWidget',
	delay: 250,
};

export default {
	title: 'Key Metrics/ConnectAdSenseCTATileWidget',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'adsense',
						active: false,
						connected: false,
					},
				] );
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
