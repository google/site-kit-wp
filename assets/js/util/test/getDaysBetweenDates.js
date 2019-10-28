/**
 * Internal dependencies
 */
import { getDaysBetweenDates } from '../';

const valuesToTest = [
	[
		new Date( '1999-12-31T23:00:00.000Z' ),
		new Date( '2000-01-01T23:00:00.000Z' ),
		1,
	],
	[
		new Date( '1999-12-31T23:00:00.000Z' ),
		new Date( '2000-01-31T23:00:00.000Z' ),
		31,
	],
	[
		new Date( '1999-12-31T23:00:00.000Z' ),
		new Date( '2000-12-31T23:00:00.000Z' ),
		366,
	],
	[
		new Date( '1999-12-31T23:00:00.000Z' ),
		new Date( '2000-07-14T22:00:00.000Z' ),
		196,
	],
	[
		new Date( '1999-12-31T23:00:00.000Z' ),
		new Date( '2012-04-06T22:00:00.000Z' ),
		4480,
	],
];

describe( 'getDaysBetweenDates', () => {
	it.each( valuesToTest )( 'for start date %s and end date %s should return %s', ( start, end, expected ) => {
		expect( getDaysBetweenDates( start, end ) ).toStrictEqual( expected );
	} );
} );
