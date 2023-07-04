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
import {
	CORE_USER,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../googlesitekit/widgets/default-areas';
import { CONTEXT_MAIN_DASHBOARD_KEY_METRICS } from '../../googlesitekit/widgets/default-contexts';
import { provideKeyMetrics, provideModules } from '../../../../tests/js/utils';
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
				const keyMetricWidgets = [
					KM_ANALYTICS_LOYAL_VISITORS,
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
				];

				global._googlesitekitUserData.isUserInputCompleted = true;
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				provideKeyMetrics( registry, {
					widgetSlugs: keyMetricWidgets,
				} );

				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea(
						AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
						{
							title: 'Key metrics',
						}
					);
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea(
						AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
						CONTEXT_MAIN_DASHBOARD_KEY_METRICS
					);

				keyMetricWidgets.forEach( ( slug ) => {
					registry.dispatch( CORE_WIDGETS ).registerWidget( slug, {
						Component: () => <div>Hello test.</div>,
						modules: [ 'analytics-4' ],
					} );
					registry
						.dispatch( CORE_WIDGETS )
						.assignWidget(
							slug,
							AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY
						);
				} );

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
