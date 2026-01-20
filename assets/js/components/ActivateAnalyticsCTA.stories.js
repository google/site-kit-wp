/**
 * ActivateAnalyticsCTA stories.
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
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
} from '../../../tests/js/utils';
import WithRegistrySetup from '../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import ActivateAnalyticsCTA from './ActivateAnalyticsCTA';

function Template( args ) {
	return <ActivateAnalyticsCTA { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

export const WithSetupFlowRefreshSetUpAnalytics = Template.bind( {} );
WithSetupFlowRefreshSetUpAnalytics.storyName =
	'Setup Flow Refresh - Set up Analytics';
WithSetupFlowRefreshSetUpAnalytics.args = {
	dismissedItemSlug: 'analytics-setup-cta-search-funnel',
};
WithSetupFlowRefreshSetUpAnalytics.parameters = {
	features: [ 'setupFlowRefresh' ],
};
WithSetupFlowRefreshSetUpAnalytics.scenario = {};

export const WithSetupFlowRefreshCompleteSetup = Template.bind( {} );
WithSetupFlowRefreshCompleteSetup.storyName =
	'Setup Flow Refresh - Complete Setup';
WithSetupFlowRefreshCompleteSetup.args = {
	dismissedItemSlug: 'analytics-setup-cta-search-funnel',
	_analyticsActive: true,
};
WithSetupFlowRefreshCompleteSetup.parameters = {
	features: [ 'setupFlowRefresh' ],
};

export default {
	title: 'Components/ActivateAnalyticsCTA',
	component: ActivateAnalyticsCTA,
	decorators: [
		( Story, { args } ) => {
			const analyticsActive = args?._analyticsActive || false;

			function setupRegistry( registry ) {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: analyticsActive,
						connected: false,
					},
					{
						slug: 'search-console',
						active: true,
						connected: true,
					},
				] );
				provideModuleRegistrations( registry );
				provideSiteInfo( registry );
				provideUserAuthentication( registry );
				provideUserCapabilities( registry );
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<div style={ { maxWidth: '600px' } }>
						<Story />
					</div>
				</WithRegistrySetup>
			);
		},
	],
};
