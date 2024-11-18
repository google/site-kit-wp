/**
 * MetricsSelectionPanel Component Stories.
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
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import {
	provideKeyMetrics,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../googlesitekit/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from '../constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { provideKeyMetricsWidgetRegistrations } from '../test-utils';
import { Provider as ViewContextProvider } from '../../Root/ViewContextContext';
import MetricsSelectionPanel from './';

function Template( { viewContext } ) {
	return (
		<ViewContextProvider
			value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
		>
			<MetricsSelectionPanel />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'KeyMetrics/MetricsSelectionPanel',
};

export const ViewOnly = Template.bind( {} );
ViewOnly.storyName = 'View-only user';
ViewOnly.args = {
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export default {
	title: 'Key Metrics/MetricsSelectionPanel',
	component: MetricsSelectionPanel,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
					{
						slug: 'adsense',
						active: true,
						connected: true,
					},
				] );

				provideKeyMetricsWidgetRegistrations(
					registry,
					Object.keys( KEY_METRICS_WIDGETS ).reduce(
						( acc, widget ) => ( {
							...acc,
							[ widget ]: {
								modules: [
									'search-console',
									'analytics-4',
									'adsense',
								],
							},
						} ),
						{}
					)
				);

				provideKeyMetrics( registry, { widgetSlugs: [] } );

				registry
					.dispatch( CORE_UI )
					.setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );

				provideSiteInfo( registry, {
					postTypes: [ { slug: 'post', label: 'Post' } ],
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
