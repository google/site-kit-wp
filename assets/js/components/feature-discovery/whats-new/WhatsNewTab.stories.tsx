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
import { WHATS_NEW_TAB_PATH } from '@/js/components/feature-discovery/constants';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
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

export const WithSetupSuccessNotice = Template.bind( {} ) as Story< StoryArgs >;
WithSetupSuccessNotice.storyName = 'With Setup Success Notice';
WithSetupSuccessNotice.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideFeatures( registry, [
			...WHATS_NEW_FEATURES,
			{
				slug: 'set-up-feature',
				title: 'Set up feature',
				setup: {
					type: FEATURE_SETUP_TYPES.SETUP_FLOW,
					ctaLabel: 'Set up a sign-up form',
					isEnabled: () => true,
				},
				successNotice: {
					title: 'Success! Your Newsletter sign-up form by Reader Revenue Manager is set up',
					description:
						'You can always update your sign-up form settings in Publisher center',
					cta: {
						label: 'Go to Publisher center',
						getURL: () => 'https://publishercenter.google.com/',
						external: true,
					},
				},
			},
		] );
		provideWhatsNewState( registry, PARTIALLY_SEEN_TIMERS );
		// The auto-updates notice also qualifies, so the story shows the
		// success notice taking precedence over it.
		provideSiteInfo( registry, {
			changePluginAutoUpdatesCapacity: true,
			siteKitAutoUpdatesEnabled: false,
		} );
		provideUserCapabilities( registry, {
			googlesitekit_update_plugins: true,
		} );
		provideNotifications( registry, [] );
		registry.dispatch( CORE_FEATURE_DISCOVERY ).receivePendingSetup( {
			featureSlug: 'set-up-feature',
			returnTab: WHATS_NEW_TAB_PATH,
		} );
	},
};

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
