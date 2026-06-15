/**
 * SetupUsingProxyViewOnly Component Stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import AnalyticsIcon from '@/svg/graphics/analytics.svg';
import SearchConsoleIcon from '@/svg/graphics/search-console.svg';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteConnection,
	provideUserCapabilities,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import SetupUsingProxyViewOnly from './index';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<SetupUsingProxyViewOnly />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

export default {
	title: 'Setup/Using Proxy View-Only and setupFlowRefreshPhase4 enabled',
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideSiteConnection( registry, {
					hasConnectedAdmins: false,
				} );

				registry
					.dispatch( CORE_USER )
					.receiveGetTracking( { enabled: false } );

				provideUserCapabilities( registry, {
					[ getMetaCapabilityPropertyName(
						PERMISSION_READ_SHARED_MODULE_DATA,
						MODULE_SLUG_SEARCH_CONSOLE
					) ]: true,
					[ getMetaCapabilityPropertyName(
						PERMISSION_READ_SHARED_MODULE_DATA,
						MODULE_SLUG_ANALYTICS_4
					) ]: true,
				} );

				provideModules( registry, [
					{
						slug: MODULE_SLUG_SEARCH_CONSOLE,
						active: true,
						connected: true,
						shareable: true,
					},
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
						shareable: true,
					},
				] );

				provideModuleRegistrations( registry, [
					{
						slug: MODULE_SLUG_SEARCH_CONSOLE,
						Icon: SearchConsoleIcon,
					},
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						Icon: AnalyticsIcon,
					},
				] );

				// Call story-specific setup.
				if ( typeof args?.setupRegistry === 'function' ) {
					args.setupRegistry( registry );
				}
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: {
		padding: 0,
		features: [ 'setupFlowRefreshPhase4' ],
	},
};
