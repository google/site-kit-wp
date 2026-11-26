/**
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
 * Report helpers shared by the Site Goals widget stories.
 */

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { buildKeyActionSessionsReportOptions as buildSharedKeyActionSessionsReportOptions } from '@/js/modules/analytics-4/components/site-goals/utils/headlineMetrics';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { getPreviousDate } from '@/js/util';

// Reference date: 2020-09-07, 28-day range with comparison.
export const dates = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	compareStartDate: '2020-07-14',
	compareEndDate: '2020-08-10',
};

// The fixed 90-day window the breakdown tab structure is evaluated over.
export const discoveryDates = {
	startDate: getPreviousDate( '2020-09-07', 90 ),
	endDate: '2020-09-07',
};

export const engagementReportOptions = {
	...dates,
	metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
	reportID: 'analytics-4_site-goals_engagementReportOptions',
};

// The site's sessions in the current and the previous period. Mocked reports
// hold too few sessions for a realistic Key action rate.
const SITE_SESSIONS = { current: 1250, previous: 1100 };

function buildTotalsRows( current: string[], previous: string[] ) {
	return [
		{
			dimensionValues: [ { value: 'date_range_0' } ],
			metricValues: current.map( ( value ) => ( { value } ) ),
		},
		{
			dimensionValues: [ { value: 'date_range_1' } ],
			metricValues: previous.map( ( value ) => ( { value } ) ),
		},
	];
}

/**
 * Builds the options of the Key action sessions report for the story dates.
 *
 * @since n.e.x.t
 *
 * @param {(string|Array)} keyActionEvents   The Key action event, or the lead events.
 * @param {Object}         [breakdownFilter] The tab's filter, empty for no tab.
 * @return {Object} Report options.
 */
export function buildKeyActionSessionsReportOptions(
	keyActionEvents: string | string[],
	breakdownFilter: Record< string, unknown > = {}
) {
	return buildSharedKeyActionSessionsReportOptions(
		dates,
		keyActionEvents,
		breakdownFilter
	) as ReportOptions;
}

/**
 * Adds the site's engagement report, with the fixed site sessions.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry Registry to add the report to.
 * @return {void}
 */
export function provideSiteEngagementReport( registry: WPDataRegistry ) {
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			totals: buildTotalsRows(
				[ '0.549', String( SITE_SESSIONS.current ) ],
				[ '0.52', String( SITE_SESSIONS.previous ) ]
			),
		},
		{ options: engagementReportOptions }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ engagementReportOptions ] );
}

/**
 * Adds the Key action sessions report as a share of the site sessions.
 *
 * @since n.e.x.t
 *
 * @param {Object}         registry          Registry to add the report to.
 * @param {(string|Array)} keyActionEvents   The Key action event, or the lead events.
 * @param {number}         share             Share of the site sessions with a Key action.
 * @param {Object}         [breakdownFilter] The tab's filter, empty for no tab.
 * @return {void}
 */
export function provideKeyActionSessionsReport(
	registry: WPDataRegistry,
	keyActionEvents: string | string[],
	share: number,
	breakdownFilter: Record< string, unknown > = {}
) {
	const options = buildKeyActionSessionsReportOptions(
		keyActionEvents,
		breakdownFilter
	);
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			totals: buildTotalsRows(
				[ String( Math.round( SITE_SESSIONS.current * share ) ) ],
				[ String( Math.round( SITE_SESSIONS.previous * share ) ) ]
			),
		},
		{ options }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ options ] );
}
