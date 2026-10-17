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
import { SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE } from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import {
	CONVERSION_REPORTING_ECOMMERCE_EVENTS,
	MODULES_ANALYTICS_4,
	SITE_GOALS_WIDGET_EVENTS,
} from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { getPreviousDate } from '@/js/util';

/**
 * Builds the options of the report that counts a goal type's conversion events
 * in the selected date range.
 *
 * @since 1.190.0
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
 * Stores a finished event count report for the selected date range, so the code
 * under test reads it without a request.
 *
 * @since 1.190.0
 *
 * @param {WPDataRegistry} registry   Test registry whose selected date range the report covers.
 * @param {GoalType}       goalType   Goal type whose conversion events the report counts.
 * @param {string}         eventCount Total the report returns, as the string Analytics sends, e.g. `'12'`, not `12`.
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

/**
 * Builds the options of the discovery report that lists a goal type's breakdown
 * values, with the event scoping its Site Goals widget uses.
 *
 * @since n.e.x.t
 *
 * @param {WPDataRegistry} registry Test registry whose reference date ends the 90-day discovery window.
 * @param {GoalType}       goalType Goal type whose breakdown dimension the report groups by.
 * @return {ReportOptions} The report options.
 */
export function buildSiteGoalsBreakdownValuesReportOptions(
	registry: WPDataRegistry,
	goalType: GoalType
): ReportOptions {
	const customDimensionSlug =
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[ goalType ];
	const dimension = `customEvent:${ customDimensionSlug }`;
	const endDate = registry.select( CORE_USER ).getReferenceDate();

	return {
		startDate: getPreviousDate( endDate, 90 ),
		endDate,
		dimensions: [ dimension ],
		dimensionFilters: {
			[ dimension ]: {
				filterType: 'emptyFilter',
				notExpression: true,
			},
			...( goalType === GOAL_TYPES.ECOMMERCE
				? {
						eventName: {
							filterType: 'inListFilter',
							value: CONVERSION_REPORTING_ECOMMERCE_EVENTS,
						},
				  }
				: {} ),
		},
		metrics: [ { name: 'eventCount' } ],
		orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
		reportID: `analytics-4_site-goals-breakdown_values_${ customDimensionSlug }`,
	};
}

/**
 * Stores a finished discovery report listing a goal type's breakdown values,
 * so the code under test reads them without a request.
 *
 * @since n.e.x.t
 *
 * @param {WPDataRegistry} registry Test registry whose reference date ends the 90-day discovery window.
 * @param {GoalType}       goalType Goal type whose breakdown dimension the report groups by.
 * @param {Array<string>}  values   Breakdown values the report returns, e.g. form IDs or provider slugs.
 * @return {void}
 */
export function seedSiteGoalsBreakdownValuesReport(
	registry: WPDataRegistry,
	goalType: GoalType,
	values: string[]
): void {
	const options = buildSiteGoalsBreakdownValuesReportOptions(
		registry,
		goalType
	);

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: values.map( ( value ) => ( {
				dimensionValues: [ { value } ],
				metricValues: [ { value: '1' } ],
			} ) ),
		},
		{ options }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ options ] );
}
