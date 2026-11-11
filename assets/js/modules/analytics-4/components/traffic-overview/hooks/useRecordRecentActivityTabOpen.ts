/**
 * Traffic Overview `useRecordRecentActivityTabOpen` hook.
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
import { useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Registry, useRegistry } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { RECENT_ACTIVITY_TAB_OPENED_TIMER } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { startTimerOnce } from '@/js/modules/analytics-4/components/traffic-overview/utils/startTimerOnce';
import { useRecordRecentActivityInteraction } from './useRecordRecentActivityInteraction';

/**
 * Gets a callback that records that the user opened the Recent activity tab.
 *
 * At the first open in a page load, the callback starts the "tab opened"
 * timer when the user doesn't have it yet. When the user already has it, they
 * opened the tab in an earlier page load, which is a meaningful interaction,
 * so the callback records one instead. Later opens in the same page load
 * record nothing.
 *
 * @since 1.192.0
 *
 * @return {Function} A callback that returns a promise, which resolves once the open is saved.
 */
export function useRecordRecentActivityTabOpen(): () => Promise< void > {
	const registry = useRegistry() as unknown as Registry;
	const recordInteraction = useRecordRecentActivityInteraction();
	const hasRecordedOpen = useRef( false );

	return useCallback( async () => {
		if ( hasRecordedOpen.current ) {
			return;
		}

		hasRecordedOpen.current = true;

		await registry.resolveSelect( CORE_USER ).getExpirableItems();

		// The timer starts at the first open and stays in the expirable items
		// after it expires, so having it means the user opened the tab in an
		// earlier page load. Opening the tab again in a later page load is a
		// meaningful interaction.
		if (
			registry
				.select( CORE_USER )
				.hasExpirableItem( RECENT_ACTIVITY_TAB_OPENED_TIMER.slug )
		) {
			await recordInteraction();
			return;
		}

		// When the expirable items fail to load, this starts no timer.
		await startTimerOnce( registry, RECENT_ACTIVITY_TAB_OPENED_TIMER );
	}, [ recordInteraction, registry ] );
}
