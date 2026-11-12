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

// The calls to `startTimerOnce()` still running, by registry and timer slug.
const pendingStarts = new WeakMap< Registry, Map< string, Promise< void > > >();

/**
 * Loads the expirable items, then starts the timer when the user does not have it.
 *
 * @since 1.192.0
 *
 * @param {Object} registry The data registry.
 * @param {Object} timer    The timer to start, with its `slug` and `expiresInSeconds`.
 * @return {Promise<void>} Resolves once the timer has started, or once it is known that the timer already exists.
 */
async function startTimer(
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

/**
 * Starts an expirable item timer, unless the user already has it.
 *
 * Starting a timer the user already has would restart it, so a timer that
 * marks the first time something happened would never expire. When the
 * expirable items fail to load, the timer does not start, because the user
 * may already have it.
 *
 * A call made while an earlier call for the same timer is still running
 * returns the earlier call's promise. Both calls would otherwise find that
 * the user does not have the timer yet, and send the same request twice.
 *
 * @since 1.192.0
 *
 * @param {Object} registry The data registry.
 * @param {Object} timer    The timer to start, with its `slug` and `expiresInSeconds`.
 * @return {Promise<void>} Resolves once the timer has started, or once it is known that the timer already exists.
 */
export function startTimerOnce(
	registry: Registry,
	timer: ExpirableItemTimer
): Promise< void > {
	const registryStarts =
		pendingStarts.get( registry ) ?? new Map< string, Promise< void > >();
	pendingStarts.set( registry, registryStarts );

	const pendingStart = registryStarts.get( timer.slug );

	if ( pendingStart ) {
		return pendingStart;
	}

	const start = startTimer( registry, timer ).finally( () => {
		registryStarts.delete( timer.slug );
	} );

	registryStarts.set( timer.slug, start );

	return start;
}
