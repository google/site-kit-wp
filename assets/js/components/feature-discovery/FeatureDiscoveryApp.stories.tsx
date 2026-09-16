/**
 * Feature Discovery App stories.
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
	PARTIALLY_SEEN_TIMERS,
	SEEN_TIMERS,
	WHATS_NEW_FEATURES,
	provideFeatures,
	provideWhatsNewState,
} from '@/js/components/feature-discovery/__fixtures__/whats-new';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { Registry } from '@/js/googlesitekit-data';
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/test-utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FeatureDiscoveryApp from './FeatureDiscoveryApp';

interface StoryArgs {
	setupRegistry?: ( registry: Registry ) => void;
}

function Template( { setupRegistry = () => {} }: StoryArgs ) {
	function setupStoryRegistry( registry: Registry ) {
		provideSiteInfo( registry );
		provideModuleRegistrations( registry );
		provideModules( registry, [ { slug: MODULE_SLUG_ADS, name: 'Ads' } ] );

		setupRegistry( registry );
	}

	return (
		<WithRegistrySetup func={ setupStoryRegistry }>
			<ViewContextProvider value={ VIEW_CONTEXT_FEATURE_DISCOVERY }>
				<FeatureDiscoveryApp />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const AllServices = Template.bind( {} ) as Story< StoryArgs >;
AllServices.storyName = 'All services and features';
AllServices.parameters = { route: '/all-services' };
AllServices.scenario = {};

export const WhatsNewUnread = Template.bind( {} ) as Story< StoryArgs >;
WhatsNewUnread.storyName = 'What’s new?, unread features';
WhatsNewUnread.parameters = { route: '/whats-new' };
WhatsNewUnread.args = {
	setupRegistry: ( registry: Registry ) => {
		provideFeatures( registry, WHATS_NEW_FEATURES );
		provideWhatsNewState( registry, PARTIALLY_SEEN_TIMERS );
	},
};
WhatsNewUnread.scenario = {};

export const WhatsNewSeen = Template.bind( {} ) as Story< StoryArgs >;
WhatsNewSeen.storyName = 'What’s new?, seen features';
WhatsNewSeen.parameters = { route: '/whats-new' };
WhatsNewSeen.args = {
	setupRegistry: ( registry: Registry ) => {
		provideFeatures( registry, WHATS_NEW_FEATURES );
		provideWhatsNewState( registry, SEEN_TIMERS );
	},
};
WhatsNewSeen.scenario = {};

export const WhatsNewEmpty = Template.bind( {} ) as Story< StoryArgs >;
WhatsNewEmpty.storyName = 'What’s new?, no features';
WhatsNewEmpty.parameters = { route: '/whats-new' };
WhatsNewEmpty.args = {
	setupRegistry: ( registry: Registry ) => {
		provideWhatsNewState( registry );
	},
};
// TODO: #13327 -- Enable the VRT scenario once the empty tab's CTA lands.

export default {
	title: 'Components/FeatureDiscovery/FeatureDiscoveryApp',
	component: FeatureDiscoveryApp,
	parameters: { padding: 0, features: [ 'featureDiscoveryHub' ] },
};
