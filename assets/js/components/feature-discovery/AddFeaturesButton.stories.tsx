/**
 * AddFeaturesButton stories.
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
import { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import AddFeaturesButton from './AddFeaturesButton';

function Template() {
	return <AddFeaturesButton />;
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';
Default.scenario = {};

export const WithNewFeatures = Template.bind( {} ) as Story;
WithNewFeatures.storyName = 'With New Features';
WithNewFeatures.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'story-feature', {
				title: 'Story feature',
				shortDescription: 'A feature used in stories.',
				effort: FEATURE_EFFORTS.LOW,
				goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
				addedInVersion: '1.160.0',
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					isEnabled: () => false,
				},
			} );
	},
};
WithNewFeatures.scenario = {};

export default {
	title: 'Components/FeatureDiscovery/AddFeaturesButton',
	component: AddFeaturesButton,
	decorators: [
		(
			StoryComponent: () => ReactElement,
			{
				args,
			}: { args: { setupRegistry: ( registry: WPDataRegistry ) => void } }
		) => {
			return (
				<WithRegistrySetup
					func={ ( registry: WPDataRegistry ) => {
						provideSiteInfo( registry );

						registry
							.dispatch( CORE_USER )
							.receiveInitialSiteKitVersion( '1.160.0' );
						registry
							.dispatch( CORE_USER )
							.receiveGetDismissedItems( [] );
						registry
							.dispatch( CORE_USER )
							.receiveGetExpirableItems( {} );

						args.setupRegistry?.( registry );
					} }
				>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
