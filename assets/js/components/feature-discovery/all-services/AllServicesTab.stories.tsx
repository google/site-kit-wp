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
	INITIAL_VERSION,
	sampleFeatures,
	sampleModules,
} from '@/js/components/feature-discovery/__fixtures__/all-services';
import { ALL_SERVICES_TAB_PATH } from '@/js/components/feature-discovery/constants';
import Layout from '@/js/components/layout/Layout';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideNotifications,
	provideSiteInfo,
} from '@tests/js/utils';
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

export const WithSetupSuccessNotice = Template.bind( {} ) as Story;
WithSetupSuccessNotice.storyName = 'With Setup Success Notice';
WithSetupSuccessNotice.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideSiteInfo( registry );
		provideFeatures( registry, [
			{
				slug: 'set-up-feature',
				title: 'Set up feature',
				setup: {
					type: FEATURE_SETUP_TYPES.SETUP_FLOW,
					ctaLabel: 'Set up now',
					isEnabled: () => true,
				},
				successNotice: {
					title: 'Success! AdSense is set up',
					description:
						'You are now monetizing your website with relevant ads',
				},
			},
		] );
		provideNotifications( registry, [] );
		registry.dispatch( CORE_FEATURE_DISCOVERY ).receivePendingSetup( {
			featureSlug: 'set-up-feature',
			returnTab: ALL_SERVICES_TAB_PATH,
		} );
	},
};

export default {
	title: 'Components/Feature Discovery/AllServicesTab',
	component: AllServicesTab,
	parameters: { padding: 0 },
	decorators: [
		( StoryComponent: Story, { args }: { args: Story[ 'args' ] } ) => {
			function setupRegistry( registry: WPDataRegistry ) {
				// Seeded so the cards resolve their newness state without a
				// request.
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
				registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
				registry
					.dispatch( CORE_USER )
					.receiveInitialSiteKitVersion( INITIAL_VERSION );

				provideModules( registry, sampleModules );
				provideModuleRegistrations( registry );

				provideFeatures( registry, sampleFeatures );

				args?.setupRegistry?.( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<ViewContextProvider
						value={ VIEW_CONTEXT_FEATURE_DISCOVERY }
					>
						<StoryComponent />
					</ViewContextProvider>
				</WithRegistrySetup>
			);
		},
	],
};
