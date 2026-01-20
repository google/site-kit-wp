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
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
} from '../../../tests/js/utils';
import WithRegistrySetup from '../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import ActivateAnalyticsCTA from './ActivateAnalyticsCTA';

function Template( { setupRegistry = () => {}, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ActivateAnalyticsCTA { ...args } />
		</WithRegistrySetup>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default (SFR Enabled)';
Default.args = {
	dismissedItemSlug: 'analytics-setup-cta-search-funnel',
};
Default.parameters = {
	features: [ 'setupFlowRefresh' ],
};
Default.scenario = {};

export const WithoutDismissedSlug = Template.bind( {} );
WithoutDismissedSlug.storyName = 'Without Dismissed Slug (SFR Enabled)';
WithoutDismissedSlug.args = {};
WithoutDismissedSlug.parameters = {
	features: [ 'setupFlowRefresh' ],
};

export const AnalyticsActiveNotConnected = Template.bind( {} );
AnalyticsActiveNotConnected.storyName =
	'Analytics Active Not Connected (SFR Enabled)';
AnalyticsActiveNotConnected.args = {
	dismissedItemSlug: 'analytics-setup-cta-search-funnel',
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
		] );
	},
};
AnalyticsActiveNotConnected.parameters = {
	features: [ 'setupFlowRefresh' ],
};

export const LegacyView = Template.bind( {} );
LegacyView.storyName = 'Legacy View (SFR Disabled)';
LegacyView.args = {
	children: <p>Preview graph content here</p>,
};
LegacyView.parameters = {
	features: [],
};

export default {
	title: 'Components/ActivateAnalyticsCTA',
	component: ActivateAnalyticsCTA,
	decorators: [
		( Story ) => (
			<div style={ { maxWidth: '600px' } }>
				<Story />
			</div>
		),
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: false,
						connected: false,
					},
					{
						slug: 'search-console',
						active: true,
						connected: true,
					},
				] );
				provideSiteInfo( registry );
				provideUserCapabilities( registry );
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				if ( args?.setupRegistry ) {
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
};
