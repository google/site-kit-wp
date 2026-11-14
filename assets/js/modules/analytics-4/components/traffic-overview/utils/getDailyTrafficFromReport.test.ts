/**
 * Traffic Overview `getDailyTrafficFromReport` utility tests.
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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { getDailyTrafficFromReport } from './getDailyTrafficFromReport';

/**
 * Builds a daily visits report with a row for each day given.
 *
 * @since n.e.x.t
 *
 * @param {Array.<Array>} days Each day as `[ YYYYMMDD, visits ]`.
 * @return {Object} The report.
 */
function createDailyVisitsReport( days: Array< [ string, number ] > ): Report {
	return {
		rows: days.map( ( [ date, visits ] ) => ( {
			dimensionValues: [ { value: date } ],
			metricValues: [ { value: String( visits ) } ],
		} ) ),
	};
}

describe( 'getDailyTrafficFromReport', () => {
	it( 'should return a row for each day of the range, oldest first, with the visits of the report and no typical range', () => {
		const report = createDailyVisitsReport( [
			[ '20250101', 12 ],
			[ '20250102', 34 ],
			[ '20250103', 56 ],
		] );

		expect(
			getDailyTrafficFromReport( report, '2025-01-01', '2025-01-03' )
		).toEqual( [
			{
				date: '2025-01-01',
				visits: 12,
				expectedMin: null,
				expectedMax: null,
			},
			{
				date: '2025-01-02',
				visits: 34,
				expectedMin: null,
				expectedMax: null,
			},
			{
				date: '2025-01-03',
				visits: 56,
				expectedMin: null,
				expectedMax: null,
			},
		] );
	} );

	it( 'should place each row on its own day, whatever the order of the report', () => {
		const report = createDailyVisitsReport( [
			[ '20250103', 56 ],
			[ '20250101', 12 ],
			[ '20250102', 34 ],
		] );

		expect(
			getDailyTrafficFromReport( report, '2025-01-01', '2025-01-03' ).map(
				( { visits } ) => visits
			)
		).toEqual( [ 12, 34, 56 ] );
	} );

	it( 'should read zero visits on a day the report leaves out', () => {
		const report = createDailyVisitsReport( [
			[ '20250101', 12 ],
			[ '20250103', 56 ],
		] );

		expect(
			getDailyTrafficFromReport( report, '2025-01-01', '2025-01-03' ).map(
				( { date, visits } ) => [ date, visits ]
			)
		).toEqual( [
			[ '2025-01-01', 12 ],
			[ '2025-01-02', 0 ],
			[ '2025-01-03', 56 ],
		] );
	} );

	it( 'should leave out a row outside the range, or without a day', () => {
		const report: Report = {
			rows: [
				{
					dimensionValues: [ { value: '20241231' } ],
					metricValues: [ { value: '99' } ],
				},
				{
					dimensionValues: [ { value: '(other)' } ],
					metricValues: [ { value: '99' } ],
				},
				{
					dimensionValues: [ { value: '20250101' } ],
					metricValues: [ { value: '12' } ],
				},
			],
		};

		expect(
			getDailyTrafficFromReport( report, '2025-01-01', '2025-01-02' ).map(
				( { date, visits } ) => [ date, visits ]
			)
		).toEqual( [
			[ '2025-01-01', 12 ],
			[ '2025-01-02', 0 ],
		] );
	} );

	it( 'should read zero visits on every day of the range without a report', () => {
		expect(
			getDailyTrafficFromReport( undefined, '2025-01-01', '2025-01-02' )
		).toEqual( [
			{
				date: '2025-01-01',
				visits: 0,
				expectedMin: null,
				expectedMax: null,
			},
			{
				date: '2025-01-02',
				visits: 0,
				expectedMin: null,
				expectedMax: null,
			},
		] );
	} );

	it( 'should cover every day of a range that crosses a daylight-saving change', () => {
		// Many time zones move their clocks in late March.
		const dailyTraffic = getDailyTrafficFromReport(
			undefined,
			'2025-03-29',
			'2025-04-01'
		);

		expect( dailyTraffic.map( ( { date } ) => date ) ).toEqual( [
			'2025-03-29',
			'2025-03-30',
			'2025-03-31',
			'2025-04-01',
		] );
	} );
} );
