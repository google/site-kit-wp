/**
 * Site Goals test utility functions.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { SITE_GOALS_WIDGET_EVENTS } from '@/js/modules/analytics-4/datastore/site-goals-settings';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';

/**
 * Builds the report options `useSiteGoalsHasEventsInDateRange()` requests.
 *
 * @since n.e.x.t
 *
 * @param {WPDataRegistry} registry Test registry whose selected date range the report covers.
 * @param {GoalType}       goalType Goal type whose conversion events the report counts.
 * @return {ReportOptions} The report options.
 */
export function buildSiteGoalsEventCountReportOptions(
	registry: WPDataRegistry,
	goalType: GoalType
): ReportOptions {
	const { startDate, endDate } = registry
		.select( CORE_USER )
		.getDateRangeDates( { compare: false } );

	return {
		startDate,
		endDate,
		metrics: [ { name: 'eventCount' } ],
		dimensionFilters: {
			eventName: {
				filterType: 'inListFilter',
				value: SITE_GOALS_WIDGET_EVENTS[ goalType ],
			},
		},
		reportID: `analytics-4_site-goals_events-in-date-range_${ goalType }`,
	};
}

/**
 * Stores a finished event count report, so `useSiteGoalsHasEventsInDateRange()`
 * reads it without a request.
 *
 * @since n.e.x.t
 *
 * @param {WPDataRegistry} registry   Test registry whose selected date range the report covers.
 * @param {GoalType}       goalType   Goal type whose conversion events the report counts.
 * @param {string}         eventCount Total the report returns, as the string Analytics sends.
 * @return {void}
 */
export function seedSiteGoalsEventCountReport(
	registry: WPDataRegistry,
	goalType: GoalType,
	eventCount: string
): void {
	const options = buildSiteGoalsEventCountReportOptions( registry, goalType );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: [ { metricValues: [ { value: eventCount } ] } ],
			totals: [ { metricValues: [ { value: eventCount } ] } ],
		},
		{ options }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ options ] );
}
