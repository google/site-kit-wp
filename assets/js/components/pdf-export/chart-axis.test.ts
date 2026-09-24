/**
 * PDF chart axis tests.
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
	getValueAxisFormat,
	getValueAxisGutter,
	pickDateTicks,
} from './chart-axis';

describe( 'getValueAxisFormat', () => {
	it( 'returns the short format for a highest value of 100', () => {
		expect( getValueAxisFormat( 100 ) ).toBe( 'short' );
	} );

	it( 'keeps the default format for a highest value of 99', () => {
		expect( getValueAxisFormat( 99 ) ).toBeUndefined();
	} );
} );

describe( 'getValueAxisGutter', () => {
	it( 'returns 45 pixels at a font size of 14 for a highest value of 58,000', () => {
		expect( getValueAxisGutter( 58000, 14 ) ).toBe( 45 );
	} );

	it( 'returns the same 45 pixels for a chart with no data', () => {
		expect( getValueAxisGutter( 0, 14 ) ).toBe( 45 );
	} );

	it( 'adds a digit for each zero after the decimal point, as in 0.05 and 0.004', () => {
		expect( getValueAxisGutter( 0.05, 14 ) ).toBe( 55 );
		expect( getValueAxisGutter( 0.004, 14 ) ).toBe( 65 );
	} );

	it( 'returns 90 pixels at a font size of 28', () => {
		expect( getValueAxisGutter( 58000, 28 ) ).toBe( 90 );
	} );
} );

// 1918 and 28 are the chart area width and the font size of a Search Console
// chart.
describe( 'pickDateTicks', () => {
	it( 'labels every date for a week', () => {
		const dates = Array.from(
			{ length: 7 },
			( _date, index ) => new Date( 2026, 6, 1 + index )
		);

		expect(
			pickDateTicks( dates, 1918, 28 ).map( ( { f } ) => f )
		).toEqual( [
			'Jul 1',
			'Jul 2',
			'Jul 3',
			'Jul 4',
			'Jul 5',
			'Jul 6',
			'Jul 7',
		] );
	} );

	it( 'puts the first label flush with the start of the chart area', () => {
		const dates = Array.from(
			{ length: 7 },
			( _date, index ) => new Date( 2026, 6, 1 + index )
		);

		// `Jul 1` is 56 pixels wide, so the middle of its label sits 28 pixels,
		// about 2 hours on the axis, after the start.
		expect( pickDateTicks( dates, 1918, 28 )[ 0 ] ).toEqual( {
			v: new Date( 2026, 6, 1, 2, 6, 30, 586 ),
			f: 'Jul 1',
		} );
	} );

	it( 'puts the last label flush with the end of the chart area', () => {
		const dates = Array.from(
			{ length: 7 },
			( _date, index ) => new Date( 2026, 6, 1 + index )
		);

		// `Jul 7` is 59 pixels wide, so the middle of its label sits 29 pixels,
		// about 2 hours on the axis, before the end.
		expect( pickDateTicks( dates, 1918, 28 )[ 6 ] ).toEqual( {
			v: new Date( 2026, 6, 6, 21, 47, 37, 506 ),
			f: 'Jul 7',
		} );
	} );

	it( 'labels every third date, from the first date to the last, for 28 days', () => {
		const dates = Array.from(
			{ length: 28 },
			( _date, index ) => new Date( 2026, 6, 1 + index )
		);

		expect(
			pickDateTicks( dates, 1918, 28 ).map( ( { f } ) => f )
		).toEqual( [
			'Jul 1',
			'Jul 4',
			'Jul 7',
			'Jul 10',
			'Jul 13',
			'Jul 16',
			'Jul 19',
			'Jul 22',
			'Jul 25',
			'Jul 28',
		] );
	} );

	it( 'labels every sixth date, in the middle between the first and last labels, for 90 days', () => {
		const dates = Array.from(
			{ length: 90 },
			( _date, index ) => new Date( 2026, 4, 1 + index )
		);

		expect(
			pickDateTicks( dates, 1918, 28 ).map( ( { f } ) => f )
		).toEqual( [
			'May 1',
			'May 9',
			'May 15',
			'May 21',
			'May 27',
			'Jun 2',
			'Jun 8',
			'Jun 14',
			'Jun 20',
			'Jun 26',
			'Jul 2',
			'Jul 8',
			'Jul 14',
			'Jul 20',
			'Jul 29',
		] );
	} );

	it( "keeps a label's space between two labels when dates are missing", () => {
		// Jul 12 to Jul 27 are missing, so the first 11 dates sit close together.
		const dates = [
			...Array.from(
				{ length: 11 },
				( _date, index ) => new Date( 2026, 6, 1 + index )
			),
			new Date( 2026, 6, 28 ),
		];

		expect(
			pickDateTicks( dates, 1918, 28 ).map( ( { f } ) => f )
		).toEqual( [ 'Jul 1', 'Jul 4', 'Jul 6', 'Jul 8', 'Jul 10', 'Jul 28' ] );
	} );

	it( 'labels a single date where it falls', () => {
		expect( pickDateTicks( [ new Date( 2026, 6, 1 ) ], 1918, 28 ) ).toEqual(
			[ { v: new Date( 2026, 6, 1 ), f: 'Jul 1' } ]
		);
	} );
} );
