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
	TypicalTrafficAvailability,
	getDailyTrafficFromReport,
	getKeyFactorsWaitingText,
	getTrafficOverviewVisits,
	getTypicalTrafficAvailability,
	getTypicalTrafficAvailabilityText,
	getTypicalTrafficRangeWaitingText,
	getTypicalTrafficWaitingText,
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
			lowTraffic: false,
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
					lowTraffic: true,
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
				lowTraffic: true,
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

/** A range that ends today, 2025-02-05, the last day a range can end on. */
const ENDS_TODAY = {
	endDate: '2025-02-05',
	latestSelectableDate: '2025-02-05',
};

/** A range that ends in the past, on 2025-01-20, while today is 2025-02-05. */
const ENDS_IN_THE_PAST = {
	endDate: '2025-01-20',
	latestSelectableDate: '2025-02-05',
};

describe( 'getTypicalTrafficRangeWaitingText', () => {
	it( 'should say when to check back for the typical traffic range when the selected range ends today', () => {
		expect(
			getTypicalTrafficRangeWaitingText( '2025-04-02', ENDS_TODAY )
		).toBe(
			'We’re still learning what’s usual for your site. Check back on April 2, 2025 to see your typical traffic range.'
		);
	} );

	it.each( [
		[
			'the selected range ends in the past, and the day is still ahead',
			'2025-04-02',
			ENDS_IN_THE_PAST,
			'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after April 2, 2025 to see it.',
		],
		[
			'the selected range ends in the past, and the day has passed',
			'2025-02-01',
			ENDS_IN_THE_PAST,
			'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after February 1, 2025 to see it.',
		],
		[
			'the day isn’t ahead',
			'2025-02-05',
			ENDS_TODAY,
			'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after February 5, 2025 to see it.',
		],
	] )(
		'should ask for a date range that ends later when %s',
		( _, availableFrom, dates, text ) => {
			// A range that ends before the last day a range can end on never
			// gains the history it lacks, so waiting doesn't help.
			expect(
				getTypicalTrafficRangeWaitingText( availableFrom, dates )
			).toBe( text );
		}
	);

	it( 'should say only that the history is too short when the site has no recorded traffic up to the end of the date range', () => {
		expect( getTypicalTrafficRangeWaitingText( null, ENDS_TODAY ) ).toBe(
			'There isn’t enough traffic history for a typical traffic range on these dates.'
		);
	} );
} );

describe( 'getKeyFactorsWaitingText', () => {
	it( 'should say when to check back for the key factors when the selected range ends today', () => {
		expect( getKeyFactorsWaitingText( '2025-02-06', ENDS_TODAY ) ).toBe(
			'There’s no previous period to compare to yet. Check back on February 6, 2025 to see which channels changed the most.'
		);
	} );

	it.each( [
		[
			'the selected range ends in the past, and the day is still ahead',
			'2025-02-06',
			ENDS_IN_THE_PAST,
			'There’s no previous period to compare to. Select a date range that ends on or after February 6, 2025 to see which channels changed the most.',
		],
		[
			'the selected range ends in the past, and the day has passed',
			'2025-01-25',
			ENDS_IN_THE_PAST,
			'There’s no previous period to compare to. Select a date range that ends on or after January 25, 2025 to see which channels changed the most.',
		],
		[
			'the day isn’t ahead',
			'2025-02-05',
			ENDS_TODAY,
			'There’s no previous period to compare to. Select a date range that ends on or after February 5, 2025 to see which channels changed the most.',
		],
	] )(
		'should ask for a date range that ends later when %s',
		( _, availableFrom, dates, text ) => {
			expect( getKeyFactorsWaitingText( availableFrom, dates ) ).toBe(
				text
			);
		}
	);

	it( 'should say only that there is no previous period when the site has no recorded traffic up to the end of the date range', () => {
		expect( getKeyFactorsWaitingText( null, ENDS_TODAY ) ).toBe(
			'There’s no previous period to compare to.'
		);
	} );
} );

