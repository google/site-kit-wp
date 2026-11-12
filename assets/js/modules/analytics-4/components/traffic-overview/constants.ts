/**
 * Traffic Overview constants.
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
import { DAY_IN_SECONDS, WEEK_IN_SECONDS } from '@/js/util/dates';

/**
 * The DOM `id` of the Traffic Overview tab. The panel points its
 * `aria-labelledby` at this `id`, so the tab names the panel.
 */
export const TRAFFIC_OVERVIEW_TAB_ID = 'googlesitekit-traffic-overview-tab';

/**
 * The DOM `id` of the Typical Traffic tab. The panel points its
 * `aria-labelledby` at this `id`, so the tab names the panel.
 */
export const TYPICAL_TRAFFIC_TAB_ID = 'googlesitekit-typical-traffic-tab';

/**
 * The DOM `id` of the Recent activity tab. The Recent activity panel points
 * its `aria-labelledby` at the tab's `id`, so the tab names the panel.
 */
export const RECENT_ACTIVITY_TAB_ID = 'googlesitekit-recent-activity-tab';

/** The dismissed item slug of the Analytics setup CTA in the Recent activity tab. */
export const RECENT_ACTIVITY_ANALYTICS_SETUP_CTA_SLUG =
	'analytics-setup-cta-recent-activity';

/**
 * The namespace used when sending Recent activity tab feedback to the
 * `core/user` `sendFeedback()` feedback endpoint.
 */
export const FRESH_DATA_FEEDBACK_NAMESPACE = 'fresh_data';

/** The feedback group of the feedback thumbs in the Recent activity tab. */
export const FRESH_DATA_FEEDBACK_GROUP_RECENT_ACTIVITY =
	'recent_activity_widget';

/**
 * How long the Recent activity tab stays shown, in milliseconds, before the
 * `view_all_recent_posts` event fires.
 *
 * @since 1.192.0
 */
export const RECENT_ACTIVITY_MINIMUM_VIEW_TIME_MILLISECONDS = 3000;

/** The slug the Traffic Overview widget registers under. */
export const TRAFFIC_OVERVIEW_WIDGET_SLUG = 'analyticsTrafficOverview';

/** The most rows a breakdown column shows, counting the trailing "Others" row. */
export const TRAFFIC_BREAKDOWN_MAX_ROWS = 5;

/** The most rows a column of the Recent activity tab's traffic breakdown shows. */
export const RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS = 3;

/** The `getRecentContent` options that select the most recently published post. */
export const LATEST_POST_RECENT_CONTENT_OPTIONS = { count: 1 };

/** A `CORE_USER` expirable item timer, as `setExpirableItemTimers()` takes it. */
export interface ExpirableItemTimer {
	/** The expirable item slug. */
	slug: string;
	/** How long the timer runs, in seconds. */
	expiresInSeconds: number;
}

/**
 * The survey trigger ID for users who have never opened the Recent activity
 * tab.
 *
 * @since 1.192.0
 */
export const RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION =
	'view_fresh_data_recent_activity_zero_interaction';

/**
 * The survey trigger ID for users who opened the Recent activity tab, but did
 * not interact with it.
 *
 * @since 1.192.0
 */
export const RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_BUT_NOT_INTERACTED =
	'view_fresh_data_recent_activity_opened_but_not_interacted';

/**
 * The survey trigger ID for users who opened the Recent activity tab and
 * interacted with it.
 *
 * @since 1.192.0
 */
export const RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_AND_INTERACTED =
	'view_fresh_data_recent_activity_opened_and_interacted';

/**
 * The timer that starts when the Recent activity tab first shows on the
 * user's dashboard.
 *
 * @since 1.192.0
 */
export const RECENT_ACTIVITY_TAB_AVAILABLE_TIMER: ExpirableItemTimer = {
	slug: 'fresh-data-recent-activity-tab-available',
	expiresInSeconds: 2 * WEEK_IN_SECONDS,
};

/**
 * The timer that starts when the user first opens the Recent activity tab.
 *
 * @since 1.192.0
 */
export const RECENT_ACTIVITY_TAB_OPENED_TIMER: ExpirableItemTimer = {
	slug: 'fresh-data-recent-activity-tab-opened',
	expiresInSeconds: WEEK_IN_SECONDS,
};

/**
 * The timer that starts at the user's first meaningful interaction with the
 * Recent activity tab.
 *
 * @since 1.192.0
 */
export const RECENT_ACTIVITY_INTERACTION_TIMER: ExpirableItemTimer = {
	slug: 'fresh-data-recent-activity-interaction',
	expiresInSeconds: WEEK_IN_SECONDS,
};

/**
 * The prompt slug whose dismiss count counts the page loads in which the
 * Traffic card was in view.
 *
 * @since 1.192.0
 */
export const TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG =
	'fresh-data-traffic-card-visit';

/**
 * The number of Traffic card visits after which a user who never opened the
 * Recent activity tab can get the zero interaction survey.
 *
 * @since 1.192.0
 */
export const RECENT_ACTIVITY_ZERO_INTERACTION_VISIT_COUNT = 3;

/**
 * How long, in seconds, the "tab available" timer can have left for the zero
 * interaction survey to show, so it shows 10 to 14 days after the tab became
 * available.
 *
 * @since 1.192.0
 */
export const RECENT_ACTIVITY_ZERO_INTERACTION_MAX_SECONDS_LEFT =
	4 * DAY_IN_SECONDS;

/**
 * The most days since the latest post was published for the zero interaction
 * survey to show.
 *
 * @since 1.192.0
 */
export const RECENT_ACTIVITY_ZERO_INTERACTION_MAX_POST_AGE_DAYS = 7;
