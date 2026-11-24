/**
 * Traffic Overview typical traffic utility tests.
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
import { createBenchmarkingResponse } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import {
	getDailyTrafficFromReport,
	getTrafficInsightRangeText,
	getTrafficOverviewVisits,
	getTypicalTrafficAvailability,
	getTypicalTrafficRangeWaitingText,
	hasTypicalTrafficRange,
} from './typical-traffic';

describe( 'getTypicalTrafficAvailability', () => {
	it( 'should show every part while the benchmarking response loads', () => {
		expect( getTypicalTrafficAvailability( undefined ) ).toEqual( {
			rangeTooShort: false,
			bandAvailable: true,
			bandAvailableFrom: null,
			keyFactorsAvailable: true,
			keyFactorsAvailableFrom: null,
			insightRequestAllowed: true,
			performanceInsightAvailable: true,
			lastYearAvailable: false,
			rangeTooLong: false,
		} );
	} );

	it( 'should read the parts from the availability of the benchmarking response, rather than from its days', () => {
		const response = createBenchmarkingResponse(
			'2025-01-09',
			'2025-02-05'
		);

		// Every day has its typical range, but the response says the range
		// has no part of the view, so the parts follow the response.
		expect(
			getTypicalTrafficAvailability( {
				...response,
				availability: {
					...response.availability,
					rangeTooShort: true,
					bandAvailable: false,
					bandAvailableFrom: '2025-04-02',
					keyFactorsAvailable: false,
					keyFactorsAvailableFrom: null,
					insightRequestAllowed: false,
					performanceInsightAvailable: false,
					lastYearAvailable: true,
					rangeTooLong: true,
				},
			} )
		).toEqual(
			expect.objectContaining( {
				rangeTooShort: true,
				bandAvailable: false,
				bandAvailableFrom: '2025-04-02',
				keyFactorsAvailable: false,
				keyFactorsAvailableFrom: null,
				insightRequestAllowed: false,
				performanceInsightAvailable: false,
				lastYearAvailable: true,
				rangeTooLong: true,
			} )
		);
	} );
} );

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

describe( 'getTrafficOverviewVisits', () => {
	const startDate = '2025-01-01';
	const endDate = '2025-01-03';

	const benchmarkingResponse = createBenchmarkingResponse(
		startDate,
		endDate
	);

	// The visits on two of the three days, and the visits over the selected
	// range and the range before it in its totals, selected range first.
	const dailyVisitsReport: Report = {
		rows: [
			{
				dimensionValues: [
					{ value: '20250101' },
					{ value: 'date_range_0' },
				],
				metricValues: [ { value: '12' } ],
			},
			{
				dimensionValues: [
					{ value: '20250103' },
					{ value: 'date_range_0' },
				],
				metricValues: [ { value: '56' } ],
			},
		],
		totals: [
			{ metricValues: [ { value: '68' } ] },
			{ metricValues: [ { value: '50' } ] },
		],
	};

	it( 'should return the visits of the benchmarking response, with the typical range of each day', () => {
		expect(
			getTrafficOverviewVisits( {
				benchmarkingResponse,
				benchmarkingFailed: false,
				dailyVisitsReport,
				startDate,
				endDate,
			} )
		).toEqual( {
			dailyTraffic: benchmarkingResponse.dailyTraffic,
			totalVisits: benchmarkingResponse.visits,
		} );
	} );

	it( 'should return no visits while the benchmarking response loads', () => {
		expect(
			getTrafficOverviewVisits( {
				benchmarkingFailed: false,
				startDate,
				endDate,
			} )
		).toEqual( { dailyTraffic: undefined, totalVisits: undefined } );
	} );

	it( 'should return the visits of the daily visits report, with no typical range, when the benchmarking request fails', () => {
		expect(
			getTrafficOverviewVisits( {
				benchmarkingFailed: true,
				dailyVisitsReport,
				startDate,
				endDate,
			} )
		).toEqual( {
			dailyTraffic: [
				{
					date: '2025-01-01',
					visits: 12,
					expectedMin: null,
					expectedMax: null,
				},
				{
					date: '2025-01-02',
					visits: 0,
					expectedMin: null,
					expectedMax: null,
				},
				{
					date: '2025-01-03',
					visits: 56,
					expectedMin: null,
					expectedMax: null,
				},
			],
			totalVisits: { current: 68, previous: 50 },
		} );
	} );
} );

describe( 'hasTypicalTrafficRange', () => {
	const dailyTraffic = [
		{
			date: '2025-02-04',
			visits: 120,
			expectedMin: 98.3,
			expectedMax: 137.1,
		},
		{
			date: '2025-02-05',
			visits: 40,
			expectedMin: 38.2,
			expectedMax: 53.3,
		},
	];

	it( 'should be true when every day has both bounds', () => {
		expect( hasTypicalTrafficRange( dailyTraffic ) ).toBe( true );
	} );

	it( 'should be true for a day whose fewest typical visits are 0', () => {
		expect(
			hasTypicalTrafficRange( [
				{ ...dailyTraffic[ 0 ], expectedMin: 0, expectedMax: 3.4 },
			] )
		).toBe( true );
	} );

	it.each( [
		[ 'a day has no bounds', { expectedMin: null, expectedMax: null } ],
		[ 'a day has no fewest visits', { expectedMin: null } ],
		[ 'a day has no most visits', { expectedMax: null } ],
	] )( 'should be false when %s', ( _, bounds ) => {
		expect(
			hasTypicalTrafficRange( [
				dailyTraffic[ 0 ],
				{ ...dailyTraffic[ 1 ], ...bounds },
			] )
		).toBe( false );
	} );

	it( 'should be false without a day', () => {
		expect( hasTypicalTrafficRange( [] ) ).toBe( false );
		expect( hasTypicalTrafficRange() ).toBe( false );
	} );
} );

describe( 'getTypicalTrafficRangeWaitingText', () => {
	it( 'should say when to check back for the typical traffic range when it shows on a later day', () => {
		expect(
			getTypicalTrafficRangeWaitingText( '2025-04-02', '2025-02-05' )
		).toBe(
			'We’re still learning what’s usual for your site. Check back on April 2, 2025 to see your typical traffic range.'
		);
	} );

	it.each( [
		[
			'today',
			'2025-02-05',
			'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after February 5, 2025 to see it.',
		],
		[
			'a day that has passed',
			'2025-01-10',
			'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after January 10, 2025 to see it.',
		],
	] )(
		'should ask for a date range that ends later when the typical traffic range shows from %s',
		( _, availableFrom, text ) => {
			// The selected range ends in the past, before the day, so a range
			// that ends on the day or later has the typical traffic range.
			expect(
				getTypicalTrafficRangeWaitingText( availableFrom, '2025-02-05' )
			).toBe( text );
		}
	);

	it( 'should say only that the history is too short when the site has no recorded traffic up to the end of the date range', () => {
		expect( getTypicalTrafficRangeWaitingText( null, '2025-02-05' ) ).toBe(
			'There isn’t enough traffic history for a typical traffic range on these dates.'
		);
	} );
} );

describe( 'getTrafficInsightRangeText', () => {
	it( 'should say what range the insight needs when the range is too long for it', () => {
		expect(
			getTrafficInsightRangeText( {
				rangeTooLong: true,
				keyFactorsAvailable: true,
			} )
		).toBe(
			'Select a date range of up to 364 days to see insights about your traffic.'
		);
	} );

	it.each( [
		[ 'a range the insight is written for', false, true ],
		[
			'a range too long for the insight whose key factors still wait for the period before it',
			true,
			false,
		],
	] )(
		'should have no text for %s',
		( _label, rangeTooLong, keyFactorsAvailable ) => {
			expect(
				getTrafficInsightRangeText( {
					rangeTooLong,
					keyFactorsAvailable,
				} )
			).toBeNull();
		}
	);
} );
