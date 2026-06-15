/**
 * Site Goals breakdown hook.
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
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect } from 'googlesitekit-data';
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE,
	SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

export interface SiteGoalsBreakdown {
	breakdownDimension: string;
	breakdownValues: string[] | undefined;
	hasBreakdownTabs: boolean;
	activeTabID: string;
	setSelectedTab: ( tabID: string ) => void;
	isOtherSourcesTab: boolean;
	hasOtherSources: boolean;
	otherSourcesCount: number;
	otherSourcesPreviousCount: number;
	breakdownFilter: Record< string, unknown > | undefined;
}

export interface UseSiteGoalsBreakdownOptions {
	eventNames?: string[];
	detectionEventNames?: string[];
	supportedValues?: string[];
}

/**
 * Resolves the breakdown tab state for a Site Goals widget.
 *
 * @since n.e.x.t
 *
 * @param {string} goalType                      The goal type whose breakdown dimension to resolve.
 * @param {Object} [options]                     Discovery, detection and allowlist options.
 * @param {Array}  [options.eventNames]          Events to scope the discovered values to.
 * @param {Array}  [options.detectionEventNames] Events used to detect "Other sources" data; defaults to `eventNames`.
 * @param {Array}  [options.supportedValues]     Allowlist of values that get a tab; any other value is excluded.
 * @return {Object} The breakdown state.
 */
export function useSiteGoalsBreakdown(
	goalType: GoalType,
	{
		eventNames = [],
		detectionEventNames = eventNames,
		supportedValues,
	}: UseSiteGoalsBreakdownOptions = {}
): SiteGoalsBreakdown {
	const breakdownDimension =
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[ goalType ];

	// The tab structure (the values below and `hasUnattributedEvents`) is
	// evaluated over a fixed 90-day discovery window in the datastore, so it is
	// stable for the session — changing the dashboard date range never adds or
	// removes tabs, only the metrics follow the selected range.
	const breakdownValues = useInViewSelect(
		( select: Select ) => {
			const values = select( MODULES_ANALYTICS_4 ).getBreakdownValues(
				breakdownDimension,
				eventNames
			) as string[] | undefined;

			// Restrict the tabs to the allowlist so values that aren't supported
			// (e.g. an unrelated plugin sharing the provider dimension) surface in
			// "Other sources" instead of as their own tab.
			if ( ! values || ! supportedValues ) {
				return values;
			}

			return values.filter( ( value ) =>
				supportedValues.includes( value )
			);
		},
		[ breakdownDimension, eventNames, supportedValues ]
	) as string[] | undefined;

	const hasOtherSources =
		( useInViewSelect(
			( select: Select ) =>
				select( MODULES_ANALYTICS_4 ).hasUnattributedEvents(
					breakdownDimension,
					detectionEventNames,
					breakdownValues ?? []
				),
			[ breakdownDimension, detectionEventNames, breakdownValues ]
		) as boolean | undefined ) ?? false;

	// The displayed Other sources count follows the selected date range; only
	// queried once the tab exists.
	const otherSourceCounts = useInViewSelect(
		( select: Select ) =>
			hasOtherSources
				? select( MODULES_ANALYTICS_4 ).getUnattributedEventCounts(
						breakdownDimension,
						detectionEventNames,
						breakdownValues ?? []
				  )
				: undefined,
		[
			breakdownDimension,
			detectionEventNames,
			breakdownValues,
			hasOtherSources,
		]
	) as { currentCount: number; previousCount: number } | undefined;

	const otherSourcesCount = otherSourceCounts?.currentCount ?? 0;
	const otherSourcesPreviousCount = otherSourceCounts?.previousCount ?? 0;

	const hasBreakdownTabs = !! breakdownValues?.length;
	const [ selectedTab, setSelectedTab ] = useState< string | null >( null );

	const activeTabID = selectedTab ?? breakdownValues?.[ 0 ] ?? '';

	const isOtherSourcesTab =
		activeTabID === SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID;

	// Scopes every section report to the selected value tab. The "Other sources"
	// tab has no server-side filter (its single metric comes from the
	// unattributed counts above), so no filter is produced for it.
	const breakdownFilter = useMemo( () => {
		if ( ! hasBreakdownTabs || isOtherSourcesTab ) {
			return undefined;
		}

		return {
			[ `customEvent:${ breakdownDimension }` ]: activeTabID,
		};
	}, [
		hasBreakdownTabs,
		isOtherSourcesTab,
		activeTabID,
		breakdownDimension,
	] );

	return {
		breakdownDimension,
		breakdownValues,
		hasBreakdownTabs,
		activeTabID,
		setSelectedTab,
		isOtherSourcesTab,
		hasOtherSources,
		otherSourcesCount,
		otherSourcesPreviousCount,
		breakdownFilter,
	};
}
