/**
 * Traffic Overview `selectZeroInteractionTrigger` utility.
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
import { Select } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	LATEST_POST_RECENT_CONTENT_OPTIONS,
	RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION,
	RECENT_ACTIVITY_TAB_AVAILABLE_TIMER,
	RECENT_ACTIVITY_ZERO_INTERACTION_MAX_POST_AGE_DAYS,
	RECENT_ACTIVITY_ZERO_INTERACTION_MAX_SECONDS_LEFT,
	RECENT_ACTIVITY_ZERO_INTERACTION_VISIT_COUNT,
	TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { getDayCount } from '@/js/util/dates';

/**
 * Selects the zero interaction trigger, for a user who never opened the
 * Recent activity tab.
 *
 * @since 1.192.0
 *
 * @param {Function} select The data store select function.
 * @return {(string|null|undefined)} The trigger ID, `undefined` when the user doesn't meet its criteria, or `null` while the data loads.
 */
export function selectZeroInteractionTrigger(
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
	// its date, which `getDayCount()` uses.
	//
	// getDayCount() counts days inclusively, so to accurately reflect a post
	// published the same day as the reference date as being "0 days old", we
	// subject one from the post age.
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

	const expirableItems: Record< string, number > | undefined =
		getExpirableItems();

	if ( expirableItems === undefined ) {
		return null;
	}

	const tabAvailableExpiry: number | undefined =
		expirableItems[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ];

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
