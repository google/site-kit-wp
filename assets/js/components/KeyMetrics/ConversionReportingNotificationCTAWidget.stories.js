/**
 * ConversionReportingNotificationCTAWidget Component Stories.
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
import {
	provideModules,
	provideUserAuthentication,
} from '../../../../tests/js/test-utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import ConversionReportingNotificationCTAWidget from './ConversionReportingNotificationCTAWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsSetupCTA'
)( ConversionReportingNotificationCTAWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'ConversionReportingNotificationCTAWidget';
Default.scenario = {
	label: 'KeyMetrics/ConversionReportingNotificationCTAWidget',
};

export default {
	title: 'Key Metrics/ConversionReportingNotificationCTAWidget',
	decorators: [
		( Story ) => {
			const setupRegistry = async ( registry ) => {
				global._googlesitekitUserData.isUserInputCompleted = true;
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );
				provideUserAuthentication( registry );
				const data = {
					newEvents: [ 'contact' ],
					lostEvents: [],
				};

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveConversionReportingInlineData( data );
				// TODO: update the story based on the rendering logic of the widget.
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
