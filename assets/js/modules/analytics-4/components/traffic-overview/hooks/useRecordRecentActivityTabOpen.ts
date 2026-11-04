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
import { Registry, useDispatch, useRegistry } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	RECENT_ACTIVITY_INTERACTION_TAB_OPEN_COUNT,
	RECENT_ACTIVITY_TAB_OPENED_TIMER,
	RECENT_ACTIVITY_TAB_OPEN_COUNT_PROMPT_SLUG,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { useRecordRecentActivityInteraction } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useRecordRecentActivityInteraction';
import { startTimerOnce } from '@/js/modules/analytics-4/components/traffic-overview/utils/startTimerOnce';

/**
 * Gets a callback that records that the user opened the Recent activity tab.
 *
 * The callback starts the "tab opened" timer, at the first open only, and
 * counts the page loads in which the user opened the tab. An open in a second
 * page load is a meaningful interaction, so the callback then records one.
 *
 * @since n.e.x.t
 *
 * @return {Function} A callback that returns a promise, which resolves once the open is counted.
 */
export function useRecordRecentActivityTabOpen(): () => Promise< void > {
	const registry = useRegistry() as unknown as Registry;
	const { dismissPrompt } = useDispatch( CORE_USER );
	const recordInteraction = useRecordRecentActivityInteraction();
	const hasCountedOpen = useRef( false );

	return useCallback( async () => {
		startTimerOnce( registry, RECENT_ACTIVITY_TAB_OPENED_TIMER );

		// The count is of page loads in which the user opened the tab, so it
		// counts only the first open in each page load.
		if ( hasCountedOpen.current ) {
			return;
		}

		hasCountedOpen.current = true;

		// `getPromptDismissCount()` has no resolver of its own. Loading the
		// dismissed prompts before the dismissal also stops a request for
		// them that is still running from replacing the count it returns.
		await registry.resolveSelect( CORE_USER ).getDismissedPrompts();

		// Each dismissal adds one to the prompt's dismiss count, which counts
		// the opens. An expiry of `0` keeps the count from expiring.
		await dismissPrompt( RECENT_ACTIVITY_TAB_OPEN_COUNT_PROMPT_SLUG, {
			expiresInSeconds: 0,
		} );

		// Returning to the tab across page loads is a meaningful interaction.
		const openCount = registry
			.select( CORE_USER )
			.getPromptDismissCount(
				RECENT_ACTIVITY_TAB_OPEN_COUNT_PROMPT_SLUG
			);

		if ( openCount >= RECENT_ACTIVITY_INTERACTION_TAB_OPEN_COUNT ) {
			await recordInteraction();
		}
	}, [ dismissPrompt, recordInteraction, registry ] );
}
