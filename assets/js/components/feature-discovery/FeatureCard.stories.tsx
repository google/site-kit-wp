/**
 * FeatureCard stories.
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
	CORE_FEATURE_DISCOVERY,
	FEATURE_BADGES,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { Story } from '@/js/types/Story';
import { provideModuleRegistrations, provideModules } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FeatureCard, { FeatureCardProps } from './FeatureCard';

const TEST_OLD_VERSION = '1.84.0';
const TEST_INITIAL_VERSION = '1.86.0';
const TEST_NEW_VERSION = '1.87.0';

const TEST_FEATURE_SETTINGS = {
	title: 'Collaborate with other team members by sharing dashboard access',
	shortDescription:
		'Give other users access to Site Kit dashboard and insights without sharing your Google account credentials.',
	effort: FEATURE_EFFORTS.LOW,
	goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
	addedInVersion: TEST_OLD_VERSION,
	setup: {
		type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
	},
};

const TEST_MODULE_FEATURE_SETTINGS = {
	title: 'Increase your visibility in Search',
	shortDescription:
		'Appear in search results when people look for keywords related to what you offer. Ads helps you connect with people at the moment they’re actively interested in your services or products.',
	effort: FEATURE_EFFORTS.HIGH,
	goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
	moduleSlug: MODULE_SLUG_ADS,
	addedInVersion: TEST_OLD_VERSION,
	badges: [ FEATURE_BADGES.PAID_SERVICE ],
	setup: {
		type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
	},
};

const TEST_NEW_FEATURE_SETTINGS = {
	...TEST_MODULE_FEATURE_SETTINGS,
	addedInVersion: TEST_NEW_VERSION,
};

interface StoryArgs extends FeatureCardProps {
	setupRegistry?: ( registry: WPDataRegistry ) => void;
}

function Template( args: FeatureCardProps ) {
	return <FeatureCard { ...args } />;
}

export const Default = Template.bind( {} ) as Story< StoryArgs >;
Default.storyName = 'Default';
Default.args = {
	slug: 'dashboard-sharing',
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'dashboard-sharing', TEST_FEATURE_SETTINGS );
	},
};
Default.scenario = {};

export const ModuleFeature = Template.bind( {} ) as Story< StoryArgs >;
ModuleFeature.storyName = 'Module Feature';
ModuleFeature.args = {
	slug: 'ads',
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'ads', TEST_MODULE_FEATURE_SETTINGS );
	},
};
ModuleFeature.scenario = {};

export const New = Template.bind( {} ) as Story< StoryArgs >;
New.storyName = 'New';
New.args = {
	slug: 'dashboard-sharing',
	hideUnreadDot: true,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'dashboard-sharing', TEST_NEW_FEATURE_SETTINGS );
	},
};
New.scenario = {};

export const NewDismissible = Template.bind( {} ) as Story< StoryArgs >;
NewDismissible.storyName = 'New, Dismissible';
NewDismissible.args = {
	slug: 'ads',
	isDismissible: true,
	hideNewBadge: true,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'ads', TEST_NEW_FEATURE_SETTINGS );
	},
};
NewDismissible.scenario = {};

export default {
	title: 'Components/Feature Discovery/FeatureCard',
	component: FeatureCard,
	decorators: [
		(
			StoryComponent: Story< StoryArgs >,
			{ args }: { args: StoryArgs }
		) => {
			const { setupRegistry = () => {}, ...rest } = args;

			function setupStoryRegistry( registry: WPDataRegistry ) {
				registry
					.dispatch( CORE_USER )
					.receiveInitialSiteKitVersion( TEST_INITIAL_VERSION );

				provideModuleRegistrations( registry );
				provideModules( registry, [
					{ slug: MODULE_SLUG_ADS, name: 'Ads' },
				] );

				setupRegistry( registry );
			}

			return (
				<WithRegistrySetup func={ setupStoryRegistry }>
					<StoryComponent { ...rest } />
				</WithRegistrySetup>
			);
		},
	],
};
