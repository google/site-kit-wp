/**
 * Internal dependencies
 */
import { readableLargeNumber } from '../';

describe( 'readableLargeNumber', () => {
	const valuesToTest = [
		[
			123,
			'123',
		],
		[
			123.1,
			'123.1',
		],
		[
			'123.1',
			'123.1',
		],
		[
			'123',
			'123',
		],
		[
			1234,
			'1.2K',
		],
		[
			'1234',
			'1.2K',
		],
		[
			12345,
			'12K',
		],
		[
			123456,
			'123K',
		],
		[
			1234567,
			'1.2M',
		],
		[
			'1234567',
			'1.2M',
		],
		[
			'1234567',
			'1.2M',
		],
		[
			12345678,
			'12.3M',
		],
		[
			123456789,
			'123.5M',
		],
	];
	it.each( valuesToTest )( 'for %d should return %s', ( value, expected ) => {
		expect( readableLargeNumber( value ) ).toStrictEqual( expected );
	} );

	describe( 'Numbers below 1000 output the same value that was passed.', () => {
		const numbersBelowOneThousand = [
			[
				1,
				'1',
			],
			[
				450,
				'450',
			],
			[
				550,
				'550',
			],
			[
				999,
				'999',
			],
		];
		it.each( numbersBelowOneThousand )( 'for %d should return %s', ( value, expected ) => {
			expect( readableLargeNumber( value ) ).toStrictEqual( expected );
		} );
	} );

	describe( 'Numbers between 1000 and 10,000 round normally with a single decimal unless the decimal is 0.', () => {
		const numbersBetweet1000And10000 = [
			[
				1000,
				'1K',
			],
			[
				1050,
				'1.1K',
			],
			[
				3828,
				'3.8K',
			],
			[
				4656,
				'4.7K',
			],
			[
				9000,
				'9K',
			],
		];
		it.each( numbersBetweet1000And10000 )( 'for %d should return %s', ( value, expected ) => {
			expect( readableLargeNumber( value ) ).toStrictEqual( expected );
		} );
	} );

	describe( 'Numbers between 10,000 and 1,000,000 round normally with no decimals', () => {
		const numbersBetween10000And1000000 = [
			[
				10000,
				'10K',
			],
			[
				10970,
				'11K',
			],
			[
				18487,
				'18K',
			],
			[
				20922,
				'21K',
			],
			[
				114859,
				'115K',
			],
			[
				141309,
				'141K',
			],
			[
				611898,
				'612K',
			],
		];
		it.each( numbersBetween10000And1000000 )( 'for %d should return %s', ( value, expected ) => {
			expect( readableLargeNumber( value ) ).toStrictEqual( expected );
		} );
	} );

	describe( 'Numbers over 1,000,000 round normally and display a single decimal unless the decimal is 0.', () => {
		const numbersOver1000000 = [
			[
				1000000,
				'1M',
			],
			[
				1100000,
				'1.1M',
			],
			[
				2500623,
				'2.5M',
			],
			[
				100100000,
				'100.1M',
			],
		];
		it.each( numbersOver1000000 )( 'for %d should return %s', ( value, expected ) => {
			expect( readableLargeNumber( value ) ).toStrictEqual( expected );
		} );
	} );
} );
