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
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
} from '../../../../../../tests/js/utils';
import { provideKeyMetricsWidgetRegistrations } from '../../../../components/KeyMetrics/test-utils';
import {
	KM_ANALYTICS_POPULAR_AUTHORS,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
} from '../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsConnectAdSenseCTATile'
)( ConnectGA4CTATileWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'ConnectGA4CTATileWidget';
Default.args = {
	keyMetricsWidgets: {
		[ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES ]: {
			modules: [ 'analytics-4' ],
		},
		[ KM_ANALYTICS_POPULAR_AUTHORS ]: {
			modules: [ 'analytics-4' ],
		},
	},
};

export const WithSingleWidget = Template.bind( {} );
WithSingleWidget.storyName = 'ConnectGA4CTATileWidget (for single widget)';
WithSingleWidget.args = {
	keyMetricsWidgets: {
		[ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES ]: {
			modules: [ 'analytics-4' ],
		},
	},
};

export default {
	title: 'Key Metrics/ConnectGA4CTATileWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry );
				provideUserCapabilities( registry );
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: false,
						connected: false,
					},
				] );
				provideModuleRegistrations( registry );
				provideSiteInfo( registry, {
					postTypes: [ { slug: 'product', label: 'Product' } ],
				} );
				provideKeyMetricsWidgetRegistrations(
					registry,
					args?.keyMetricsWidgets
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
