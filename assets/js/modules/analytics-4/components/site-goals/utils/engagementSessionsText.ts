/**
 * Site Goals engagement sessions caption.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { NUMBER_FORMAT } from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { numFmt } from '@/js/util';

/**
 * Builds the caption under a Site Goals engagement rate, naming the sessions
 * the rate is a share of.
 *
 * Without a breakdown, the engagement rate covers the whole site, so the
 * caption shows the site's total sessions. On a plugin or form breakdown, it
 * covers only the sessions with an event from that plugin or form, so the
 * caption says so. This keeps it apart from the Key action rate's caption,
 * which shows the site's total sessions on every breakdown.
 *
 * @since n.e.x.t
 *
 * @param {number}           sessions      The sessions the engagement rate is a share of.
 * @param {string|undefined} breakdownType The goal type of the plugin or form breakdown, or `undefined` without a breakdown.
 * @return {string} The caption, such as "of 1,250 total sessions" or "of 29 sessions with this plugin".
 */
export function getEngagementSessionsSubtitle(
	sessions: number,
	breakdownType?: GoalType
): string {
	const formattedSessions = numFmt( sessions, NUMBER_FORMAT );

	if ( breakdownType === GOAL_TYPES.ECOMMERCE ) {
		return sprintf(
			/* translators: %s: formatted number of sessions with an event from the selected ecommerce plugin */
			__( 'of %s sessions with this plugin', 'google-site-kit' ),
			formattedSessions
		);
	}

	if ( breakdownType === GOAL_TYPES.LEAD ) {
		return sprintf(
			/* translators: %s: formatted number of sessions with an event from the selected form */
			__( 'of %s sessions with this form', 'google-site-kit' ),
			formattedSessions
		);
	}

	return sprintf(
		/* translators: %s: formatted number of total sessions */
		__( 'of %s total sessions', 'google-site-kit' ),
		formattedSessions
	);
}
