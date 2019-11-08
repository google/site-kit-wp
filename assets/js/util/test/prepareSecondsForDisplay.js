/**
 * Internal dependencies
 */
import { prepareSecondsForDisplay } from '../';

const valuesToTest = [
	[
		65,
		'1m 5s',
	],
	[
		125,
		'2m 5s',
	],
	[
		35,
		'35s',
	],
	[
		60,
		'1m',
	],
	[
		65,
		'1m 5s',
	],
	[
		( 60 * 60 * 3 ) + ( 60 * 5 ) + 12,
		'3h 5m 12s',
	],
	[
		( 60 * 60 * 7 ) + ( 60 * 2 ) + 42,
		'7h 2m 42s',
	],
];

describe( 'prepareSecondsForDisplay', () => {
	it.each( valuesToTest )( 'should turn %d into %s', ( seconds, expected ) => {
		expect( prepareSecondsForDisplay( seconds ) ).toStrictEqual( expected );
	} );
} );
