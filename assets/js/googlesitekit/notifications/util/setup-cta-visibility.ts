/**
 * Setup CTA visibility helper.
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
import { Registry, Select } from 'googlesitekit-data';
import {
	CORE_USER,
	INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
} from '@/js/googlesitekit/datastore/user/constants';

/**
 * Determines whether the setup CTAs are muted.
 *
 * Setup CTAs, overlays and the queued feature tour are muted for one week after
 * the welcome modal, so they don't stack on top of the setup notifications that
 * are already competing for the user's attention on the first dashboard landing.
 *
 * @since 1.187.0
 * @since n.e.x.t Only checks the one-week mute; the queue now decides what shows.
 *
 * @param {Function} select Data store select function.
 * @return {boolean} True when the setup CTAs are muted, false otherwise.
 */
export function areSetupCTAsMuted( select: Select ): boolean {
	return !! select( CORE_USER ).isItemDismissed(
		INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG
	);
}

/**
 * Builds a `checkRequirements` callback that keeps a setup CTA out of the
 * queue while the setup CTAs are muted.
 *
 * @since n.e.x.t
 *
 * @return {Function} Callback resolving to `true` when the setup CTAs are not muted.
 */
export function requireSetupCTAsNotMuted() {
	return async ( {
		select,
		resolveSelect,
	}: Registry ): Promise< boolean > => {
		// `isItemDismissed()` reports `undefined` until the dismissed items
		// resolve, which would otherwise read as "not muted".
		await resolveSelect( CORE_USER ).getDismissedItems();

		return ! areSetupCTAsMuted( select as Select );
	};
}