describe( 'getTypicalTrafficWaitingText', () => {
	it.each( [
		[
			'the key factors show first',
			'2025-04-02',
			'2025-02-06',
			'We’re still learning what’s usual for your site. Check back on February 6, 2025 to see which channels changed the most, and on April 2, 2025 to see your typical traffic range.',
		],
		[
			'the typical traffic range shows first',
			'2025-04-02',
			'2025-06-30',
			'We’re still learning what’s usual for your site. Check back on April 2, 2025 to see your typical traffic range, and on June 30, 2025 to see which channels changed the most.',
		],
		[
			'both show on the same day',
			'2025-04-02',
			'2025-04-02',
			'We’re still learning what’s usual for your site. Check back on April 2, 2025 to see your typical traffic range and which channels changed the most.',
		],
	] )(
		'should say when to check back for each part, the earlier first, when the selected range ends today and %s',
		( _, bandAvailableFrom, keyFactorsAvailableFrom, text ) => {
			expect(
				getTypicalTrafficWaitingText(
					bandAvailableFrom,
					keyFactorsAvailableFrom,
					ENDS_TODAY
				)
			).toBe( text );
		}
	);

	it.each( [
		[
			'the key factors show first',
			'2025-04-02',
			'2025-02-06',
			'There isn’t enough traffic history for these dates. Select a date range that ends on or after February 6, 2025 to see which channels changed the most, and on or after April 2, 2025 to see your typical traffic range.',
		],
		[
			'the typical traffic range shows first',
			'2025-04-02',
			'2025-06-30',
			'There isn’t enough traffic history for these dates. Select a date range that ends on or after April 2, 2025 to see your typical traffic range, and on or after June 30, 2025 to see which channels changed the most.',
		],
		[
			'both show on the same day',
			'2025-04-02',
			'2025-04-02',
			'There isn’t enough traffic history for these dates. Select a date range that ends on or after April 2, 2025 to see your typical traffic range and which channels changed the most.',
		],
		[
			'only the earlier day has passed',
			'2025-03-28',
			'2025-02-01',
			'There isn’t enough traffic history for these dates. Select a date range that ends on or after February 1, 2025 to see which channels changed the most, and on or after March 28, 2025 to see your typical traffic range.',
		],
		[
			'both days have passed',
			'2025-02-04',
			'2025-01-25',
			'There isn’t enough traffic history for these dates. Select a date range that ends on or after January 25, 2025 to see which channels changed the most, and on or after February 4, 2025 to see your typical traffic range.',
		],
	] )(
		'should ask for a date range that ends on or after each day, the earlier first, when the selected range ends in the past and %s',
		( _, bandAvailableFrom, keyFactorsAvailableFrom, text ) => {
			// The range never gains the history it lacks, however long one
			// waits, so a day still ahead asks for a later range too.
			expect(
				getTypicalTrafficWaitingText(
					bandAvailableFrom,
					keyFactorsAvailableFrom,
					ENDS_IN_THE_PAST
				)
			).toBe( text );
		}
	);

	it( 'should say only that the history is too short for either part when the site has no recorded traffic up to the end of the date range', () => {
		expect( getTypicalTrafficWaitingText( null, null, ENDS_TODAY ) ).toBe(
			'There isn’t enough traffic history for a typical traffic range on these dates, and there’s no previous period to compare to.'
		);
	} );
} );

/** A 28-day range with every part, on 2025-02-05. */
const AVAILABILITY: TypicalTrafficAvailability = {
	rangeTooShort: false,
	bandAvailable: true,
	bandAvailableFrom: '2024-11-01',
	keyFactorsAvailable: true,
	keyFactorsAvailableFrom: '2024-09-01',
	insightRequestAllowed: true,
	performanceInsightAvailable: true,
	lastYearAvailable: false,
	rangeTooLong: false,
	lowTraffic: false,
};

const NOTICE_OPTIONS = {
	...ENDS_TODAY,
	insightsEnabled: true,
};

