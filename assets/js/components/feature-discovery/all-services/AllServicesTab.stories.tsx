/**
 * AllServicesTab stories.
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
	STORY_INITIAL_VERSION,
	storyFeatures,
	storyModules,
} from '@/js/components/feature-discovery/__fixtures__';
import Layout from '@/js/components/layout/Layout';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Story } from '@/js/types/Story';
import { provideModuleRegistrations, provideModules } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import AllServicesTab from './AllServicesTab';

// The tab only ever renders inside the hub's card, which supplies its surface
// and horizontal padding, so the story renders it there too.
function Template() {
	return (
		<div className="googlesitekit-module-page googlesitekit-feature-discovery">
			<Layout rounded>
				<div className="googlesitekit-feature-discovery__content">
					<AllServicesTab />
				</div>
			</Layout>
		</div>
	);
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';
Default.scenario = {};

export default {
	title: 'Components/Feature Discovery/AllServicesTab',
	component: AllServicesTab,
	parameters: { padding: 0 },
	decorators: [
		( StoryComponent: Story ) => {
			function setupRegistry( registry: WPDataRegistry ) {
				// Seeded so the cards resolve their newness state without a
				// request.
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
				registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
				registry
					.dispatch( CORE_USER )
					.receiveInitialSiteKitVersion( STORY_INITIAL_VERSION );

				provideModules( registry, storyModules );
				provideModuleRegistrations( registry );

				provideFeatures( registry, storyFeatures );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
