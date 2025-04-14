/**
 * LinkAnalyticsAndAdSenseAccountsOverlayNotification component stories.
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
	provideModules,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import LinkAnalyticsAndAdSenseAccountsOverlayNotification from './LinkAnalyticsAndAdSenseAccountsOverlayNotification';

function Template() {
	return <LinkAnalyticsAndAdSenseAccountsOverlayNotification />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export default {
	title: 'Components/LinkAnalyticsAndAdSenseAccountsOverlayNotification',
	component: LinkAnalyticsAndAdSenseAccountsOverlayNotification,
	parameters: {
		viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
	},
	decorators: [
		( Story, { parameters } ) => {
			const { viewContext } = parameters;

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

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					adSenseLinked: false,
				} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<ViewContextProvider value={ viewContext }>
						<Story />
					</ViewContextProvider>
				</WithRegistrySetup>
			);
		},
	],
};
