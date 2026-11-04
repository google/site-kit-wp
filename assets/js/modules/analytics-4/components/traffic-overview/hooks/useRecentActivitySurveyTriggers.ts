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
	LATEST_POST_RECENT_CONTENT_OPTIONS,
	RECENT_ACTIVITY_INTERACTION_TIMER,
	RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_AND_INTERACTED,
	RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_BUT_NOT_INTERACTED,
	RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION,
	RECENT_ACTIVITY_TAB_AVAILABLE_TIMER,
	RECENT_ACTIVITY_TAB_OPENED_TIMER,
	RECENT_ACTIVITY_ZERO_INTERACTION_MAX_POST_AGE_DAYS,
	RECENT_ACTIVITY_ZERO_INTERACTION_MAX_SECONDS_LEFT,
	RECENT_ACTIVITY_ZERO_INTERACTION_VISIT_COUNT,
	TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { startTimerOnce } from '@/js/modules/analytics-4/components/traffic-overview/utils/startTimerOnce';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { DAY_IN_SECONDS, getDayCount } from '@/js/util/dates';

interface RecentActivitySurveyTriggersOptions {
	/** Whether the widget shows the Recent activity tab, with Analytics connected. */
	isEnabled: boolean;
	/** Whether the Traffic card has been in view since the page loaded. */
	hasBeenInView?: boolean;
}

/**
 * Selects the zero interaction trigger, for a user who never opened the
 * Recent activity tab.
 *
 * @since n.e.x.t
 *
 * @param {Function} select The data store select function.
 * @return {(string|null|undefined)} The trigger ID, `undefined` when the user doesn't meet its criteria, or `null` while the data loads.
 */
function selectZeroInteractionTrigger(
	select: Select
): string | null | undefined {
	const latestPost = select( MODULES_ANALYTICS_4 ).getRecentContent(
		LATEST_POST_RECENT_CONTENT_OPTIONS
	);

	if ( latestPost === undefined ) {
		return null;
	}

	// The survey is for users with at least one published post.
	if ( ! latestPost.length ) {
		return undefined;
	}

	// `publishedAt` is in ISO 8601 format, so its first ten characters are
	// its date, which `getDayCount()` takes.
	const postAgeInDays =
		getDayCount(
			latestPost[ 0 ].publishedAt.slice( 0, 10 ),
			select( CORE_USER ).getReferenceDate()
		) - 1;

	if ( postAgeInDays <= RECENT_ACTIVITY_ZERO_INTERACTION_MAX_POST_AGE_DAYS ) {
		return RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION;
	}

	const { getDismissedPrompts, getExpirableItems, getPromptDismissCount } =
		select( CORE_USER );

	// `getPromptDismissCount()` has no resolver of its own.
	if ( getDismissedPrompts() === undefined ) {
		return null;
	}

	if (
		getPromptDismissCount( TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG ) <
		RECENT_ACTIVITY_ZERO_INTERACTION_VISIT_COUNT
	) {
		return undefined;
	}

	const tabAvailableExpiry: number | undefined =
		getExpirableItems()?.[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ];

	if ( tabAvailableExpiry === undefined ) {
		return undefined;
	}

	// As in `isExpirableItemActive()`, the reference date has no time of
	// day, so the time left on the timer is counted from the current time.
	// eslint-disable-next-line sitekit/no-direct-date
	const secondsLeft = tabAvailableExpiry - Math.floor( Date.now() / 1000 );

	// The survey shows from 10 to 14 days after the tab became available, so
	// in the last 4 days of the 14 day timer.
	return secondsLeft > 0 &&
		secondsLeft <= RECENT_ACTIVITY_ZERO_INTERACTION_MAX_SECONDS_LEFT
		? RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION
		: undefined;
}

/**
 * Triggers the Recent activity survey matching the user's use of the tab.
 *
 * While enabled, the hook starts the "tab available" timer, counts one
 * Traffic card visit per page load once the card has been in view, and sends
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
 * @since n.e.x.t
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

		// Each dismissal adds one to the prompt's dismiss count, which counts
		// the visits. An expiry of `0` keeps the count from expiring.
		dismissPrompt( TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG, {
			expiresInSeconds: 0,
		} );
	}, [ dismissPrompt, hasBeenInView, isEnabled ] );

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
