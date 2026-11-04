/**
 * Traffic Overview `startTimerOnce` utility.
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
import { Registry } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { ExpirableItemTimer } from '@/js/modules/analytics-4/components/traffic-overview/constants';

/**
 * Starts an expirable item timer, unless the user already has it.
 *
 * Starting a timer the user already has would restart it, so a timer that
 * marks the first time something happened would never expire. When the
 * expirable items fail to load, the timer does not start, because the user
 * may already have it.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The data registry.
 * @param {Object} timer    The timer to start, with its `slug` and `expiresInSeconds`.
 * @return {Promise<void>} Resolves once the timer has started, or once it is known that the timer already exists.
 */
export async function startTimerOnce(
	registry: Registry,
	timer: ExpirableItemTimer
): Promise< void > {
	await registry.resolveSelect( CORE_USER ).getExpirableItems();

	if (
		registry.select( CORE_USER ).hasExpirableItem( timer.slug ) !== false
	) {
		return;
	}

	await registry.dispatch( CORE_USER ).setExpirableItemTimers( [ timer ] );
}
