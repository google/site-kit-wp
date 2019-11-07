/**
 * Internal dependencies
 */
import { validateJSON } from '../';

const valuesToTest = [
	[
		'{"foo":"bar"}',
		true,
	],
	[
		'{"foo":"bar","x":1,"y":true}',
		true,
	],
	[
		'{"foo":"bar"',
		false,
	],
	[
		'',
		false,
	],
	[
		false,
		false,
	],
];

describe( 'validateJSON', () => {
	it.each( valuesToTest )( 'should validate %s with validation status %p', ( stringToValidate, expected ) => {
		expect( validateJSON( stringToValidate ) ).toStrictEqual( expected );
	} );
} );
