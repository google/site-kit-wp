/**
 * Recent activity report options tests.
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
import {
	getSearchPerformanceReportOptions,
	getTimeZoneReportOptions,
	getTotalVisitorsReportOptions,
} from './reportOptions';

describe( 'getTimeZoneReportOptions', () => {
	it( 'should request `totalUsers` for the days of the window in UTC', () => {
		// The window ends at 19:00 UTC on October 13, which is already
		// October 14 in time zones five or more hours ahead of UTC, such as
		// `Asia/Tokyo`.
		expect(
			getTimeZoneReportOptions( Date.parse( '2026-10-12T20:00:00Z' ) )
		).toEqual( {
			startDate: '2026-10-12',
			endDate: '2026-10-13',
			metrics: [ { name: 'totalUsers' } ],
			reportID: 'analytics-4_fresh-metrics-row_widget_timeZoneArgs',
		} );
	} );
} );

describe( 'getTotalVisitorsReportOptions', () => {
	it( 'should filter the Total visitors report by the hours of the window in the time zone of the property, without a `dateHour` dimension', () => {
		expect(
			getTotalVisitorsReportOptions(
				Date.parse( '2026-10-12T09:00:00Z' ),
				'Asia/Tokyo'
			)
		).toEqual( {
			startDate: '2026-10-12',
			endDate: '2026-10-13',
			metrics: [ { name: 'totalUsers' } ],
			dimensionFilters: {
				dateHour: [
					'2026101218',
					'2026101219',
					'2026101220',
					'2026101221',
					'2026101222',
					'2026101223',
					'2026101300',
					'2026101301',
					'2026101302',
					'2026101303',
					'2026101304',
					'2026101305',
					'2026101306',
					'2026101307',
					'2026101308',
					'2026101309',
					'2026101310',
					'2026101311',
					'2026101312',
					'2026101313',
					'2026101314',
					'2026101315',
					'2026101316',
					'2026101317',
				],
			},
			reportID: 'analytics-4_fresh-metrics-row_widget_totalVisitorsArgs',
		} );
	} );
} );

describe( 'getSearchPerformanceReportOptions', () => {
	it( 'should request the Search Console report by hour for the days of the window in Pacific Time', () => {
		// The window starts at 23:00 on October 11 in Pacific Time, a day
		// earlier than in UTC.
		expect(
			getSearchPerformanceReportOptions(
				Date.parse( '2026-10-12T06:00:00Z' )
			)
		).toEqual( {
			startDate: '2026-10-11',
			endDate: '2026-10-12',
			dimensions: 'hour',
			reportID:
				'search-console_fresh-metrics-row_widget_searchPerformanceArgs',
		} );
	} );
} );
