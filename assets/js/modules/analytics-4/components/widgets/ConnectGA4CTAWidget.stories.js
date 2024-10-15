/**
 * ConnectGA4CTAWidget Component Stories.
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
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
} from '../../../../googlesitekit/datastore/user/constants';
import { provideKeyMetrics } from '../../../../../../tests/js/utils';
import { provideKeyMetricsWidgetRegistrations } from '../../../../components/KeyMetrics/test-utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import ConnectGA4CTAWidget from './ConnectGA4CTAWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsConnectGA4CTA'
)( ConnectGA4CTAWidget );

function Template() {
	return (
		<div className="googlesitekit-widget-area--mainDashboardKeyMetricsPrimary">
			<div className="googlesitekit-widget--keyMetricsConnectGA4All">
				<WidgetWithComponentProps />
			</div>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'ConnectGA4CTAWidget';
Default.scenario = {
	label: 'KeyMetrics/ConnectGA4CTAWidget',
};

export default {
	title: 'Key Metrics/ConnectGA4CTAWidget',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				const keyMetricWidgets = [
					KM_ANALYTICS_RETURNING_VISITORS,
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
				];

				provideKeyMetrics( registry, {
					widgetSlugs: keyMetricWidgets,
				} );

				provideKeyMetricsWidgetRegistrations(
					registry,
					keyMetricWidgets.reduce(
						( acc, widget ) => ( {
							...acc,
							[ widget ]: { modules: [ 'analytics-4' ] },
						} ),
						{}
					)
				);
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
