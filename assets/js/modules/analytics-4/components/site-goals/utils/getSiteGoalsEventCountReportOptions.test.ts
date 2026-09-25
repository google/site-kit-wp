/**
 * Site Goals event count report options tests.
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
import { getSiteGoalsEventCountReportOptions } from './getSiteGoalsEventCountReportOptions';

describe( 'getSiteGoalsEventCountReportOptions', () => {
	it( "builds the options of the report that counts the goal type's conversion events in the given date range", () => {
		expect(
			getSiteGoalsEventCountReportOptions(
				{ startDate: '2026-08-28', endDate: '2026-09-24' },
				'lead'
			)
		).toEqual( {
			startDate: '2026-08-28',
			endDate: '2026-09-24',
			metrics: [ { name: 'eventCount' } ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ 'contact', 'generate_lead', 'submit_lead_form' ],
				},
			},
			reportID: 'analytics-4_site-goals_events-in-date-range_lead',
		} );
	} );
} );
