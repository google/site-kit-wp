/**
 * Internal dependencies
 */
import { generateDateRangeArgs } from './report-date-range-args';

describe( 'AdSense report date range: generateDateRangeArgs', () => {
	it( 'should throw if a `dates` object is not provided', () => {
		expect( () => generateDateRangeArgs() ).toThrow(
			'A dates object is required.'
		);
	} );

	it( 'should throw if `startDate` argument is not provided', () => {
		expect( () =>
			generateDateRangeArgs( { endDate: '2021-01-27' } )
		).toThrow( 'A valid startDate is required.' );
	} );

	it( 'should throw if `endDate` argument is not provided', () => {
		expect( () =>
			generateDateRangeArgs( { startDate: '2021-01-01' } )
		).toThrow( 'A valid endDate is required.' );
	} );

	it( 'should return an object containing a `d` key, the value of which is the `startDate` and `endDate` arguments formatted and concatenated', () => {
		const result = generateDateRangeArgs( {
			startDate: '2021-01-01',
			endDate: '2021-01-27',
		} );

		expect( result.d ).toBe( '2021/01/01-2021/01/27' );
	} );
} );
