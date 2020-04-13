/**
 * Internal dependencies
 */
import { changeToPercent } from '../';

const valuesToTest = [
	[
		100,
		110,
		'10.0',
	],
	[
		100,
		90,
		'-10.0',
	],
	[
		100,
		121,
		'21.0',
	],
	[
		100,
		121,
		'21.0',
	],
	[
		100,
		101,
		'1.0',
	],
	[
		110,
		111,
		'0.9',
	],
	[
		110,
		115,
		'4.5',
	],
	[
		110,
		121,
		'10.0',
	],
	[
		121,
		110,
		'-9.1',
	],
	[
		322,
		359,
		'11.5',
	],
	[
		4531,
		4921,
		'8.6',
	],
];

describe( 'changeToPercent', () => {
	it.each( valuesToTest )( 'given %d and %d should return %s', ( previous, current, expected ) => {
		expect( changeToPercent( previous, current ) ).toStrictEqual( expected );
	} );
} );

