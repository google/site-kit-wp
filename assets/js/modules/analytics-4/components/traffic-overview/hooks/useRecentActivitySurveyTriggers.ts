/**
 * Traffic Overview `useRecentActivitySurveyTriggers` hook.
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
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Registry,
	Select,
	useDispatch,
	useRegistry,
	useSelect,
} from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	RECENT_ACTIVITY_INTERACTION_TIMER,
	RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_AND_INTERACTED,
	RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_BUT_NOT_INTERACTED,
	RECENT_ACTIVITY_TAB_AVAILABLE_TIMER,
	RECENT_ACTIVITY_TAB_OPENED_TIMER,
	RECENT_ACTIVITY_ZERO_INTERACTION_VISIT_COUNT,
	TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { selectZeroInteractionTrigger } from '@/js/modules/analytics-4/components/traffic-overview/utils/selectZeroInteractionTrigger';
import { startTimerOnce } from '@/js/modules/analytics-4/components/traffic-overview/utils/startTimerOnce';
import { DAY_IN_SECONDS } from '@/js/util/dates';

interface RecentActivitySurveyTriggersOptions {
	/** Whether the widget shows the Recent activity tab, with Analytics connected. */
	isEnabled: boolean;
	/** Whether the Traffic card has been in view since the page loaded. */
	hasBeenInView?: boolean;
}

/**
 * Triggers the Recent activity survey matching the user's use of the tab.
 *
 * While enabled, the hook starts the "tab available" timer, counts one
 * Traffic card visit per page load once the card has been in view, until the
 * user opens the tab or the count reaches 3, and sends
 * at most one of the three Recent activity survey triggers, at most once a
 * day:
 *
 * 1. Opened and interacted: the "meaningful interaction" timer has expired.
 * 2. Opened but not interacted: the "tab opened" timer has expired, and the
 *    user has never interacted with the tab.
 * 3. Zero interaction: the user never opened the tab, and either the latest
 *    post was published 7 days or less ago, or the user has visited the card
 *    3 or more times and the tab became available 10 to 14 days ago.
 *
 * @since 1.192.0
 *
 * @param {Object}  options                 Hook options.
 * @param {boolean} options.isEnabled       Whether the widget shows the Recent activity tab, with Analytics connected.
 * @param {boolean} [options.hasBeenInView] Optional. Whether the Traffic card has been in view since the page loaded. Default `false`.
 * @return {void}
 */
export function useRecentActivitySurveyTriggers( {
	isEnabled,
	hasBeenInView = false,
}: RecentActivitySurveyTriggersOptions ): void {
	const registry = useRegistry() as unknown as Registry;
	const { dismissPrompt, triggerSurvey } = useDispatch( CORE_USER );
	const hasCountedVisit = useRef( false );

	useEffect( () => {
		if ( isEnabled ) {
			startTimerOnce( registry, RECENT_ACTIVITY_TAB_AVAILABLE_TIMER );
		}
	}, [ isEnabled, registry ] );

	useEffect( () => {
		if ( ! isEnabled || ! hasBeenInView || hasCountedVisit.current ) {
			return;
		}

		hasCountedVisit.current = true;

		async function countVisit() {
			// `getPromptDismissCount()` has no resolver of its own. Loading the
			// dismissed prompts before the dismissal also stops a request for
			// them that is still running from replacing the count it returns.
			await Promise.all( [
				registry.resolveSelect( CORE_USER ).getExpirableItems(),
				registry.resolveSelect( CORE_USER ).getDismissedPrompts(),
			] );

			const {
				getDismissedPrompts,
				getPromptDismissCount,
				hasExpirableItem,
			} = registry.select( CORE_USER );

			// Only the zero interaction survey reads the count, for users who
			// never opened the tab, and only to check that it reached the
			// visit count. So the count stops once the user opens the tab or
			// the count reaches it, and when either is unknown because its
			// request failed.
			if (
				hasExpirableItem( RECENT_ACTIVITY_TAB_OPENED_TIMER.slug ) !==
					false ||
				getDismissedPrompts() === undefined ||
				getPromptDismissCount( TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG ) >=
					RECENT_ACTIVITY_ZERO_INTERACTION_VISIT_COUNT
			) {
				return;
			}

			// Each dismissal adds one to the prompt's dismiss count, which
			// counts the visits. An expiry of `0` keeps the count from
			// expiring.
			await dismissPrompt( TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG, {
				expiresInSeconds: 0,
			} );
		}

		countVisit();
	}, [ dismissPrompt, hasBeenInView, isEnabled, registry ] );

	const triggerID = useSelect(
		( select: Select ): string | null | undefined => {
			if ( ! isEnabled || ! hasBeenInView ) {
				return undefined;
			}

			const { hasExpirableItem, isExpirableItemActive } =
				select( CORE_USER );

			const hasInteractionTimer = hasExpirableItem(
				RECENT_ACTIVITY_INTERACTION_TIMER.slug
			);

			if ( hasInteractionTimer === undefined ) {
				return null;
			}

			if ( hasInteractionTimer ) {
				return isExpirableItemActive(
					RECENT_ACTIVITY_INTERACTION_TIMER.slug
				)
					? undefined
					: RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_AND_INTERACTED;
			}

			if ( hasExpirableItem( RECENT_ACTIVITY_TAB_OPENED_TIMER.slug ) ) {
				return isExpirableItemActive(
					RECENT_ACTIVITY_TAB_OPENED_TIMER.slug
				)
					? undefined
					: RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_BUT_NOT_INTERACTED;
			}

			return selectZeroInteractionTrigger( select );
		},
		[ hasBeenInView, isEnabled ]
	);

	useEffect( () => {
		if ( triggerID ) {
			triggerSurvey( triggerID, { ttl: DAY_IN_SECONDS } );
		}
	}, [ triggerID, triggerSurvey ] );
}