describe( 'getTypicalTrafficAvailabilityText', () => {
	it( 'should have no text when the range has every part', () => {
		expect(
			getTypicalTrafficAvailabilityText( AVAILABILITY, NOTICE_OPTIONS )
		).toBeNull();
	} );

	it( 'should ask for a range of at least 7 days for a range too short for the key factors, and say nothing of the typical traffic range that waits too', () => {
		// The typical traffic range waits for a day of a range this short,
		// which a longer range moves.
		expect(
			getTypicalTrafficAvailabilityText(
				{
					...AVAILABILITY,
					rangeTooShort: true,
					bandAvailable: false,
					bandAvailableFrom: '2025-04-02',
					keyFactorsAvailable: false,
					keyFactorsAvailableFrom: null,
				},
				NOTICE_OPTIONS
			)
		).toBe(
			'Select a date range of at least 7 days to see which channels changed the most.'
		);
	} );

	it( 'should say when the key factors and the typical traffic range will show, in one text, while both wait', () => {
		expect(
			getTypicalTrafficAvailabilityText(
				{
					...AVAILABILITY,
					bandAvailable: false,
					bandAvailableFrom: '2025-04-02',
					keyFactorsAvailable: false,
					keyFactorsAvailableFrom: '2025-02-06',
				},
				NOTICE_OPTIONS
			)
		).toBe(
			'We’re still learning what’s usual for your site. Check back on February 6, 2025 to see which channels changed the most, and on April 2, 2025 to see your typical traffic range.'
		);
	} );

	it.each( [
		[ 'within 364 days', false ],
		[ 'too long for the insight', true ],
	] )(
		'should say when the key factors will show while they alone wait, for a range %s',
		( _, rangeTooLong ) => {
			// A 90-day range has its typical traffic range before its key
			// factors, and a range whose key factors wait has no insight
			// either way.
			expect(
				getTypicalTrafficAvailabilityText(
					{
						...AVAILABILITY,
						keyFactorsAvailable: false,
						keyFactorsAvailableFrom: '2025-02-06',
						rangeTooLong,
					},
					NOTICE_OPTIONS
				)
			).toBe(
				'There’s no previous period to compare to yet. Check back on February 6, 2025 to see which channels changed the most.'
			);
		}
	);

	it( 'should say when the typical traffic range will show while it alone waits', () => {
		expect(
			getTypicalTrafficAvailabilityText(
				{
					...AVAILABILITY,
					bandAvailable: false,
					bandAvailableFrom: '2025-04-02',
				},
				NOTICE_OPTIONS
			)
		).toBe(
			'We’re still learning what’s usual for your site. Check back on April 2, 2025 to see your typical traffic range.'
		);
	} );

	it.each( [
		[
			'the key factors',
			{
				keyFactorsAvailable: false,
				keyFactorsAvailableFrom: '2025-02-06',
			},
			'There’s no previous period to compare to. Select a date range that ends on or after February 6, 2025 to see which channels changed the most.',
		],
		[
			'the typical traffic range',
			{ bandAvailable: false, bandAvailableFrom: '2025-04-02' },
			'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after April 2, 2025 to see it.',
		],
		[
			'both parts',
			{
				bandAvailable: false,
				bandAvailableFrom: '2025-04-02',
				keyFactorsAvailable: false,
				keyFactorsAvailableFrom: '2025-02-06',
			},
			'There isn’t enough traffic history for these dates. Select a date range that ends on or after February 6, 2025 to see which channels changed the most, and on or after April 2, 2025 to see your typical traffic range.',
		],
	] )(
		'should ask for a date range that ends later, rather than say when to check back, for a range that ends in the past, with a day still ahead for %s',
		( _, changes, text ) => {
			expect(
				getTypicalTrafficAvailabilityText(
					{ ...AVAILABILITY, ...changes },
					{ ...NOTICE_OPTIONS, ...ENDS_IN_THE_PAST }
				)
			).toBe( text );
		}
	);

	it( 'should say what range the insight needs for a range too long for it', () => {
		expect(
			getTypicalTrafficAvailabilityText(
				{ ...AVAILABILITY, rangeTooLong: true },
				NOTICE_OPTIONS
			)
		).toBe(
			'Select a date range of up to 364 days to see insights about your traffic.'
		);
	} );

	// A site with low traffic has no band and no key factors, so its
	// availability says that neither shows, while its days still count the
	// history alone.
	const LOW_TRAFFIC: TypicalTrafficAvailability = {
		...AVAILABILITY,
		bandAvailable: false,
		keyFactorsAvailable: false,
		insightRequestAllowed: false,
		performanceInsightAvailable: false,
		lowTraffic: true,
	};

	const LOW_TRAFFIC_TEXT =
		'There isn’t enough traffic data right now to show a reliable typical range or traffic shifts. These insights will come back once your site gets more regular visits.';

	it( 'should say that the site has too little traffic, rather than when a part will show, for a site with low traffic', () => {
		expect(
			getTypicalTrafficAvailabilityText( LOW_TRAFFIC, NOTICE_OPTIONS )
		).toBe( LOW_TRAFFIC_TEXT );
	} );

	it.each( [
		[ 'too short for the key factors', { rangeTooShort: true } ],
		[ 'too long for the insight', { rangeTooLong: true } ],
		[
			'whose parts would wait for history',
			{
				bandAvailableFrom: '2025-04-02',
				keyFactorsAvailableFrom: '2025-02-06',
			},
		],
	] )(
		'should say that the site has too little traffic for a range %s, since waiting or another range wouldn’t bring the parts',
		( _, changes ) => {
			expect(
				getTypicalTrafficAvailabilityText(
					{ ...LOW_TRAFFIC, ...changes },
					NOTICE_OPTIONS
				)
			).toBe( LOW_TRAFFIC_TEXT );
		}
	);

	it( 'should say that the site has too little traffic without the trafficInsights feature', () => {
		expect(
			getTypicalTrafficAvailabilityText( LOW_TRAFFIC, {
				...NOTICE_OPTIONS,
				insightsEnabled: false,
			} )
		).toBe( LOW_TRAFFIC_TEXT );
	} );

	it( 'should have no text for a range too long for the insight without the trafficInsights feature', () => {
		expect(
			getTypicalTrafficAvailabilityText(
				{ ...AVAILABILITY, rangeTooLong: true },
				{ ...NOTICE_OPTIONS, insightsEnabled: false }
			)
		).toBeNull();
	} );
} );
