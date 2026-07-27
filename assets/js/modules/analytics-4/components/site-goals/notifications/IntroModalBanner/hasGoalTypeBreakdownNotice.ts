/**
 * Site Goals breakdown notice presence helper.
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
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE,
	SITE_GOALS_BREAKDOWN_NOTICE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

/**
 * Checks whether a goal type's widget shows the breakdown notice.
 *
 * The intro modal calls this helper once per goal type, so the tour knows
 * which widget its breakdown step lands on. It leaves out the intro modal's
 * own dismissal. Confirming the modal saves that dismissal before the tour
 * starts.
 *
 * @since 1.184.0
 *
 * @param select   The registry `select` function.
 * @param goalType The goal type whose widget to check.
 * @return `true` when the goal type's widget shows the notice, `false` otherwise.
 */
export function hasGoalTypeBreakdownNotice(
	select: Select,
	goalType: GoalType
): boolean {
	// Each selector returns `undefined` until it resolves, so compare against
	// the resolved value. An unresolved read counts as no notice, which keeps
	// the tour from pointing at a missing step target.
	return (
		select( MODULES_ANALYTICS_4 ).isSiteGoalWidgetActive( goalType ) ===
			true &&
		select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
			SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[ goalType ]
		) === false &&
		select( CORE_USER ).isItemDismissed( SITE_GOALS_BREAKDOWN_NOTICE ) ===
			false
	);
}
