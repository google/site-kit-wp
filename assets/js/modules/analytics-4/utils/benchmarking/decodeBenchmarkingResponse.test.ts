/**
 * Benchmarking response decoder tests.
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
import { availabilityWithoutTraffic } from '@/js/modules/analytics-4/datastore/__factories__/benchmarking';
import benchmarkingData from '@/js/modules/analytics-4/datastore/__fixtures__/benchmarking-data.json';
import { provideTimezone } from '@tests/js/test-utils';
import { decodeBenchmarkingResponse } from './decodeBenchmarkingResponse';

describe( 'decodeBenchmarkingResponse', () => {
	it( 'should decode the checked-in response to `visits`, `dailyTraffic`, `availability`, `bandReferenceDays`, `keyFactors`, `steadyTraffic`, and `contentMarkers`', () => {
		expect( decodeBenchmarkingResponse( benchmarkingData ) ).toEqual( {
			visits: { current: 412, previous: 388 },
			dailyTraffic: [
				{
					date: '2025-08-18',
					visits: 132,
					expectedMin: null,
					expectedMax: null,
				},
				{
					date: '2025-08-19',
					visits: 0,
					expectedMin: 118.4,
					expectedMax: 183.1,
				},
				{
					date: '2025-08-20',
					visits: 147,
					expectedMin: 124.3,
					expectedMax: 191.5,
				},
				{
					date: '2025-08-21',
					visits: 96,
					expectedMin: 117.9,
					expectedMax: 182.6,
				},
			],
			// The days travel as 4 days after and 19 days before the first
			// plotted day.
			availability: {
				rangeTooShort: false,
				bandAvailable: false,
				bandAvailableFrom: '2025-08-22',
				keyFactorsAvailable: true,
				keyFactorsAvailableFrom: '2025-07-30',
				insightRequestAllowed: true,
				performanceInsightAvailable: false,
				lastYearAvailable: false,
				rangeTooLong: false,
			},
			// The four days have no band.
			bandReferenceDays: null,
			keyFactors: [
				{
					kind: 'REFERRING_SITE',
					label: 'Facebook',
					current: 96,
					previous: 31,
					sharePct: 21.4,
					shareBasis: 'GROSS_CHANGE',
					attributes: [
						{
							kind: 'LANDING_PAGE',
							label: '/how-to-plant-garlic/',
							current: 58,
							previous: 12,
							sharePct: 15.1,
						},
						{
							kind: 'DEVICE',
							label: 'mobile',
							current: 71,
							previous: 0,
							sharePct: 0,
							oversized: true,
						},
					],
				},
				{
					kind: 'CHANNEL',
					label: 'Organic Search',
					current: 210,
					previous: 222,
					sharePct: 40.3,
					shareBasis: 'NET_CHANGE',
					attributes: [],
				},
				{
					kind: 'CONTENT',
					label: '/how-to-plant-garlic/',
					current: 64,
					previous: 15,
					sharePct: 12.6,
					url: '/how-to-plant-garlic/',
					shareBasis: 'PARENT_CHANNEL',
					parentChannel: { label: 'Organic Social', change: 389 },
					attributes: [
						{
							kind: 'TRAFFIC_CHANNEL',
							label: 'Organic Social',
							current: 61,
							previous: 13,
							sharePct: 15.9,
						},
					],
				},
			],
			steadyTraffic: false,
			// 2 days after the first plotted day, with the path the `CONTENT`
			// card carries too.
			contentMarkers: [
				{
					date: '2025-08-20',
					posts: [
						{
							title: 'How to plant garlic',
							url: '/how-to-plant-garlic/',
						},
					],
				},
			],
		} );
	} );

	// Sydney's clocks go back an hour on `2026-04-05`, so that day lasts 25
	// hours, and a walk that adds 24 hours to its midnight stays on the same
	// date.
	describe( 'in the Australia/Sydney time zone', () => {
		let originalTimezone: string | undefined;

		beforeEach( () => {
			originalTimezone = provideTimezone( 'Australia/Sydney' );
		} );

		afterEach( () => {
			provideTimezone( originalTimezone );
		} );

		it( 'should date a 90-day series from its first day, with no day missing', () => {
			// The longest series the server sends, over the clock change.
			const dailyVisits = new Array( 90 ).fill( 1 );
			dailyVisits[ 45 ] = 0;

			const decoded = decodeBenchmarkingResponse( [
				1,
				[],
				'2026-02-01',
				dailyVisits,
				[ 0, 0 ],
				[],
				[],
				new Array( 90 ).fill( null ),
				[ false, false, null, false, null, false, false, false, false ],
				[],
				false,
				null,
			] );
			const dates =
				decoded?.dailyTraffic.map( ( { date } ) => date ) ?? [];

			expect( dates ).toHaveLength( 90 );
			expect( new Set( dates ).size ).toBe( 90 );
			expect( dates[ 0 ] ).toBe( '2026-02-01' );
			expect( dates[ 64 ] ).toBe( '2026-04-06' );
			expect( dates[ dates.length - 1 ] ).toBe( '2026-05-01' );
			// The zero day keeps its own date rather than being skipped.
			expect( decoded?.dailyTraffic[ 45 ] ).toEqual( {
				date: '2026-03-18',
				visits: 0,
				expectedMin: null,
				expectedMax: null,
			} );
		} );

		it.each( [
			[ 'before', '2026-04-20', -30, '2026-03-21' ],
			[ 'after', '2026-04-01', 10, '2026-04-11' ],
		] )(
			'should decode a day of the availability %s the first plotted day, across the clock change, to its own date',
			( _label, firstDate, dayOffset, date ) => {
				const availability = decodeBenchmarkingResponse( [
					1,
					[],
					firstDate,
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						dayOffset,
						false,
						dayOffset,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				] )?.availability;

				expect( availability?.bandAvailableFrom ).toBe( date );
				expect( availability?.keyFactorsAvailableFrom ).toBe( date );
			}
		);

		it( 'should date a content marker after the clock change from the first plotted day, to its own date', () => {
			expect(
				decodeBenchmarkingResponse( [
					1,
					[ 'How to plant garlic', '/how-to-plant-garlic/' ],
					'2026-04-01',
					new Array( 14 ).fill( 1 ),
					[ 14, 14 ],
					[],
					[],
					new Array( 14 ).fill( null ),
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[ [ 10, [ 0, 1 ] ] ],
					false,
					null,
				] )?.contentMarkers[ 0 ].date
			).toBe( '2026-04-11' );
		} );
	} );

	it.each( [
		[ 'a string index the table does not hold', 9 ],
		[ 'a null label', null ],
	] )( 'should decode %s to null, not undefined', ( _label, labelIndex ) => {
		const decoded = decodeBenchmarkingResponse( [
			1,
			[ 'Organic Search' ],
			'2025-08-18',
			[ 132 ],
			[ 412, 388 ],
			[ [ 0, labelIndex, 210, 222, 40.3 ] ],
			[ [] ],
			[ null ],
			[ false, false, null, false, null, false, false, false, false ],
			[],
			false,
			null,
		] );

		expect( decoded?.keyFactors[ 0 ].label ).toBeNull();
	} );

	it( 'decodes a response whose version it was not written against to null', () => {
		const [ , ...members ] = benchmarkingData as unknown[];

		expect( decodeBenchmarkingResponse( [ 2, ...members ] ) ).toBeNull();
	} );

	it.each( [
		[ 'a response that is not an array', { version: 1 } ],
		[ 'a response of fewer than ten members', [ 1, [], '2025-08-18' ] ],
		[
			'a response of nine members, without the content markers',
			( benchmarkingData as unknown[] ).slice( 0, 9 ),
		],
		[
			'a response of ten members, without whether traffic was steady',
			( benchmarkingData as unknown[] ).slice( 0, 10 ),
		],
		[
			'a response of eleven members, without the days of traffic the band is fitted on',
			( benchmarkingData as unknown[] ).slice( 0, 11 ),
		],
		[
			'a response of thirteen members',
			[ ...( benchmarkingData as unknown[] ), [] ],
		],
		[
			'a response of fifteen members',
			[ ...( benchmarkingData as unknown[] ), 'en_US', 'payload', null ],
		],
	] )( 'decodes %s to null', ( _label, encoded ) => {
		expect( decodeBenchmarkingResponse( encoded ) ).toBeNull();
	} );

	it( 'should decode the locale and the request of the generated insight from a response of fourteen members', () => {
		const decoded = decodeBenchmarkingResponse( [
			...( benchmarkingData as unknown[] ),
			'de_DE_formal',
			'eyJsb2NhbGUiOiJkZV9ERV9mb3JtYWwifQ.c2lnbmF0dXJl',
		] );

		expect( decoded ).toEqual( {
			...decodeBenchmarkingResponse( benchmarkingData ),
			insightLocale: 'de_DE_formal',
			insightPayload: 'eyJsb2NhbGUiOiJkZV9ERV9mb3JtYWwifQ.c2lnbmF0dXJl',
		} );
	} );

	it( 'should leave out the locale and the request of the generated insight from a response of twelve members', () => {
		const decoded = decodeBenchmarkingResponse( benchmarkingData );

		expect( decoded ).not.toHaveProperty( 'insightLocale' );
		expect( decoded ).not.toHaveProperty( 'insightPayload' );
	} );

	it.each( [
		[ 'null', null, null ],
		[ 'empty strings', '', '' ],
		[ 'not strings', 3, [ 'payload' ] ],
	] )(
		'should decode the locale and the request of the generated insight to null, and keep the rest of the response, when they are %s',
		( _label, locale, payload ) => {
			const decoded = decodeBenchmarkingResponse( [
				...( benchmarkingData as unknown[] ),
				locale,
				payload,
			] );

			expect( decoded ).toEqual( {
				...decodeBenchmarkingResponse( benchmarkingData ),
				insightLocale: null,
				insightPayload: null,
			} );
		}
	);

	it( "should decode the encoder's output for an empty series without throwing", () => {
		// What Response_Encoder writes when `dailyTraffic` is empty: no first
		// date, because there is no day to write.
		const encoded = [
			1,
			[],
			null,
			[],
			[ 0, 0 ],
			[],
			[],
			[],
			[ false, false, null, false, null, false, false, false, false ],
			[],
			false,
			null,
		];

		expect( () => decodeBenchmarkingResponse( encoded ) ).not.toThrow();
		expect( decodeBenchmarkingResponse( encoded ) ).toEqual( {
			visits: { current: 0, previous: 0 },
			dailyTraffic: [],
			availability: availabilityWithoutTraffic,
			bandReferenceDays: null,
			keyFactors: [],
			steadyTraffic: false,
			contentMarkers: [],
		} );
	} );

	it( 'should decode the number of days of traffic the band is fitted on', () => {
		const encoded = [ ...( benchmarkingData as unknown[] ) ];
		encoded[ 11 ] = 364;

		expect( decodeBenchmarkingResponse( encoded ) ).toEqual( {
			...decodeBenchmarkingResponse( benchmarkingData ),
			bandReferenceDays: 364,
		} );
	} );

	it.each( [
		[ 'null', null ],
		[ '0', 0 ],
		[ 'a negative number', -7 ],
		[ 'not a whole number', 83.5 ],
		[ 'a string', '83' ],
	] )(
		'should decode the number of days of traffic the band is fitted on to null, and keep the rest of the response, when it is %s',
		( _label, bandReferenceDays ) => {
			const encoded = [ ...( benchmarkingData as unknown[] ) ];
			encoded[ 11 ] = bandReferenceDays;

			expect( decodeBenchmarkingResponse( encoded ) ).toEqual( {
				...decodeBenchmarkingResponse( benchmarkingData ),
				bandReferenceDays: null,
			} );
		}
	);

	it( 'should decode each flag of the availability from its own position', () => {
		const encoded = [ ...( benchmarkingData as unknown[] ) ];
		encoded[ 8 ] = [
			true,
			false,
			null,
			false,
			null,
			true,
			false,
			true,
			true,
		];

		expect( decodeBenchmarkingResponse( encoded )?.availability ).toEqual( {
			rangeTooShort: true,
			bandAvailable: false,
			bandAvailableFrom: null,
			keyFactorsAvailable: false,
			keyFactorsAvailableFrom: null,
			insightRequestAllowed: true,
			performanceInsightAvailable: false,
			lastYearAvailable: true,
			rangeTooLong: true,
		} );
	} );

	it.each( [
		[ null, null ],
		[ 0, '2025-08-18' ],
		[ 5, '2025-08-23' ],
		[ -26, '2025-07-23' ],
	] )(
		'should decode a day offset of %p in the availability to the day %p',
		( dayOffset, date ) => {
			const encoded = [ ...( benchmarkingData as unknown[] ) ];
			encoded[ 8 ] = [
				false,
				true,
				dayOffset,
				true,
				dayOffset,
				true,
				true,
				false,
				false,
			];

			const availability =
				decodeBenchmarkingResponse( encoded )?.availability;

			expect( availability?.bandAvailableFrom ).toBe( date );
			expect( availability?.keyFactorsAvailableFrom ).toBe( date );
		}
	);

	it.each( [
		[
			'the band',
			[ false, false, 5, false, null, false, false, false, false ],
		],
		[
			'the key factors',
			[ false, false, null, false, 5, false, false, false, false ],
		],
	] )(
		'should decode an empty series whose availability has a day for %s to null, since it has no first plotted day to count from',
		( _label, availability ) => {
			expect(
				decodeBenchmarkingResponse( [
					1,
					[],
					null,
					[],
					[ 0, 0 ],
					[],
					[],
					[],
					availability,
					[],
					false,
					null,
				] )
			).toBeNull();
		}
	);

	it.each( [
		[ 'null', null ],
		[ 'not a date', 'yesterday' ],
		[ 'not a string', 20250818 ],
	] )(
		'should decode a dated series whose first day is %s to null',
		( _label, firstDate ) => {
			expect(
				decodeBenchmarkingResponse( [
					1,
					[],
					firstDate,
					[ 132, 147 ],
					[ 412, 388 ],
					[],
					[],
					[ null, null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				] )
			).toBeNull();
		}
	);

	// A cached response written by another plugin version must not take the
	// dashboard down with it.
	it.each( [
		[ 'string table', 1 ],
		[ 'daily counts', 3 ],
		[ 'visit totals', 4 ],
		[ 'key factor cards', 5 ],
		[ 'key factor attributes', 6 ],
		[ 'expected ranges', 7 ],
		[ 'content markers', 9 ],
	] )(
		'should decode a response whose %s is not a list to null',
		( _label, member ) => {
			const encoded: unknown[] = [
				1,
				[ 'a label' ],
				'2025-08-18',
				[ 132 ],
				[ 412, 388 ],
				[ [ 0, 0, 1, 2, 3.5 ] ],
				[ [] ],
				[ [ 118.4, 183.1 ] ],
				[ false, false, 4, true, -19, true, false, false, false ],
				[],
				false,
				null,
			];

			// The response as written decodes, so only the hostile member
			// makes it unreadable.
			expect( decodeBenchmarkingResponse( encoded ) ).not.toBeNull();

			[ null, 5, 'x', {} ].forEach( ( hostile ) => {
				const broken = [ ...encoded ];
				broken[ member as number ] = hostile;

				expect( decodeBenchmarkingResponse( broken ) ).toBeNull();
			} );
		}
	);

	it.each( [
		[ 'one list of attributes more', [ [], [], [] ] ],
		[ 'one list of attributes fewer', [ [] ] ],
	] )(
		'should decode a response with %s than key factor cards to null',
		( _label, attributes ) => {
			expect(
				decodeBenchmarkingResponse( [
					1,
					[ 'a label' ],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[
						[ 0, 0, 1, 2, 3.5 ],
						[ 1, 0, 1, 2, 3.5 ],
					],
					attributes,
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				] )
			).toBeNull();
		}
	);

	it.each( [
		[ 'neither total', [] ],
		[ 'only one total', [ 5 ] ],
	] )(
		'should decode a response carrying %s to null, rather than to a missing figure',
		( _label, visitTotals ) => {
			expect(
				decodeBenchmarkingResponse( [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					visitTotals,
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				] )
			).toBeNull();
		}
	);

	it.each( [
		[ 'one entry more', [ null, null ] ],
		[ 'one entry fewer', [] ],
	] )(
		'should decode a response whose expected ranges have %s than the daily counts to null',
		( _label, expectedRanges ) => {
			expect(
				decodeBenchmarkingResponse( [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					expectedRanges,
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				] )
			).toBeNull();
		}
	);

	it.each( [
		[ 'a single number', [ 118.4 ] ],
		[ 'three numbers', [ 118.4, 183.1, 200 ] ],
		[ 'a number and a string', [ 118.4, '183.1' ] ],
		[ 'a number and null', [ 118.4, null ] ],
		[ 'a number', 118.4 ],
		[ 'an object', { expectedMin: 118.4, expectedMax: 183.1 } ],
	] )(
		'should decode a response with an expected range of %s to null',
		( _label, expectedRange ) => {
			expect(
				decodeBenchmarkingResponse( [
					1,
					[],
					'2025-08-18',
					[ 132, 147 ],
					[ 412, 388 ],
					[],
					[],
					[ null, expectedRange ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				] )
			).toBeNull();
		}
	);

	// A response cached in the layout that sent the first day with recorded
	// traffic in place of the availability must be asked for again, rather
	// than read as a site without any part of the view.
	it.each( [
		[ 'a number, as the first traffic day offset was', -26 ],
		[ 'null', null ],
		[ 'an empty list', [] ],
		[
			'a list of eight fields, as the layout without the long-range flag sent it',
			[ false, false, 4, true, -19, true, false, false ],
		],
		[
			'a list of ten fields',
			[ false, false, 4, true, -19, true, false, false, false, false ],
		],
		[
			'a list with a flag that is not a boolean',
			[ 0, false, 4, true, -19, true, false, false, false ],
		],
		[
			'a list with a day that is a fraction',
			[ false, false, 4.5, true, -19, true, false, false, false ],
		],
		[
			'a list with a day that is a string',
			[ false, false, 4, true, '-19', true, false, false, false ],
		],
		[ 'an object', { rangeTooShort: false, bandAvailable: false } ],
	] )(
		'should decode a response whose availability is %s to null',
		( _label, availability ) => {
			const encoded = [ ...( benchmarkingData as unknown[] ) ];
			encoded[ 8 ] = availability;

			expect( decodeBenchmarkingResponse( encoded ) ).toBeNull();
		}
	);

	// Destructuring a card that is not iterable throws, so a corrupt card must
	// be left out rather than read.
	it.each( [
		[ 'null', null ],
		[ 'undefined', undefined ],
		[ 'a number', 5 ],
		[ 'a string', 'xy' ],
		[ 'an object', {} ],
		[ 'a boolean', true ],
		[ 'a list of four fields', [ 0, 0, 1, 2 ] ],
	] )(
		'should leave out a key factor card that is %s, and keep the cards beside it',
		( _label, card ) => {
			const decoded = decodeBenchmarkingResponse( [
				1,
				[ 'a label' ],
				'2025-08-18',
				[ 132 ],
				[ 412, 388 ],
				[ card, [ 0, 0, 1, 2, 3.5 ] ],
				[ [], [] ],
				[ null ],
				[ false, false, null, false, null, false, false, false, false ],
				[],
				false,
				null,
			] );

			expect( decoded?.keyFactors ).toEqual( [
				{
					kind: 'CHANNEL',
					label: 'a label',
					current: 1,
					previous: 2,
					sharePct: 3.5,
					attributes: [],
				},
			] );
		}
	);

	it( 'should leave out an attribute that is not a list of five fields, and keep the attributes beside it', () => {
		const decoded = decodeBenchmarkingResponse( [
			1,
			[ 'a label' ],
			'2025-08-18',
			[ 132 ],
			[ 412, 388 ],
			[ [ 0, 0, 1, 2, 3.5 ] ],
			[ [ [ 6, 0, 1, 2 ], null, [ 6, 0, 3, 4, 5.5 ] ] ],
			[ null ],
			[ false, false, null, false, null, false, false, false, false ],
			[],
			false,
			null,
		] );

		expect( decoded?.keyFactors[ 0 ].attributes ).toEqual( [
			{
				kind: 'DEVICE',
				label: 'a label',
				current: 3,
				previous: 4,
				sharePct: 5.5,
			},
		] );
	} );

	it( 'should decode a key factor card with no attributes when its entry in the attribute lists is not a list', () => {
		const decoded = decodeBenchmarkingResponse( [
			1,
			[ 'a label' ],
			'2025-08-18',
			[ 132 ],
			[ 412, 388 ],
			[ [ 0, 0, 1, 2, 3.5 ] ],
			[ 'not a list' ],
			[ null ],
			[ false, false, null, false, null, false, false, false, false ],
			[],
			false,
			null,
		] );

		expect( decoded?.keyFactors ).toEqual( [
			{
				kind: 'CHANNEL',
				label: 'a label',
				current: 1,
				previous: 2,
				sharePct: 3.5,
				attributes: [],
			},
		] );
	} );

	it( 'should decode every kind index to its kind, in the order of the driver kinds and of the attribute kinds', () => {
		const decoded = decodeBenchmarkingResponse( [
			1,
			[ 'a label' ],
			'2025-08-18',
			[ 1 ],
			[ 1, 1 ],
			[ 0, 1, 2, 3, 4, 5 ].map( ( kind ) => [ kind, 0, 1, 2, 3.5 ] ),
			[
				[ 0, 1, 2, 3, 4, 5, 6, 7, 8 ].map( ( kind ) => [
					kind,
					0,
					1,
					2,
					3.5,
				] ),
				[],
				[],
				[],
				[],
				[],
			],
			[ null ],
			[ false, false, null, false, null, false, false, false, false ],
			[],
			false,
			null,
		] );

		expect( decoded?.keyFactors.map( ( { kind } ) => kind ) ).toEqual( [
			'CHANNEL',
			'CONTENT',
			'SEARCH_KEYWORD',
			'REFERRING_SITE',
			'CAMPAIGN',
			'CHANNEL_GROUP',
		] );
		expect(
			decoded?.keyFactors[ 0 ].attributes.map( ( { kind } ) => kind )
		).toEqual( [
			'TRAFFIC_CHANNEL',
			'LANDING_PAGE',
			'SEARCH_KEYWORD',
			'REFERRING_SITE',
			'PLATFORM',
			'CAMPAIGN',
			'DEVICE',
			'USER_TYPE',
			'ASSISTANT',
		] );
	} );

	it( 'should leave out a key factor card or an attribute whose kind index it does not know, and decode the rest', () => {
		const decoded = decodeBenchmarkingResponse( [
			1,
			[ 'Facebook', '/how-to-plant-garlic/', 'Organic Search' ],
			'2025-08-18',
			[ 132 ],
			[ 412, 388 ],
			[
				[ 9, 0, 96, 31, 21.4 ],
				[ 'length', 0, 96, 31, 21.4 ],
				[ 0, 2, 210, 222, 40.3 ],
			],
			[
				[ [ 6, 0, 71, 20, 16.8 ] ],
				[],
				[
					[ 9, 0, 1, 1, 0.5 ],
					[ 1, 1, 58, 12, 15.1 ],
				],
			],
			[ null ],
			[ false, false, null, false, null, false, false, false, false ],
			[],
			false,
			null,
		] );

		// Both cards with an unknown kind are left out with their own
		// attributes, so the `CHANNEL` card still gets the attributes at its
		// own position.
		expect( decoded?.keyFactors ).toEqual( [
			{
				kind: 'CHANNEL',
				label: 'Organic Search',
				current: 210,
				previous: 222,
				sharePct: 40.3,
				attributes: [
					{
						kind: 'LANDING_PAGE',
						label: '/how-to-plant-garlic/',
						current: 58,
						previous: 12,
						sharePct: 15.1,
					},
				],
			},
		] );
	} );

	it( "should read the path of a post's card, and of no other card", () => {
		const decoded = decodeBenchmarkingResponse( [
			1,
			[ 'How to plant garlic', '/how-to-plant-garlic/', 'Direct' ],
			'2025-08-18',
			[ 132 ],
			[ 412, 388 ],
			[
				[ 1, 0, 64, 0, 86.7, 1 ],
				// A path out of the string table is no path.
				[ 1, 0, 64, 0, 86.7, 9 ],
				// Only a post's card carries a path.
				[ 0, 2, 500, 480, 12.5, 1 ],
			],
			[ [], [], [] ],
			[ null ],
			[ false, false, null, false, null, false, false, false, false ],
			[],
			false,
			null,
		] );

		expect(
			decoded?.keyFactors.map( ( { kind, url } ) => ( { kind, url } ) )
		).toEqual( [
			{ kind: 'CONTENT', url: '/how-to-plant-garlic/' },
			{ kind: 'CONTENT', url: undefined },
			{ kind: 'CHANNEL', url: undefined },
		] );
		expect( decoded?.keyFactors[ 1 ] ).not.toHaveProperty( 'url' );
	} );

	/**
	 * Decodes a response with the given cards and their attributes, and the
	 * given strings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array} strings    The string table.
	 * @param {Array} cards      The encoded cards.
	 * @param {Array} attributes One list of encoded attributes per card.
	 * @return {Array} The decoded cards.
	 */
	function decodeKeyFactors(
		strings: string[],
		cards: unknown[],
		attributes: unknown[] = cards.map( () => [] )
	) {
		return decodeBenchmarkingResponse( [
			1,
			strings,
			'2025-08-18',
			[ 132 ],
			[ 412, 388 ],
			cards,
			attributes,
			[ null ],
			[ false, false, null, false, null, false, false, false, false ],
			[],
			false,
			null,
		] )?.keyFactors;
	}

	it( 'should decode the basis of each card’s share from its position, after the path', () => {
		const keyFactors = decodeKeyFactors(
			[ 'Direct' ],
			[ 0, 1, 2, 3, 4 ].map( ( basis ) => [
				0,
				0,
				500,
				480,
				12.5,
				null,
				basis,
			] )
		);

		expect( keyFactors?.map( ( { shareBasis } ) => shareBasis ) ).toEqual( [
			'GROSS_CHANGE',
			'NET_CHANGE',
			'SITE_TRAFFIC',
			'VOLUME',
			'PARENT_CHANNEL',
		] );
	} );

	it.each( [
		[ 'it carries none', [ 0, 0, 500, 480, 12.5 ] ],
		[ 'its index is unknown', [ 0, 0, 500, 480, 12.5, null, 9 ] ],
		[
			'its index is not a number',
			[ 0, 0, 500, 480, 12.5, null, 'length' ],
		],
	] )(
		'should decode a card without a basis when %s, and keep the card',
		( _, card ) => {
			const keyFactors = decodeKeyFactors( [ 'Direct' ], [ card ] );

			expect( keyFactors ).toHaveLength( 1 );
			expect( keyFactors?.[ 0 ] ).not.toHaveProperty( 'shareBasis' );
		}
	);

	it( 'should decode the channel a card on `PARENT_CHANNEL` took the place of, and of no other card', () => {
		const keyFactors = decodeKeyFactors(
			[ 'news.example', 'Referral' ],
			[
				[ 3, 0, 220, 0, 73.3, null, 4, 1, 300 ],
				// Only a share of a channel's change names the channel.
				[ 3, 0, 220, 0, 73.3, null, 0, 1, 300 ],
			]
		);

		expect( keyFactors?.[ 0 ] ).toEqual( {
			kind: 'REFERRING_SITE',
			label: 'news.example',
			current: 220,
			previous: 0,
			sharePct: 73.3,
			shareBasis: 'PARENT_CHANNEL',
			parentChannel: { label: 'Referral', change: 300 },
			attributes: [],
		} );
		expect( keyFactors?.[ 1 ] ).not.toHaveProperty( 'parentChannel' );
	} );

	it.each( [
		[ 'the channel is out of the string table', [ 9, 300 ] ],
		[ 'the change is not a whole number', [ 1, '300' ] ],
		[ 'the change is missing', [ 1 ] ],
	] )(
		'should decode a card on `PARENT_CHANNEL` without its channel when %s, and keep the card',
		( _, parent ) => {
			const keyFactors = decodeKeyFactors(
				[ 'news.example', 'Referral' ],
				[ [ 3, 0, 220, 0, 73.3, null, 4, ...parent ] ]
			);

			expect( keyFactors?.[ 0 ] ).toMatchObject( {
				label: 'news.example',
				shareBasis: 'PARENT_CHANNEL',
			} );
			expect( keyFactors?.[ 0 ] ).not.toHaveProperty( 'parentChannel' );
		}
	);

	it( 'should mark only a card that carries `true` after its parent channel as spread across many pages', () => {
		const keyFactors = decodeKeyFactors(
			[ 'Organic Search' ],
			[
				[ 0, 0, 1420, 1251, 71.6, null, 0, null, null, true ],
				[ 0, 0, 1420, 1251, 71.6, null, 0 ],
				[ 0, 0, 1420, 1251, 71.6, null, 0, null, null, 1 ],
			]
		);

		expect( keyFactors?.[ 0 ] ).toEqual( {
			kind: 'CHANNEL',
			label: 'Organic Search',
			current: 1420,
			previous: 1251,
			sharePct: 71.6,
			shareBasis: 'GROSS_CHANGE',
			spreadAcrossPages: true,
			attributes: [],
		} );
		expect( keyFactors?.[ 1 ] ).not.toHaveProperty( 'spreadAcrossPages' );
		expect( keyFactors?.[ 2 ] ).not.toHaveProperty( 'spreadAcrossPages' );
	} );

	it( 'should mark only an attribute that carries `true` after its share as oversized', () => {
		const keyFactors = decodeKeyFactors(
			[ 'Direct', 'desktop', 'mobile' ],
			[ [ 0, 0, 3280, 2000, 64.5, null, 0 ] ],
			[
				[
					[ 6, 1, 2643, 1000, 0, true ],
					[ 6, 2, 638, 1000, 0 ],
					[ 6, 2, 638, 1000, 0, 1 ],
				],
			]
		);

		expect(
			keyFactors?.[ 0 ].attributes.map( ( { oversized } ) => oversized )
		).toEqual( [ true, undefined, undefined ] );
		expect( keyFactors?.[ 0 ].attributes[ 1 ] ).not.toHaveProperty(
			'oversized'
		);
	} );

	describe( 'content markers', () => {
		/**
		 * Decodes a response whose first plotted day is `2025-08-18`, with the
		 * given content markers.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Array} contentMarkers The encoded content markers.
		 * @return {Array|undefined} The decoded content markers.
		 */
		function decodeContentMarkers( contentMarkers: unknown ) {
			return decodeBenchmarkingResponse( [
				1,
				[
					'How to plant garlic',
					'/how-to-plant-garlic/',
					'Storing garlic',
					'/storing-garlic/',
				],
				'2025-08-18',
				[ 132, 0, 147, 96 ],
				[ 412, 388 ],
				[],
				[],
				[ null, null, null, null ],
				[ false, false, null, false, null, false, false, false, false ],
				contentMarkers,
				false,
				null,
			] )?.contentMarkers;
		}

		it( 'should date each marker from the first plotted day, and list its posts in order', () => {
			expect(
				decodeContentMarkers( [
					[ 0, [ 0, 1 ] ],
					[ 3, [ 2, 3 ], [ 0, 1 ] ],
				] )
			).toEqual( [
				{
					date: '2025-08-18',
					posts: [
						{
							title: 'How to plant garlic',
							url: '/how-to-plant-garlic/',
						},
					],
				},
				{
					date: '2025-08-21',
					posts: [
						{ title: 'Storing garlic', url: '/storing-garlic/' },
						{
							title: 'How to plant garlic',
							url: '/how-to-plant-garlic/',
						},
					],
				},
			] );
		} );

		it.each( [
			[ 'null', null ],
			[ 'a number', 5 ],
			[ 'an empty list', [] ],
			[ 'a list whose day is a fraction', [ 1.5, [ 0, 1 ] ] ],
			[ 'a list whose day is a string', [ '1', [ 0, 1 ] ] ],
			[ 'a day with no posts', [ 1 ] ],
		] )(
			'should leave out a marker that is %s, and keep the markers beside it',
			( _label, marker ) => {
				expect(
					decodeContentMarkers( [ marker, [ 2, [ 0, 1 ] ] ] )
				).toEqual( [
					{
						date: '2025-08-20',
						posts: [
							{
								title: 'How to plant garlic',
								url: '/how-to-plant-garlic/',
							},
						],
					},
				] );
			}
		);

		it.each( [
			[ 'null', null ],
			[ 'a single position', [ 0 ] ],
			[ 'three positions', [ 0, 1, 2 ] ],
			[ 'a title the string table does not hold', [ 9, 1 ] ],
			[ 'a null path', [ 0, null ] ],
		] )(
			'should leave out a post that is %s, and keep the posts beside it',
			( _label, post ) => {
				expect(
					decodeContentMarkers( [ [ 1, post, [ 2, 3 ] ] ] )
				).toEqual( [
					{
						date: '2025-08-19',
						posts: [
							{
								title: 'Storing garlic',
								url: '/storing-garlic/',
							},
						],
					},
				] );
			}
		);

		it( 'should leave out a marker none of whose posts can be read', () => {
			expect( decodeContentMarkers( [ [ 1, null, [ 9, 9 ] ] ] ) ).toEqual(
				[]
			);
		} );

		it( 'should decode no markers for an empty series, since it has no first plotted day to count from', () => {
			expect(
				decodeBenchmarkingResponse( [
					1,
					[ 'How to plant garlic', '/how-to-plant-garlic/' ],
					null,
					[],
					[ 0, 0 ],
					[],
					[],
					[],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[ [ 0, [ 0, 1 ] ] ],
					false,
					null,
				] )?.contentMarkers
			).toEqual( [] );
		} );
	} );
} );
