/**
 * Internal dependencies
 */
import { readableLargeNumber } from '../';

const valuesToTest = [
	[
		123,
		'123'
	],
	[
		1234,
		'1.2K'
	],
	[
		12345,
		'12.3K'
	],
	[
		123456,
		'123K'
	],
	[
		1234567,
		'1.2M'
	],
	[
		12345678,
		'12.3M'
	],
	[
		123456789,
		'123.5M'
	],
];

describe( 'readableLargeNumber', () => {
	it.each( valuesToTest )( 'for %d should return %s', ( value, expected ) => {
		expect( readableLargeNumber( value ) ).toStrictEqual( expected );
	} );
} );
