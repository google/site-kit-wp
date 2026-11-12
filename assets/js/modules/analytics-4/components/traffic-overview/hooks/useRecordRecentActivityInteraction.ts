/**
 * Traffic Overview `useRecordRecentActivityInteraction` hook.
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Registry, useRegistry } from 'googlesitekit-data';
import { RECENT_ACTIVITY_INTERACTION_TIMER } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { startTimerOnce } from '@/js/modules/analytics-4/components/traffic-overview/utils/startTimerOnce';

/**
 * Gets a callback that records a meaningful interaction with the Recent
 * activity tab.
 *
 * The callback starts the "meaningful interaction" timer, which decides when
 * the Recent activity survey for users who interacted with the tab shows. It
 * starts the timer at the first interaction only.
 *
 * @since 1.192.0
 *
 * @return {Function} A callback that returns a promise, which resolves once the interaction is saved.
 */
export function useRecordRecentActivityInteraction(): () => Promise< void > {
	const registry = useRegistry() as unknown as Registry;

	return useCallback(
		() => startTimerOnce( registry, RECENT_ACTIVITY_INTERACTION_TIMER ),
		[ registry ]
	);
}
