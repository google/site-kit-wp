/**
 * Internal dependencies
 */
import { prepareForReadableLargeNumber } from '../';

describe( 'prepareForReadableLargeNumber', () => {
	describe( 'Numbers below 1000 output the same value that was passed.', () => {
		const numbersBelowOneThousand = [
			[
				1,
				1,
			],
			[
				500,
				500,
			],
			[
				999,
				999,
			],
		];
		it.each( numbersBelowOneThousand )( 'for %d should round to %s', ( value, expected ) => {
			expect( prepareForReadableLargeNumber( value ) ).toStrictEqual( expected );
		} );
	} );

	describe( 'Numbers between 1000 and 10,000.', () => {
		const numbersBetweet1000And10000 = [
			[
				1000,
				1,
			],
			[
				1201,
				1.2,
			],
			[
				1500,
				1.5,
			],
			[
				1999,
				2,
			],
			[
				6566,
				6.6,
			],
		];
		it.each( numbersBetweet1000And10000 )( 'for %d should round to %s', ( value, expected ) => {
			expect( prepareForReadableLargeNumber( value ) ).toStrictEqual( expected );
		} );
	} );

	describe( 'Numbers between 10,000 and 1,000,000.', () => {
		const numbersBetween10000And1000000 = [
			[
				10000,
				10,
			],
			[
				10100,
				10,
			],
			[
				10500,
				11,
			],
		];
		it.each( numbersBetween10000And1000000 )( 'for %d should round to %s', ( value, expected ) => {
			expect( prepareForReadableLargeNumber( value ) ).toStrictEqual( expected );
		} );
	} );
	describe( 'Numbers over 1,000,000.', () => {
		const numbersOver1000000 = [
			[
				1000000,
				1,
			],
			[
				1100000,
				1.1,
			],
			[
				1100500,
				1.1,
			],
			[
				2500623,
				2.5,
			],
			[
				100100000,
				100.1,
			],
		];
		it.each( numbersOver1000000 )( 'for %d should round to %s', ( value, expected ) => {
			expect( prepareForReadableLargeNumber( value ) ).toStrictEqual( expected );
		} );
	} );
} );
