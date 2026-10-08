/**
 * FeatureServiceIdentity stories.
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
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { Story } from '@/js/types/Story';
import { provideModuleRegistrations, provideModules } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FeatureServiceIdentity, {
	FeatureServiceIdentityProps,
} from './FeatureServiceIdentity';

const feature: Feature = {
	slug: 'test-feature',
	title: 'Test feature',
	shortDescription: 'Test feature description.',
	effort: FEATURE_EFFORTS.LOW,
	goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
	addedInVersion: '1.186.0',
	prerequisiteModules: [],
	badges: [],
	setup: { type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE },
};

function Template( args: FeatureServiceIdentityProps ) {
	return <FeatureServiceIdentity { ...args } />;
}

export const WithModule = Template.bind(
	{}
) as Story< FeatureServiceIdentityProps >;
WithModule.args = {
	feature: { ...feature, moduleSlug: MODULE_SLUG_ANALYTICS_4 },
};

export const WithoutModule = Template.bind(
	{}
) as Story< FeatureServiceIdentityProps >;
WithoutModule.args = { feature };

export default {
	title: 'Components/Feature Discovery/FeatureServiceIdentity',
	component: FeatureServiceIdentity,
	decorators: [
		( StoryComponent: Story ) => {
			function setupRegistry( registry: WPDataRegistry ) {
				provideModuleRegistrations( registry );
				provideModules( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
