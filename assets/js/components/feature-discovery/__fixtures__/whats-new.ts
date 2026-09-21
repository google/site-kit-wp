/**
 * What’s new? tab fixtures.
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

export const INITIAL_VERSION = '1.186.0';

const OLDER_VERSION = '1.186.0';
const NEWER_VERSION = '1.188.0';

// A timer well clear of expiry, so the feature is seen but still listed.
const ACTIVE_TIMER = Number.MAX_SAFE_INTEGER;

export const WHATS_NEW_FEATURES: Partial< Feature >[] = [
	{
		slug: MODULE_SLUG_ADS,
		title: 'Increase your visibility in Search',
		shortDescription:
			'Appear in search results when people look for keywords related to what you offer. Ads helps you connect with people at the moment they’re actively interested in your services or products.',
		effort: FEATURE_EFFORTS.HIGH,
		goalCategories: [ FEATURE_CATEGORIES.TRAFFIC ],
		moduleSlug: MODULE_SLUG_ADS,
		addedInVersion: NEWER_VERSION,
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
		addedInVersion: OLDER_VERSION,
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
		addedInVersion: OLDER_VERSION,
		setup: {
			type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
		},
	},
];

// Every feature already seen, so none of them carry an unread dot.
export const SEEN_TIMERS = Object.fromEntries(
	WHATS_NEW_FEATURES.map( ( { slug } ) => [
		getFeatureNewnessKey( slug as string ),
		ACTIVE_TIMER,
	] )
);

// Only `key-metrics` has been seen, so the other two carry their dot.
export const PARTIALLY_SEEN_TIMERS = {
	[ getFeatureNewnessKey( 'key-metrics' ) ]: ACTIVE_TIMER,
};

/**
 * Provides the per-user newness state the What’s new? tab reads.
 *
 * Marking the listed features as seen posts their timers. Echoing the given
 * state back keeps each story's seen/unseen split stable.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Object} registry       Data registry object.
 * @param {Object} expirableItems Newness timers, keyed by expirable item slug.
 * @return {void}
 */
export function provideWhatsNewState(
	registry: WPDataRegistry,
	expirableItems: Record< string, number > = {}
) {
	registry
		.dispatch( CORE_USER )
		.receiveInitialSiteKitVersion( INITIAL_VERSION );
	registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	registry.dispatch( CORE_USER ).receiveGetExpirableItems( expirableItems );

	fetchMock.postOnce(
		new RegExp(
			'^/google-site-kit/v1/core/user/data/set-expirable-item-timers'
		),
		{ body: expirableItems, status: 200 }
	);
}

export { provideFeatures };
