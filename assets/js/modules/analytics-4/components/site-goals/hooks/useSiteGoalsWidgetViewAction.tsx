/**
 * Site Goals widget view-action hook.
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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

export type SiteGoalsWidgetViewAction =
	| 'view_widget'
	| 'view_widget_gathering_data'
	| 'view_widget_partial_data'
	| 'view_widget_breakdown';

interface UseSiteGoalsWidgetViewActionOptions {
	breakdownDimension: string;
	hasBreakdownTabs: boolean;
}

/**
 * Resolves the Site Goals widget's current breakdown display state to a
 * single GA4 view action.
 *
 * The widget's header/tabs area is always in exactly one of four mutually
 * exclusive states, matching what is actually rendered: the "aggregated"
 * default (no breakdown dimension, or no discovered breakdown values yet),
 * the "Gathering breakdown data" badge, the tabbed breakdown with a "Partial
 * data" badge, or the tabbed breakdown with the full selected date range
 * covered.
 *
 * @since 1.183.0
 *
 * @param {Object}  options                    Hook options.
 * @param {string}  options.breakdownDimension The breakdown custom dimension slug for this goal type.
 * @param {boolean} options.hasBreakdownTabs   Whether the widget is currently showing breakdown tabs.
 * @return {(SiteGoalsWidgetViewAction|undefined)} The resolved view action, or `undefined` while resolving.
 */
export function useSiteGoalsWidgetViewAction( {
	breakdownDimension,
	hasBreakdownTabs,
}: UseSiteGoalsWidgetViewActionOptions ):
	| SiteGoalsWidgetViewAction
	| undefined {
	const hasBreakdownDimension = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				breakdownDimension
			),
		[ breakdownDimension ]
	);

	const isGatheringData = useSelect(
		( select: Select ) =>
			hasBreakdownDimension
				? select(
						MODULES_ANALYTICS_4
				  ).areCustomDimensionsGatheringData( [ breakdownDimension ] )
				: undefined,
		[ hasBreakdownDimension, breakdownDimension ]
	);

	const isPartialData = useSelect(
		( select: Select ) =>
			hasBreakdownTabs
				? select( MODULES_ANALYTICS_4 ).isCustomDimensionPartialData(
						breakdownDimension
				  )
				: undefined,
		[ hasBreakdownTabs, breakdownDimension ]
	);

	if ( hasBreakdownDimension === undefined ) {
		return undefined;
	}

	// No breakdown dimension (feature not enabled yet) — the original
	// aggregated default.
	if ( ! hasBreakdownDimension ) {
		return 'view_widget';
	}

	if ( isGatheringData === undefined ) {
		return undefined;
	}

	if ( isGatheringData ) {
		return 'view_widget_gathering_data';
	}

	// Dimension exists and isn't gathering, but no breakdown values have been
	// discovered yet, so no tabs render — falls back to the aggregated state.
	if ( ! hasBreakdownTabs ) {
		return 'view_widget';
	}

	if ( isPartialData === undefined ) {
		return undefined;
	}

	return isPartialData ? 'view_widget_partial_data' : 'view_widget_breakdown';
}
