/**
 * Recent activity insight utility tests.
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
import { createInsightReport } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { ReportRow } from '@/js/modules/analytics-4/datastore/types';
import {
	classifyInsight,
	getComparisonDateRange,
	getDateDimensionValues,
} from './insight';

describe( 'getDateDimensionValues', () => {
	it( 'should return every day of the date range as a `date` dimension value, from the first day to the last day', () => {
		expect( getDateDimensionValues( '2025-01-30', '2025-02-02' ) ).toEqual(
			[ '20250130', '20250131', '20250201', '20250202' ]
		);
	} );

	it( 'should return one day for a date range that starts and ends on the same day', () => {
		expect( getDateDimensionValues( '2025-02-05', '2025-02-05' ) ).toEqual(
			[ '20250205' ]
		);
	} );
} );

describe( 'getComparisonDateRange', () => {
	it( 'should return the same weekdays the given number of weeks before the date range', () => {
		// Monday 3 to Wednesday 5 February 2025.
		expect(
			getComparisonDateRange(
				{ startDate: '2025-02-03', endDate: '2025-02-05' },
				4
			)
		).toEqual( { startDate: '2025-01-06', endDate: '2025-01-08' } );
	} );
} );

describe( 'classifyInsight', () => {
	// The date range runs from Monday 3 February to Wednesday 5 February 2025.
	const dateRange = { startDate: '2025-02-03', endDate: '2025-02-05' };

	/**
	 * Builds report rows from day and visitor pairs.
	 *
	 * @since 1.191.0
	 *
	 * @param {Object} visitorsByDate Visitors keyed by `date` dimension value, e.g. `20250203`.
	 * @return {Array<Object>} The report rows.
	 */
	function createRows(
		visitorsByDate: Record< string, number >
	): ReportRow[] {
		return Object.entries( visitorsByDate ).map(
			( [ date, visitors ] ) => ( {
				dimensionValues: [ { value: date } ],
				metricValues: [ { value: String( visitors ) } ],
			} )
		);
	}

	/**
	 * Classifies the date range for a report with the given visitors.
	 *
	 * @since 1.191.0
	 *
	 * @param {number}        current     Visitors in the date range.
	 * @param {Array<number>} comparisons Visitors in the same date range one, two, three and four weeks earlier.
	 * @return {Object|null} The insight.
	 */
	function classify( current: number, comparisons: number[] ) {
		return classifyInsight( {
			rows: createInsightReport( dateRange, current, comparisons ).rows,
			...dateRange,
		} );
	}

	it( 'should classify the date range as typical when its visitors match the median', () => {
		expect( classify( 100, [ 100, 100, 100, 100 ] ) ).toEqual( {
			classification: 'typical',
			changePercent: 0,
		} );
	} );

	it( 'should classify the date range as typical when its visitors are exactly 25% above the median', () => {
		expect( classify( 125, [ 100, 100, 100, 100 ] ) ).toEqual( {
			classification: 'typical',
			changePercent: 25,
		} );
	} );

	it( 'should classify the date range as typical when its visitors are exactly 25% below the median', () => {
		expect( classify( 75, [ 100, 100, 100, 100 ] ) ).toEqual( {
			classification: 'typical',
			changePercent: -25,
		} );
	} );

	it( 'should classify the date range as up when its visitors are more than 25% above the median', () => {
		expect( classify( 126, [ 100, 100, 100, 100 ] ) ).toEqual( {
			classification: 'up',
			changePercent: expect.closeTo( 26 ),
		} );
	} );

	it( 'should classify the date range as down when its visitors are more than 25% below the median', () => {
		expect( classify( 74, [ 100, 100, 100, 100 ] ) ).toEqual( {
			classification: 'down',
			changePercent: expect.closeTo( -26 ),
		} );
	} );

	it( 'should compare the date range to the median of the four comparison windows, not their mean', () => {
		// The mean of the comparison windows is 325, which would make 110
		// visitors read as down. Their median is 100.
		expect( classify( 110, [ 100, 1000, 100, 100 ] ) ).toEqual( {
			classification: 'typical',
			changePercent: expect.closeTo( 10 ),
		} );
	} );

	it( 'should take the mean of the two middle comparison windows as the median', () => {
		// The two middle comparison windows are 90 and 110, so the median is
		// 100.
		expect( classify( 126, [ 80, 120, 90, 110 ] ) ).toEqual( {
			classification: 'up',
			changePercent: expect.closeTo( 26 ),
		} );
	} );

	it( 'should sum every day of the date range and of the comparison windows 7, 14, 21 and 28 days earlier, and ignore the days outside them', () => {
		expect(
			classifyInsight( {
				rows: createRows( {
					// Four weeks earlier: Monday 6 to Wednesday 8 January.
					20250106: 20,
					20250107: 30,
					20250108: 50,
					// Three weeks earlier: Monday 13 to Wednesday 15 January.
					20250113: 100,
					// Two weeks earlier: Monday 20 to Wednesday 22 January.
					20250122: 100,
					// One week earlier: Monday 27 to Wednesday 29 January.
					20250127: 40,
					20250129: 60,
					// The date range: Monday 3 to Wednesday 5 February.
					20250203: 50,
					20250204: 50,
					20250205: 30,
					// The days next to the comparison windows, which a window
					// on other weekdays would hold.
					20250105: 1000,
					20250109: 1000,
					20250126: 1000,
					20250130: 1000,
					20250202: 1000,
				} ),
				...dateRange,
			} )
		).toEqual( {
			classification: 'up',
			changePercent: expect.closeTo( 30 ),
		} );
	} );

	// The two tests below cross a daylight saving change in time zones that
	// have one, such as `America/New_York`, where a day lasts 25 or 23 hours.
	it( 'should classify a date range that holds the day the clocks go back', () => {
		const autumnDateRange = {
			startDate: '2025-11-01',
			endDate: '2025-11-03',
		};

		expect(
			classifyInsight( {
				rows: createInsightReport(
					autumnDateRange,
					100,
					[ 100, 100, 100, 100 ]
				).rows,
				...autumnDateRange,
			} )
		).toEqual( { classification: 'typical', changePercent: 0 } );
	} );

	it( 'should keep the comparison windows on the same weekdays when the clocks go forward between them and the date range', () => {
		expect(
			classifyInsight( {
				rows: createRows( {
					// Four weeks earlier: Monday 10 to Wednesday 12 February.
					20250212: 100,
					// Three weeks earlier: Monday 17 to Wednesday 19 February.
					20250219: 100,
					// Two weeks earlier: Monday 24 to Wednesday 26 February.
					20250226: 100,
					// One week earlier: Monday 3 to Wednesday 5 March.
					20250305: 100,
					// The date range: Monday 10 to Wednesday 12 March, after the
					// clocks go forward on Sunday 9 March.
					20250312: 100,
					// The Sunday before the earliest comparison window, which a
					// window shifted by a day would hold.
					20250209: 1000,
				} ),
				startDate: '2025-03-10',
				endDate: '2025-03-12',
			} )
		).toEqual( { classification: 'typical', changePercent: 0 } );
	} );

	it( 'should return `null` when no comparison window has visitors', () => {
		expect( classify( 100, [ 0, 0, 0, 0 ] ) ).toBeNull();
	} );

	it( 'should return `null` when only three comparison windows have visitors', () => {
		// The report has a row of `0` for every day of the fourth week.
		expect( classify( 100, [ 100, 100, 100 ] ) ).toBeNull();
	} );

	it( 'should return `null` when only three comparison windows have rows', () => {
		expect(
			classifyInsight( {
				rows: createRows( {
					20250115: 100,
					20250122: 100,
					20250129: 100,
					20250205: 100,
				} ),
				...dateRange,
			} )
		).toBeNull();
	} );

	it( 'should return `null` when the date range has no visitors', () => {
		expect( classify( 0, [ 100, 100, 100, 100 ] ) ).toBeNull();
	} );

	it( 'should return `null` when the report has no rows', () => {
		expect(
			classifyInsight( { rows: undefined, ...dateRange } )
		).toBeNull();
	} );
} );
