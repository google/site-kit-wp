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
	STORY_INITIAL_VERSION,
	storyFeatures,
	storyModules,
} from '@/js/components/feature-discovery/__fixtures__';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { Registry } from '@/js/googlesitekit-data';
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/test-utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FeatureDiscoveryApp from './FeatureDiscoveryApp';

function setupRegistry( registry: Registry ) {
	provideModules( registry, storyModules );
	provideModuleRegistrations( registry );
	provideSiteInfo( registry );

	// Seeded so the cards resolve their newness state without a request.
	registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
	registry
		.dispatch( CORE_USER )
		.receiveInitialSiteKitVersion( STORY_INITIAL_VERSION );

	provideFeatures( registry, storyFeatures );
}

function Template() {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider value={ VIEW_CONTEXT_FEATURE_DISCOVERY }>
				<FeatureDiscoveryApp />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const AllServices = Template.bind( {} ) as Story;
AllServices.storyName = 'All services and features';
AllServices.parameters = { route: '/all-services' };
AllServices.scenario = {};

export const WhatsNew = Template.bind( {} ) as Story;
WhatsNew.storyName = 'What’s new?';
WhatsNew.parameters = { route: '/whats-new' };
WhatsNew.scenario = {};

export default {
	title: 'Components/FeatureDiscovery/FeatureDiscoveryApp',
	component: FeatureDiscoveryApp,
	parameters: { padding: 0, features: [ 'featureDiscoveryHub' ] },
};
