/**
 * FullScreenMetricsSelectionApp Component Stories.
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
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import {
	provideKeyMetrics,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from '../KeyMetrics/constants';
import { provideKeyMetricsWidgetRegistrations } from '../KeyMetrics/test-utils';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import FullScreenMetricsSelectionApp from './FullScreenMetricSelectionApp';
import fetchMock from 'fetch-mock';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<FullScreenMetricsSelectionApp />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'KeyMetrics/FullScreenMetricsSelectionPanel',
};

export default {
	title: 'Key Metrics/FullScreenMetricsSelectionApp',
	component: FullScreenMetricsSelectionApp,
	decorators: [
		( Story ) => {
			global._googlesitekitUserData.isUserInputCompleted = false;
			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/user-input-settings'
				),
				{
					body: {
						purpose: {
							values: [],
						},
						postFrequency: {
							scope: 'user',
							values: [],
						},
						goals: {
							scope: 'user',
							values: [],
						},
					},
					status: 200,
				}
			);
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry );
				provideSiteInfo( registry, {
					postTypes: [ { slug: 'post', label: 'Post' } ],
				} );
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				provideKeyMetricsWidgetRegistrations( registry, [] );
				provideKeyMetrics( registry, { widgetSlugs: [] } );

				registry
					.dispatch( CORE_UI )
					.setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
