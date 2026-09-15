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
import {
	FEATURE_BADGES,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureNewnessKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { Story } from '@/js/types/Story';
import { provideModuleRegistrations, provideModules } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import WhatsNewTab from './WhatsNewTab';

const TEST_INITIAL_VERSION = '1.186.0';
const TEST_OLDER_VERSION = '1.186.0';
const TEST_NEWER_VERSION = '1.188.0';

// A timer that is well clear of expiry, so the feature is seen but still listed.
const ACTIVE_TIMER = Number.MAX_SAFE_INTEGER;

const TEST_FEATURES: Partial< Feature >[] = [
	{
		slug: 'ads',
		title: 'Increase your visibility in Search',
		shortDescription:
			'Appear in search results when people look for keywords related to what you offer. Ads helps you connect with people at the moment they’re actively interested in your services or products.',
		effort: FEATURE_EFFORTS.HIGH,
		goalCategories: [ FEATURE_CATEGORIES.TRAFFIC ],
		moduleSlug: MODULE_SLUG_ADS,
		addedInVersion: TEST_NEWER_VERSION,
		badges: [ FEATURE_BADGES.PAID_SERVICE ],
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
		},
	},
	{
		slug: 'dashboard-sharing',
		title: 'Collaborate with other team members by sharing dashboard access',
		shortDescription:
			'Give other users access to Site Kit dashboard and insights without sharing your Google account credentials.',
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.PRODUCTIVITY ],
		addedInVersion: TEST_OLDER_VERSION,
		setup: {
			type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
		},
	},
	{
		slug: 'key-metrics',
		title: 'See the metrics that matter most to your goals',
		shortDescription:
			'Pick the metrics that match what you want to achieve, and Site Kit shows them at the top of your dashboard.',
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		addedInVersion: TEST_OLDER_VERSION,
		setup: {
			type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
		},
	},
];

interface StoryArgs {
	setupRegistry?: ( registry: WPDataRegistry ) => void;
}

// Marking the listed features as seen posts their timers. Echoing the state
// back keeps each story's seen/unseen split stable.
function provideNewnessState(
	registry: WPDataRegistry,
	expirableItems: Record< string, number >
) {
	registry.dispatch( CORE_USER ).receiveGetExpirableItems( expirableItems );

	fetchMock.postOnce(
		new RegExp(
			'^/google-site-kit/v1/core/user/data/set-expirable-item-timers'
		),
		{ body: expirableItems, status: 200 }
	);
}

function Template() {
	return <WhatsNewTab />;
}

export const Default = Template.bind( {} ) as Story< StoryArgs >;
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideFeatures( registry, TEST_FEATURES );

		provideNewnessState(
			registry,
			Object.fromEntries(
				TEST_FEATURES.map( ( { slug } ) => [
					getFeatureNewnessKey( slug as string ),
					ACTIVE_TIMER,
				] )
			)
		);
	},
};
Default.scenario = {};

export const WithUnreadFeatures = Template.bind( {} ) as Story< StoryArgs >;
WithUnreadFeatures.storyName = 'With Unread Features';
WithUnreadFeatures.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideFeatures( registry, TEST_FEATURES );

		// Only `key-metrics` has been seen, so the other two carry their dot.
		provideNewnessState( registry, {
			[ getFeatureNewnessKey( 'key-metrics' ) ]: ACTIVE_TIMER,
		} );
	},
};
WithUnreadFeatures.scenario = {};

export const NoFeatures = Template.bind( {} ) as Story< StoryArgs >;
NoFeatures.storyName = 'No Features';
NoFeatures.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideNewnessState( registry, {} );
	},
};
// TODO: #13327 -- Enable the VRT scenario once the empty state's CTA lands.

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
				registry
					.dispatch( CORE_USER )
					.receiveInitialSiteKitVersion( TEST_INITIAL_VERSION );
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

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
