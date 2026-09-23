/**
 * Site Goals removal notice condition hook.
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
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { useSiteGoalsHasEventsInDateRange } from './useSiteGoalsHasEventsInDateRange';

/**
 * Checks whether the removal notice replaces a Site Goals widget.
 *
 * The notice replaces the widget when no plugin for the goal type is active
 * and the selected date range has no events of that goal type.
 *
 * @since n.e.x.t
 *
 * @param {GoalType} goalType Goal type of the widget to check.
 * @return {(boolean|undefined)} `true` when the notice replaces the widget. `undefined` while no plugin is active and the event report loads. `false` otherwise.
 */
export function useShouldShowSiteGoalsRemovalNotice(
	goalType: GoalType
): boolean | undefined {
	const hasActiveEventProviders = useSelect(
		( select: Select ) => {
			if ( goalType === GOAL_TYPES.ECOMMERCE ) {
				return select( CORE_SITE ).hasActiveEcommerceEventProviders();
			}

			return select( CORE_SITE ).hasActiveLeadEventProviders();
		},
		[ goalType ]
	) as boolean | undefined;

	const hasEventsInDateRange = useSiteGoalsHasEventsInDateRange( goalType );

	// A failed report or an unknown plugin state shows the widget, so the
	// loading block can't stay forever.
	if (
		hasActiveEventProviders !== false ||
		hasEventsInDateRange === true ||
		hasEventsInDateRange === null
	) {
		return false;
	}

	if ( hasEventsInDateRange === false ) {
		return true;
	}

	return undefined;
}
