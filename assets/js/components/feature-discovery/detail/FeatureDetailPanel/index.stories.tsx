/**
 * FeatureDetailPanel stories.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { sampleFeatures } from '@/js/components/feature-discovery/__fixtures__/all-services';
import { FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY } from '@/js/components/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FeatureDetailPanel, { type FeatureDetailPanelProps } from './';

function Template( args: FeatureDetailPanelProps ) {
	return <FeatureDetailPanel { ...args } />;
}

export const Description = Template.bind(
	{}
) as Story< FeatureDetailPanelProps >;
Description.storyName = 'Description';
Description.args = { initialActiveIndex: 0 };
// TODO: #13331 -- Description.scenario = {};

export const Requirements = Template.bind(
	{}
) as Story< FeatureDetailPanelProps >;
Requirements.storyName = 'Requirements';
Requirements.args = { initialActiveIndex: 1 };
// TODO: #13331 -- Requirements.scenario = {};

export const Screenshots = Template.bind(
	{}
) as Story< FeatureDetailPanelProps >;
Screenshots.storyName = 'Screenshots';
Screenshots.args = { initialActiveIndex: 2 };
// TODO: #13331 -- Screenshots.scenario = {};

export const RelevancyFeedback = Template.bind(
	{}
) as Story< FeatureDetailPanelProps >;
RelevancyFeedback.storyName = 'Relevancy Feedback';
// TODO: #13331 -- Enable scenario and commit references.
// RelevancyFeedback.scenario = {
// 	clickSelector: '.googlesitekit-thumbs-survey-trigger__button--down',
// 	postInteractionWait: 200,
// 	onReadyScript: 'mouse.js',
// };

export const RelevancyConfirmation = Template.bind(
	{}
) as Story< FeatureDetailPanelProps >;
RelevancyConfirmation.storyName = 'Relevancy Confirmation';
// TODO: #13331 -- Enable scenario and commit references.
// RelevancyConfirmation.scenario = {
// 	clickSelector: '.googlesitekit-thumbs-survey-trigger__button--up',
// 	postInteractionWait: 200,
// 	onReadyScript: 'mouse.js',
// };

// VRT scenarios and references arrive with the sub-tab content in #13331.
export default {
	title: 'Components/Feature Discovery/FeatureDetailPanel',
	component: FeatureDetailPanel,
	decorators: [
		( StoryComponent: Story ) => {
			function setupRegistry( registry: WPDataRegistry ) {
				const dismissedItems = new Set< string >();

				fetchMock.post(
					/^\/google-site-kit\/v1\/core\/user\/data\/dismissed-items/,
					( _url, { body } ) => {
						const { slugs } = JSON.parse( body as string ).data;
						slugs.forEach( ( slug: string ) =>
							dismissedItems.delete( slug )
						);
						return { body: Array.from( dismissedItems ) };
					},
					{ overwriteRoutes: true }
				);

				fetchMock.post(
					/^\/google-site-kit\/v1\/core\/user\/data\/dismiss-item\?/,
					( _url, { body } ) => {
						const { slug } = JSON.parse( body as string ).data;
						dismissedItems.add( slug );
						return { body: Array.from( dismissedItems ) };
					},
					{ overwriteRoutes: true }
				);

				fetchMock.post(
					/^\/google-site-kit\/v1\/core\/user\/data\/survey-trigger/,
					{ body: {} },
					{ overwriteRoutes: true }
				);

				provideModuleRegistrations( registry );
				provideModules( registry );
				provideFeatures( registry, sampleFeatures );
				provideSiteInfo( registry );
				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

				registry
					.dispatch( CORE_UI )
					.setValue(
						FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY,
						'analytics-setup'
					);
			}
			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
