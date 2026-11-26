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
	RECENT_ACTIVITY_ZERO_INTERACTION_VISIT_COUNT,
	TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

/**
 * Selects the zero interaction trigger, for a user who never opened the
 * Recent activity tab.
 *
 * @since 1.192.0
 * @since 1.193.0 No longer reads the age of the latest post or the time since the Recent activity tab became available.
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

	const { getDismissedPrompts, getPromptDismissCount } = select( CORE_USER );

	// `getPromptDismissCount()` has no resolver of its own.
	if ( getDismissedPrompts() === undefined ) {
		return null;
	}

	return getPromptDismissCount( TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG ) >=
		RECENT_ACTIVITY_ZERO_INTERACTION_VISIT_COUNT
		? RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION
		: undefined;
}
