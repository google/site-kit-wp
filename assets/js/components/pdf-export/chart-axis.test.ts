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
import { mockChartAxisLabels } from './test-utils';

let formatterMocks: ReturnType< typeof mockChartAxisLabels >;

beforeEach( () => {
	formatterMocks = mockChartAxisLabels();
	( global as unknown as { google?: unknown } ).google = {
		visualization: formatterMocks,
	};
} );

afterEach( () => {
	jest.restoreAllMocks();
	delete ( global as unknown as { google?: unknown } ).google;
} );

describe( 'getValueAxisFormat', () => {
	it( 'returns the `short` format for a highest value of 100', () => {
		expect( getValueAxisFormat( 100 ) ).toBe( 'short' );
	} );

	it( 'returns the default format for a highest value of 99', () => {
		expect( getValueAxisFormat( 99 ) ).toBeUndefined();
	} );
} );

describe( 'getValueAxisGutter', () => {
	it( 'returns 45 pixels for a highest value of 58,000 at a font size of 14', () => {
		expect( getValueAxisGutter( 58000, 14 ) ).toBe( 45 );
	} );

	it( 'returns 45 pixels for a chart with no data', () => {
		expect( getValueAxisGutter( 0, 14 ) ).toBe( 45 );
	} );

	it( "adds one digit's width for each zero right after the decimal point", () => {
		expect( getValueAxisGutter( 0.05, 14 ) ).toBe( 55 );
		expect( getValueAxisGutter( 0.004, 14 ) ).toBe( 65 );
	} );

	it( 'returns 90 pixels for a font size of 28', () => {
		expect( getValueAxisGutter( 58000, 28 ) ).toBe( 90 );
	} );

	it( 'makes the gutter wider for German, which writes 400,000 in full as `400.000`', () => {
		formatterMocks.NumberFormat.mockImplementation( () => ( {
			formatValue: ( value: number ) => value.toLocaleString( 'de-DE' ),
		} ) );

		// The widest labels, such as `500.000`, are 49 pixels wide, plus a
		// 6.3-pixel gap.
		expect( getValueAxisGutter( 400000, 14 ) ).toBe( 56 );
	} );

	it( 'measures the value labels in the `short` format for a highest value of 100 or more', () => {
		getValueAxisGutter( 58000, 14 );

		expect( formatterMocks.NumberFormat ).toHaveBeenCalledTimes( 1 );
		expect( formatterMocks.NumberFormat ).toHaveBeenCalledWith( {
			pattern: 'short',
		} );
	} );

	it( 'throws when the canvas returns no 2D context', () => {
		jest.spyOn(
			global.HTMLCanvasElement.prototype,
			'getContext'
		).mockReturnValue( null );

		expect( () => getValueAxisGutter( 58000, 14 ) ).toThrow(
			'2D canvas context'
		);
	} );
} );

// `1918` and `28` are the chart area width and the font size of a Search
// Console chart.
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

	it( 'writes each label in the `MMM d` pattern of the dashboard charts', () => {
		pickDateTicks( [ new Date( 2026, 6, 1 ) ], 1918, 28 );

		expect( formatterMocks.DateFormat ).toHaveBeenCalledTimes( 1 );
		expect( formatterMocks.DateFormat ).toHaveBeenCalledWith( {
			pattern: 'MMM d',
		} );
	} );

	it( 'starts the first label at the left edge of the chart area', () => {
		const dates = Array.from(
			{ length: 7 },
			( _date, index ) => new Date( 2026, 6, 1 + index )
		);

		// `mockChartAxisLabels()` measures `Jul 1` as 70 pixels wide. So the label's
		// middle is 35 pixels from the left edge, about 2.6 hours after the first
		// date on the axis.
		expect( pickDateTicks( dates, 1918, 28 )[ 0 ] ).toEqual( {
			v: new Date( 2026, 6, 1, 2, 37, 39, 854 ),
			f: 'Jul 1',
		} );
	} );

	it( 'ends the last label at the right edge of the chart area', () => {
		const dates = Array.from(
			{ length: 7 },
			( _date, index ) => new Date( 2026, 6, 1 + index )
		);

		// `mockChartAxisLabels()` measures `Jul 7` as 70 pixels wide. So the label's
		// middle is 35 pixels from the right edge, about 2.6 hours before the last
		// date on the axis.
		expect( pickDateTicks( dates, 1918, 28 )[ 6 ] ).toEqual( {
			v: new Date( 2026, 6, 6, 21, 22, 20, 145 ),
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

	it( 'skips a label that would be too near the one before it, when dates are missing', () => {
		// Jul 12 to Jul 27 are missing, so the first 11 dates are close together.
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

	it( 'labels fewer dates for German, whose month names are longer', () => {
		const dates = Array.from(
			{ length: 7 },
			( _date, index ) => new Date( 2026, 6, 1 + index )
		);

		expect(
			pickDateTicks( dates, 1000, 28 ).map( ( { f } ) => f )
		).toEqual( [
			'Jul 1',
			'Jul 2',
			'Jul 3',
			'Jul 4',
			'Jul 5',
			'Jul 6',
			'Jul 7',
		] );

		// Google Charts writes these short month names in German.
		const months = [
			'Jan.',
			'Feb.',
			'März',
			'Apr.',
			'Mai',
			'Juni',
			'Juli',
			'Aug.',
			'Sept.',
			'Okt.',
			'Nov.',
			'Dez.',
		];
		formatterMocks.DateFormat.mockImplementation( () => ( {
			formatValue: ( date: Date ) =>
				`${ months[ date.getMonth() ] } ${ date.getDate() }`,
		} ) );

		expect(
			pickDateTicks( dates, 1000, 28 ).map( ( { f } ) => f )
		).toEqual( [ 'Juli 1', 'Juli 3', 'Juli 5', 'Juli 7' ] );
	} );

	it( 'lines up the label with the date for a chart with one date', () => {
		expect( pickDateTicks( [ new Date( 2026, 6, 1 ) ], 1918, 28 ) ).toEqual(
			[ { v: new Date( 2026, 6, 1 ), f: 'Jul 1' } ]
		);
	} );

	it( 'throws when Google Charts has no `DateFormat`', () => {
		( global as unknown as { google?: unknown } ).google = {
			visualization: { NumberFormat: formatterMocks.NumberFormat },
		};

		expect( () =>
			pickDateTicks( [ new Date( 2026, 6, 1 ) ], 1918, 28 )
		).toThrow( 'DateFormat is missing' );
	} );
} );
