/**
 * Feature Discovery: pending setup record.
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
import type { Select } from 'googlesitekit-data';
import {
	ALL_SERVICES_TAB_PATH,
	WHATS_NEW_TAB_PATH,
} from '@/js/components/feature-discovery/constants';
import { deleteItem, getItem, setItem } from '@/js/googlesitekit/api/cache';
import type { PendingSetup } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

export const FEATURE_DISCOVERY_SETUP_CACHE_KEY = 'feature_discovery_setup';

/**
 * Gets the path of the hub tab the user is currently on.
 *
 * @since n.e.x.t
 *
 * @return {string} The tab's route path, defaulting to the "All services and features" tab.
 */
export function getCurrentFeatureDiscoveryTabPath(): string {
	const hashPath = global.location.hash.replace( /^#/, '' );

	return hashPath === WHATS_NEW_TAB_PATH
		? WHATS_NEW_TAB_PATH
		: ALL_SERVICES_TAB_PATH;
}

/**
 * Records that the user left the hub to set up a feature.
 *
 * The item is stored in session storage with the cache's default TTL (one
 * hour), so that it belongs to the browser tab the user left from, survives
 * the OAuth round trip and expires if the setup is abandoned.
 *
 * @since n.e.x.t
 *
 * @param {string} featureSlug Feature's slug.
 * @param {string} returnTab   Path of the tab to return the user to.
 * @return {Promise<boolean>} Resolves to `true` if the record was saved.
 */
export function setPendingSetup(
	featureSlug: string,
	returnTab: string
): Promise< boolean > {
	return setItem( FEATURE_DISCOVERY_SETUP_CACHE_KEY, {
		featureSlug,
		returnTab,
	} );
}

/**
 * Reads the pending setup record and deletes it, so it can only ever be
 * consumed once.
 *
 * This must only be called from the hub's mount.
 *
 * @since n.e.x.t
 *
 * @return {Promise<(Object|null)>} The record, or `null` if there is none or it has expired.
 */
export async function consumePendingSetup(): Promise< PendingSetup | null > {
	const { cacheHit, value } = await getItem(
		FEATURE_DISCOVERY_SETUP_CACHE_KEY
	);

	await deleteItem( FEATURE_DISCOVERY_SETUP_CACHE_KEY );

	return cacheHit ? ( value as PendingSetup ) : null;
}

/**
 * Gets the hub URL a setup flow should complete to, where the pending setup
 * record belongs to the feature that just completed.
 *
 * The record is only read, not deleted, so it is left for
 * `consumePendingSetup()` to pick up once the hub mounts.
 *
 * @since n.e.x.t
 *
 * @param {Function} select      Registry `select` function.
 * @param {string}   featureSlug Slug of the feature whose setup has completed.
 * @return {Promise<(string|undefined)>} The hub's admin URL, or `undefined` where the flow should complete as usual.
 */
export async function getPendingSetupReturnURL(
	select: Select,
	featureSlug: string
): Promise< string | undefined > {
	const { cacheHit, value } = await getItem(
		FEATURE_DISCOVERY_SETUP_CACHE_KEY
	);

	if (
		! cacheHit ||
		( value as PendingSetup )?.featureSlug !== featureSlug
	) {
		return undefined;
	}

	return select( CORE_SITE ).getAdminURL( 'googlesitekit-features' );
}
