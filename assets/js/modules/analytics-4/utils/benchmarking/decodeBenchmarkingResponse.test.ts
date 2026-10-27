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
import benchmarkingData from '@/js/modules/analytics-4/datastore/__fixtures__/benchmarking-data.json';
import { provideTimezone } from '@tests/js/test-utils';
import { decodeBenchmarkingResponse } from './decodeBenchmarkingResponse';

describe( 'decodeBenchmarkingResponse', () => {
	it( 'should decode the checked-in response to `visits`, `dailyTraffic`, and `keyFactors`', () => {
		expect( decodeBenchmarkingResponse( benchmarkingData ) ).toEqual( {
			visits: { current: 412, previous: 388 },
			dailyTraffic: [
				{ date: '2025-08-18', visits: 132 },
				{ date: '2025-08-19', visits: 0 },
				{ date: '2025-08-20', visits: 147 },
				{ date: '2025-08-21', visits: 96 },
			],
			keyFactors: [
				{
					kind: 'REFERRING_SITE',
					label: 'Facebook',
					current: 96,
					previous: 31,
					sharePct: 21.4,
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
							previous: 20,
							sharePct: 16.8,
						},
					],
				},
				{
					kind: 'CHANNEL',
					label: 'Organic Search',
					current: 210,
					previous: 222,
					sharePct: 40.3,
					attributes: [],
				},
				{
					kind: 'CONTENT',
					label: '/how-to-plant-garlic/',
					current: 64,
					previous: 15,
					sharePct: 12.6,
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
			} );
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
		] );

		expect( decoded?.keyFactors[ 0 ].label ).toBeNull();
	} );

	it( 'decodes a response whose version it was not written against to null', () => {
		const [ , ...members ] = benchmarkingData as unknown[];

		expect( decodeBenchmarkingResponse( [ 2, ...members ] ) ).toBeNull();
	} );

	it.each( [
		[ 'a response that is not an array', { version: 1 } ],
		[ 'a response of fewer than seven members', [ 1, [], '2025-08-18' ] ],
		[
			'a response of more than seven members',
			[ ...( benchmarkingData as unknown[] ), [] ],
		],
	] )( 'decodes %s to null', ( _label, encoded ) => {
		expect( decodeBenchmarkingResponse( encoded ) ).toBeNull();
	} );

	it( "should decode the encoder's output for an empty series without throwing", () => {
		// What Response_Encoder writes when `dailyTraffic` is empty: no first
		// date, because there is no day to write.
		const encoded = [ 1, [], null, [], [ 0, 0 ], [], [] ];

		expect( () => decodeBenchmarkingResponse( encoded ) ).not.toThrow();
		expect( decodeBenchmarkingResponse( encoded ) ).toEqual( {
			visits: { current: 0, previous: 0 },
			dailyTraffic: [],
			keyFactors: [],
		} );
	} );

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
			];

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
				] )
			).toBeNull();
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
			[ 0, 1, 2, 3, 4 ].map( ( kind ) => [ kind, 0, 1, 2, 3.5 ] ),
			[
				[ 0, 1, 2, 3, 4, 5, 6, 7 ].map( ( kind ) => [
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
			],
		] );

		expect( decoded?.keyFactors.map( ( { kind } ) => kind ) ).toEqual( [
			'CHANNEL',
			'CONTENT',
			'SEARCH_KEYWORD',
			'REFERRING_SITE',
			'CAMPAIGN',
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
} );
