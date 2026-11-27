/**
 * Site Goals insight hook.
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
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE,
	SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ConversionInsight } from '@/js/modules/analytics-4/datastore/types';
import { getPreviousDate } from '@/js/util';

/**
 * Gets the generated insight of a Site Goals widget, or of its open tab.
 *
 * The insight is only requested for the "Last 28 days" preset, and covers
 * the 28 full days that end the day before the reference date, because the
 * service describes complete days. A widget with tabs gets no insight while
 * its breakdown is in the partial data state or the "Other sources" tab is
 * open. A widget without tabs isn't checked for the partial data state,
 * because `isCustomDimensionPartialData()` is also true while the breakdown
 * data is being gathered, and stays `undefined` for good on a property that
 * doesn't have the breakdown dimension.
 *
 * @since n.e.x.t
 *
 * @param {string}             goalType The goal type of the widget: `lead` or `ecommerce`.
 * @param {(string|undefined)} tabID    The open tab, an empty string for a widget without tabs, or `undefined` while it is not known yet whether the widget has tabs.
 * @return {(Object|null|false|undefined)} The insight; null when there is none to show; false when the widget can't show one, so none is requested; or `undefined` while it loads.
 */
export function useSiteGoalsInsight(
	goalType: GoalType,
	tabID: string | undefined
): ConversionInsight | null | false | undefined {
	const breakdownDimension =
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[ goalType ];

	const isLast28DaysPreset = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRange() === 'last-28-days',
		[]
	);

	const endDate = useSelect(
		( select: Select ) =>
			getPreviousDate( select( CORE_USER ).getReferenceDate(), 1 ),
		[]
	);

	const isOtherSourcesTab =
		tabID === SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID;
	const hasTabs = !! tabID;

	const isPartialData = useInViewSelect(
		( select: Select ) =>
			hasTabs && ! isOtherSourcesTab && isLast28DaysPreset
				? select( MODULES_ANALYTICS_4 ).isCustomDimensionPartialData(
						breakdownDimension
				  )
				: false,
		[ hasTabs, isOtherSourcesTab, isLast28DaysPreset, breakdownDimension ]
	);

	const isEligible =
		isLast28DaysPreset && ! isOtherSourcesTab && isPartialData === false;

	const insight = useInViewSelect(
		( select: Select ) =>
			isEligible && tabID !== undefined
				? select( MODULES_ANALYTICS_4 ).getConversionInsight(
						goalType,
						tabID,
						endDate
				  )
				: undefined,
		[ isEligible, goalType, tabID, endDate ]
	);

	if ( ! isLast28DaysPreset || isOtherSourcesTab || isPartialData ) {
		return false;
	}

	return insight;
}
