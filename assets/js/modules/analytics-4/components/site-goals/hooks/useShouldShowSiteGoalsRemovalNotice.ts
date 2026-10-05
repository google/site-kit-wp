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
import { useInView } from '@/js/hooks/useInView';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { isSiteGoalsWidgetShowingContent } from '@/js/modules/analytics-4/components/site-goals/utils/isSiteGoalsWidgetShowingContent';

/**
 * Checks whether the removal notice replaces a Site Goals widget.
 *
 * The notice replaces the widget when no plugin for the goal type is active
 * and the selected date range has no events of that goal type.
 *
 * @since n.e.x.t
 *
 * @param {GoalType} goalType Goal type of the widget to check.
 * @return {(boolean|undefined)} `true` when the notice replaces the widget, and `false` when the widget shows its content. `undefined` while the Analytics settings, the Site Goals settings, or the event report load. With no plugin for the goal type active, also `undefined` until the widget is in view.
 */
export function useShouldShowSiteGoalsRemovalNotice(
	goalType: GoalType
): boolean | undefined {
	const isInView = useInView( { sticky: true } );

	const isShowingContent = useSelect(
		( select: Select ) =>
			isSiteGoalsWidgetShowingContent( select, goalType, {
				shouldFetchReport: isInView,
			} ),
		[ goalType, isInView ]
	) as boolean | undefined;

	if ( isShowingContent === undefined ) {
		return undefined;
	}

	return ! isShowingContent;
}
