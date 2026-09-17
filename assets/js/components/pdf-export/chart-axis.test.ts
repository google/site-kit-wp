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
	formatShortValue,
	getValueAxisGutter,
	pickDateTicks,
} from './chart-axis';

/**
 * The dates of a 28 day report.
 */
const DATES = Array.from(
	{ length: 28 },
	( _, index ) => new Date( 2026, 6, 1 + index )
);

describe( 'formatShortValue', () => {
	it.each( [
		[ 0, '0' ],
		[ 58, '58' ],
		[ 999, '999' ],
		[ 1000, '1K' ],
		[ 5500, '5.5K' ],
		[ 58000, '58K' ],
		[ 1200000, '1.2M' ],
		[ 3200000000, '3.2B' ],
		[ 4400000000000, '4.4T' ],
	] )( 'shortens %p to "%s"', ( value, expected ) => {
		expect( formatShortValue( value ) ).toBe( expected );
	} );

	it.each( [
		[ 0.5, '0.5' ],
		[ 0.25, '0.25' ],
		[ 0.0642, '0.064' ],
		[ 0.002, '0.002' ],
	] )( 'keeps two significant digits of %p, as "%s"', ( value, expected ) => {
		expect( formatShortValue( value ) ).toBe( expected );
	} );

	it( 'keeps the sign of a negative value', () => {
		expect( formatShortValue( -58000 ) ).toBe( '-58K' );
	} );
} );

describe( 'getValueAxisGutter', () => {
	it.each( [
		// `900` and `58K` are both three characters, so shortening keeps a
		// large maximum in the same width as a small one.
		[ 900, 59 ],
		[ 58000, 59 ],
		[ 1234567, 76 ],
	] )(
		'reserves the width the labels need for a maximum of %p',
		( maxValue, expected ) => {
			expect( getValueAxisGutter( maxValue, 28 ) ).toBe( expected );
		}
	);

	it( 'measures the quarter values, not the maximum alone', () => {
		// The maximum shortens to the two characters of `1M`, while its
		// quarters need the four of `750K`.
		expect( getValueAxisGutter( 1000000, 28 ) ).toBe( 76 );
	} );

	it( 'reserves room for the decimals a small ratio needs', () => {
		// An AdSense page CTR peaking at `0.121` draws a `0.12` label for the
		// maximum. Three quarters of it needs the five characters of `0.091`,
		// so the gutter has to fit that instead.
		expect( getValueAxisGutter( 0.121, 28 ) ).toBe( 93 );
	} );

	it( 'keeps less space free at a smaller font size', () => {
		expect( getValueAxisGutter( 900, 14 ) ).toBe( 30 );
	} );
} );

describe( 'pickDateTicks', () => {
	it( 'starts and ends far enough in for a whole label to fit', () => {
		const ticks = pickDateTicks( DATES, 4000, 28 );

		expect( ticks ).toHaveLength( 26 );
		expect( ticks[ 0 ] ).toEqual( DATES[ 1 ] );
		expect( ticks[ 25 ] ).toEqual( DATES[ 26 ] );
	} );

	it( 'skips more dates at each end when the dates sit closer together', () => {
		// A 90 day range packs its dates into the same width, so the second
		// date is too near the left edge for a label centered on it.
		const ninetyDays = Array.from(
			{ length: 90 },
			( _, index ) => new Date( 2026, 4, 26 + index )
		);
		const ticks = pickDateTicks( ninetyDays, 1949, 28 );

		expect( ticks[ 0 ] ).toEqual( ninetyDays[ 3 ] );
		expect( ticks[ ticks.length - 1 ] ).toEqual( ninetyDays[ 81 ] );
	} );

	it.each( [
		[ 2000, 13 ],
		[ 600, 5 ],
		[ 300, 2 ],
	] )(
		'keeps fewer dates to fit a plot %p pixels wide',
		( plotWidth, expected ) => {
			expect( pickDateTicks( DATES, plotWidth, 28 ) ).toHaveLength(
				expected
			);
		}
	);

	it( 'keeps two dates however narrow the plot is', () => {
		expect( pickDateTicks( DATES, 10, 28 ) ).toHaveLength( 2 );
	} );

	it( 'returns nothing for a range too short to inset', () => {
		expect( pickDateTicks( DATES.slice( 0, 2 ), 4000, 28 ) ).toEqual( [] );
	} );
} );
