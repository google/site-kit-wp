/**
 * Site Goals widget content check.
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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { isZeroReport } from '@/js/modules/analytics-4/utils/is-zero-report';
import { getSiteGoalsEventCountReportOptions } from './getSiteGoalsEventCountReportOptions';

/**
 * Checks whether a goal type's Site Goals widget shows its own content, rather
 * than the removal notice.
 *
 * The removal notice shows while no plugin for the goal type is active and the
 * selected date range has no event of that type.
 *
 * @since n.e.x.t
 *
 * @param {Select}   select   The registry `select` function.
 * @param {GoalType} goalType The goal type of the widget to check.
 * @return {(boolean|undefined)} `true` when the widget shows its own content, and `false` when the widget doesn't render or shows the removal notice. `undefined` while the detected events, the Site Goals settings, or the event report load.
 */
export function isSiteGoalsWidgetShowingContent(
	select: Select,
	goalType: GoalType
): boolean | undefined {
	const isRenderable =
		select( MODULES_ANALYTICS_4 ).isSiteGoalsWidgetRenderable( goalType );

	if ( isRenderable !== true ) {
		return isRenderable;
	}

	const hasActiveEventProviders =
		goalType === GOAL_TYPES.ECOMMERCE
			? select( CORE_SITE ).hasActiveEcommerceEventProviders()
			: select( CORE_SITE ).hasActiveLeadEventProviders();

	if ( hasActiveEventProviders !== false ) {
		return true;
	}

	const reportOptions = getSiteGoalsEventCountReportOptions(
		select( CORE_USER ).getDateRangeDates( { compare: false } ),
		goalType
	);

	select( MODULES_ANALYTICS_4 ).getReport( reportOptions );

	if ( select( MODULES_ANALYTICS_4 ).areReportsLoading( reportOptions ) ) {
		return undefined;
	}

	if ( select( MODULES_ANALYTICS_4 ).getFirstReportError( reportOptions ) ) {
		return true;
	}

	return ! isZeroReport(
		select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
	);
}
