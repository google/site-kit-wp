/**
 * WhatsNewTab stories.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	PARTIALLY_SEEN_TIMERS,
	SEEN_TIMERS,
	WHATS_NEW_FEATURES,
	provideFeatures,
	provideWhatsNewState,
} from '@/js/components/feature-discovery/__fixtures__/whats-new';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideNotifications,
	provideSiteInfo,
	provideUserCapabilities,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import WhatsNewTab from './WhatsNewTab';

interface StoryArgs {
	setupRegistry?: ( registry: WPDataRegistry ) => void;
}

function Template() {
	return <WhatsNewTab />;
}

export const Default = Template.bind( {} ) as Story< StoryArgs >;
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideFeatures( registry, WHATS_NEW_FEATURES );
		provideWhatsNewState( registry, SEEN_TIMERS );
	},
};

export const WithUnreadFeatures = Template.bind( {} ) as Story< StoryArgs >;
WithUnreadFeatures.storyName = 'With Unread Features';
WithUnreadFeatures.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideFeatures( registry, WHATS_NEW_FEATURES );
		provideWhatsNewState( registry, PARTIALLY_SEEN_TIMERS );
	},
};

export const NoFeatures = Template.bind( {} ) as Story< StoryArgs >;
NoFeatures.storyName = 'No Features';
NoFeatures.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideWhatsNewState( registry );
	},
};
export const WithAutoUpdatesNotice = Template.bind( {} ) as Story< StoryArgs >;
WithAutoUpdatesNotice.storyName = 'With Auto-updates Notice';
WithAutoUpdatesNotice.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideFeatures( registry, WHATS_NEW_FEATURES );
		provideWhatsNewState( registry, PARTIALLY_SEEN_TIMERS );
		provideSiteInfo( registry, {
			changePluginAutoUpdatesCapacity: true,
			siteKitAutoUpdatesEnabled: false,
		} );
		provideUserCapabilities( registry, {
			googlesitekit_update_plugins: true,
		} );
		provideNotifications( registry, [] );
	},
};
WithAutoUpdatesNotice.scenario = {};

export default {
	title: 'Components/Feature Discovery/WhatsNewTab',
	component: WhatsNewTab,
	decorators: [
		(
			StoryComponent: Story< StoryArgs >,
			{ args }: { args: StoryArgs }
		) => {
			const { setupRegistry = () => {}, ...rest } = args;

			function setupStoryRegistry( registry: WPDataRegistry ) {
				provideModuleRegistrations( registry );
				provideModules( registry, [
					{ slug: MODULE_SLUG_ADS, name: 'Ads' },
				] );

				setupRegistry( registry );
			}

			return (
				<WithRegistrySetup func={ setupStoryRegistry }>
					<ViewContextProvider
						value={ VIEW_CONTEXT_FEATURE_DISCOVERY }
					>
						<StoryComponent { ...rest } />
					</ViewContextProvider>
				</WithRegistrySetup>
			);
		},
	],
};
