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
import { decodeBenchmarkingResponse } from './decodeBenchmarkingResponse';

describe( 'decodeBenchmarkingResponse', () => {
	it( 'decodes the checked-in response to the four fields', () => {
		expect( decodeBenchmarkingResponse( benchmarkingData ) ).toEqual( {
			visitors: { current: 412, previous: 388 },
			dailyTraffic: [
				{ date: '2025-08-18', visitors: 132 },
				{ date: '2025-08-19', visitors: 0 },
				{ date: '2025-08-20', visitors: 147 },
				{ date: '2025-08-21', visitors: 96 },
			],
			dimensions: [
				'CONTENT',
				'SEARCH_QUERIES',
				'REFERRERS',
				'CHANNELS',
			],
			contextualData: {
				content: [
					{
						url: '/how-to-plant-garlic/',
						title: 'How to plant garlic',
						visitors: 96,
						publishedDaysAgo: 14,
					},
					{
						url: '/mulching-in-autumn/',
						title: null,
						visitors: 0,
						publishedDaysAgo: 3,
					},
				],
				searchQueries: [
					{
						label: 'how to plant garlic',
						current: 74,
						previous: 31,
						positionCurrent: 8.4,
						positionPrevious: 14.2,
					},
					{
						label: 'mulching',
						current: 12,
						previous: 0,
						positionCurrent: 3.5,
						positionPrevious: null,
					},
				],
				referrers: [
					{
						label: 'garden.example.com',
						current: 58,
						previous: 44,
					},
					{
						label: '/how-to-plant-garlic/',
						current: 21,
						previous: 19,
					},
				],
				channels: [
					{ label: 'Organic Search', current: 210, previous: 168 },
					{ label: 'Direct', current: 132, previous: 120 },
				],
			},
		} );
	} );

	it( 'dates a thirteen-month series from its first day, with no day missing', () => {
		const dailyVisitors = new Array( 395 ).fill( 1 );
		dailyVisitors[ 200 ] = 0;

		const decoded = decodeBenchmarkingResponse( [
			1,
			[],
			'2025-08-18',
			dailyVisitors,
			[ 0, 0 ],
			{},
			[],
		] );
		const dates = decoded?.dailyTraffic.map( ( { date } ) => date ) ?? [];

		expect( dates ).toHaveLength( 395 );
		expect( new Set( dates ).size ).toBe( 395 );
		expect( dates[ 0 ] ).toBe( '2025-08-18' );
		expect( dates[ dates.length - 1 ] ).toBe( '2026-09-16' );
		// The zero day keeps its own date rather than being skipped.
		expect( decoded?.dailyTraffic[ 200 ] ).toEqual( {
			date: '2026-03-06',
			visitors: 0,
		} );
	} );

	it( 'gives two rows that point at one string-table index the same string', () => {
		const decoded = decodeBenchmarkingResponse( benchmarkingData );

		expect( decoded?.contextualData.referrers?.[ 1 ].label ).toBe(
			decoded?.contextualData.content?.[ 0 ].url
		);
	} );

	it( 'decodes a string index the table does not hold to null, not undefined', () => {
		const decoded = decodeBenchmarkingResponse( [
			1,
			[ 'Organic Search' ],
			'2025-08-18',
			[ 132 ],
			[ 412, 388 ],
			{ 0: [ [ 9, 210, 168 ] ] },
			[ 0 ],
		] );

		expect( decoded?.contextualData.channels?.[ 0 ].label ).toBeNull();
	} );

	it( 'decodes a null string field to null', () => {
		const decoded = decodeBenchmarkingResponse( benchmarkingData );

		expect( decoded?.contextualData.content?.[ 1 ].title ).toBeNull();
	} );

	it( 'returns every number as it arrives', () => {
		const decoded = decodeBenchmarkingResponse( benchmarkingData );

		expect(
			decoded?.contextualData.searchQueries?.[ 0 ].positionCurrent
		).toBe( 8.4 );
		expect( decoded?.contextualData.content?.[ 1 ].visitors ).toBe( 0 );
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

	it( "decodes the encoder's output for an empty series without throwing", () => {
		// What Response_Encoder writes when `dailyTraffic` is empty: no first
		// date, because there is no day to write.
		const encoded = [ 1, [], null, [], [ 0, 0 ], {}, [] ];

		expect( () => decodeBenchmarkingResponse( encoded ) ).not.toThrow();
		expect( decodeBenchmarkingResponse( encoded ) ).toEqual( {
			visitors: { current: 0, previous: 0 },
			dailyTraffic: [],
			dimensions: [],
			contextualData: {},
		} );
	} );

	it.each( [
		[ 'null', null ],
		[ 'not a date', 'yesterday' ],
		[ 'not a string', 20250818 ],
	] )(
		'decodes a dated series whose first day is %s to null',
		( _label, firstDate ) => {
			expect(
				decodeBenchmarkingResponse( [
					1,
					[],
					firstDate,
					[ 132, 147 ],
					[ 412, 388 ],
					{},
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
		[ 'visitor totals', 4 ],
		[ 'dimension order', 6 ],
	] )(
		'decodes a response whose %s is not a list to null',
		( _label, member ) => {
			const encoded: unknown[] = [
				1,
				[ 'a label' ],
				'2025-08-18',
				[ 132 ],
				[ 412, 388 ],
				{ 0: [ [ 0, 1, 2 ] ] },
				[ 0 ],
			];

			[ null, 5, 'x', {} ].forEach( ( hostile ) => {
				const broken = [ ...encoded ];
				broken[ member as number ] = hostile;

				expect( decodeBenchmarkingResponse( broken ) ).toBeNull();
			} );
		}
	);

	it.each( [
		[ 'neither total', [] ],
		[ 'only one total', [ 5 ] ],
	] )(
		'decodes a response carrying %s to null, rather than to a missing figure',
		( _label, visitorTotals ) => {
			expect(
				decodeBenchmarkingResponse( [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					visitorTotals,
					{},
					[],
				] )
			).toBeNull();
		}
	);

	it( 'decodes a dimension whose rows are not a list to no rows', () => {
		const decoded = decodeBenchmarkingResponse( [
			1,
			[ 'a label' ],
			'2025-08-18',
			[ 132 ],
			[ 412, 388 ],
			// The order names one dimension; its rows are not a list.
			{ 0: 'not a list' },
			[ 0 ],
		] );

		expect( decoded?.contextualData ).toEqual( { channels: [] } );
	} );

	it( 'decodes every dimension code to its own contextual data key', () => {
		const decoded = decodeBenchmarkingResponse( [
			1,
			[ 'a label' ],
			'2025-08-18',
			[ 1 ],
			[ 1, 1 ],
			{
				0: [ [ 0, 1, 2 ] ],
				1: [ [ 0, 1, 2 ] ],
				2: [ [ 0, 1, 2 ] ],
				3: [ [ 0, 1, 2 ] ],
				4: [ [ 0, 1, 2, 3.5, 4.5 ] ],
				5: [ [ 0, 0, 1, 2 ] ],
				6: [ [ 0, 1, 2 ] ],
			},
			[ 0, 1, 2, 3, 4, 5, 6 ],
		] );

		expect( decoded?.dimensions ).toEqual( [
			'CHANNELS',
			'DEVICES',
			'VISITOR_MIX',
			'REFERRERS',
			'SEARCH_QUERIES',
			'CONTENT',
			'CATEGORIES',
		] );
		expect( Object.keys( decoded?.contextualData ?? {} ) ).toEqual( [
			'channels',
			'devices',
			'visitorMix',
			'referrers',
			'searchQueries',
			'content',
			'categories',
		] );
	} );

	it( 'drops a dimension index it does not know, and decodes the rest', () => {
		const decoded = decodeBenchmarkingResponse( [
			1,
			[ 'Organic Search' ],
			'2025-08-18',
			[ 132 ],
			[ 412, 388 ],
			{
				0: [ [ 0, 210, 168 ] ],
				9: [ [ 0, 1, 1 ] ],
			},
			[ 9, 0 ],
		] );

		expect( decoded?.dimensions ).toEqual( [ 'CHANNELS' ] );
		expect( decoded?.contextualData ).toEqual( {
			channels: [
				{ label: 'Organic Search', current: 210, previous: 168 },
			],
		} );
	} );
} );
