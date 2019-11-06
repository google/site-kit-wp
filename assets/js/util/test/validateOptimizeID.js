/**
 * Internal dependencies
 */
import { validateOptimizeID } from '../';

const valuesToTest = [
	[
		'GTM-XXXXXXX',
		true,
	],
	[
		'GTM-XXXXXX',
		false,
	],
	[
		'GTM-1234567',
		true,
	],
	[
		'GTMXXXXXXXX',
		false,
	],
	[
		'gtm-xxxxxxx',
		false,
	],
];

describe( 'validateOptimizeID', () => {
	it.each( valuesToTest )( 'should validate %s with validation status %p', ( stringToValidate, expected ) => {
		expect( Boolean( validateOptimizeID( stringToValidate ) ) ).toStrictEqual( expected );
	} );
} );
