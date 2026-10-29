/**
 * Site Goals conversion tracking disabled notice condition hook.
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
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE,
	SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDERS,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { isSiteGoalsWidgetShowingContent } from '@/js/modules/analytics-4/components/site-goals/utils/isSiteGoalsWidgetShowingContent';
import {
	CONVERSION_REPORTING_ECOMMERCE_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { useConversionTrackingSetting } from '@/js/modules/analytics-4/hooks/useConversionTrackingSetting';

/**
 * Checks whether a Site Goals widget shows breakdown tabs.
 *
 * Mirrors the arguments each widget passes to `useSiteGoalsBreakdown()`, so
 * the check reads the same discovery report the widget does.
 *
 * @since n.e.x.t
 *
 * @param {Function} select   The registry `select` function.
 * @param {string}   goalType The widget's goal type, one of `GOAL_TYPES`.
 * @return {(boolean|undefined)} Whether the widget shows breakdown tabs, or `undefined` while loading.
 */
function hasBreakdownTabs(
	select: Select,
	goalType: GoalType
): boolean | undefined {
	// A widget that shows the removal notice shows no tabs, even when the
	// 90-day discovery window still holds breakdown values.
	const isShowingContent = isSiteGoalsWidgetShowingContent(
		select,
		goalType
	);

	if ( isShowingContent !== true ) {
		return isShowingContent;
	}

	const breakdownDimension =
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[ goalType ];

	const hasBreakdownDimension =
		select( MODULES_ANALYTICS_4 ).hasCustomDimensions( breakdownDimension );

	// Analytics answers 400 for a dimension the property does not have, so the
	// report is only requested once the dimension exists.
	if ( hasBreakdownDimension !== true ) {
		return hasBreakdownDimension;
	}

	const isEcommerce = goalType === GOAL_TYPES.ECOMMERCE;

	const values = select( MODULES_ANALYTICS_4 ).getBreakdownValues(
		breakdownDimension,
		isEcommerce ? CONVERSION_REPORTING_ECOMMERCE_EVENTS : []
	) as string[] | undefined;

	if ( values === undefined ) {
		return undefined;
	}

	if ( isEcommerce ) {
		return values.some( ( value ) =>
			SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDERS.includes( value )
		);
	}

	return values.length > 0;
}

/**
 * Checks whether the conversion tracking disabled notice shows above the Site Goals widgets.
 *
 * The notice shows while plugin conversion tracking is off and at least one
 * Site Goals widget shows breakdown tabs, which means the breakdown was in use
 * before conversion tracking was switched off.
 *
 * @since n.e.x.t
 *
 * @return {(boolean|undefined)} `true` when the notice shows, `false` when it does not, and `undefined` while the conditions load.
 */
export function useShouldShowConversionTrackingDisabledNotice():
	| boolean
	| undefined {
	const { isConversionTrackingEnabled } = useConversionTrackingSetting();

	return useSelect(
		( select: Select ) => {
			if ( isConversionTrackingEnabled !== false ) {
				return isConversionTrackingEnabled === undefined
					? undefined
					: false;
			}

			let isLoading = false;

			for ( const goalType of Object.values( GOAL_TYPES ) ) {
				const hasTabs = hasBreakdownTabs( select, goalType );

				if ( hasTabs === true ) {
					return true;
				}

				if ( hasTabs === undefined ) {
					isLoading = true;
				}
			}

			return isLoading ? undefined : false;
		},
		[ isConversionTrackingEnabled ]
	) as boolean | undefined;
}
