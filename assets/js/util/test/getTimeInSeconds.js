/**
 * Internal dependencies
 */
import { getTimeInSeconds } from '../';

const valuesToTest = [
	[
		'minute',
		60,
	],
	[
		'hour',
		60 * 60,
	],
	[
		'day',
		60 * 60 * 24,
	],
	[
		'week',
		60 * 60 * 24 * 7,
	],
	[
		'month',
		60 * 60 * 24 * 30,
	],
	[
		'year',
		60 * 60 * 24 * 365,
	],
];

describe( 'getTimeInSeconds', () => {
	it.each( valuesToTest )( 'for %s should return %d', ( value, expected ) => {
		expect( getTimeInSeconds( value ) ).toStrictEqual( expected );
	} );
} );
