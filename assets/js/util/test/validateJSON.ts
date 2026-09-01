/**
 * Internal dependencies
 */
import { validateJSON } from '@/js/util';

const valuesToTest: Array< [ string | boolean, boolean ] > = [
	[ '{"foo":"bar"}', true ],
	[ '{"foo":"bar","x":1,"y":true}', true ],
	[ '{"foo":"bar"', false ],
	[ '', false ],
	[ false, false ],
];

describe( 'validateJSON', () => {
	it.each( valuesToTest )(
		'should validate %s with validation status %p',
		( stringToValidate, expected ) => {
			expect( validateJSON( stringToValidate as string ) ).toStrictEqual(
				expected
			);
		}
	);
} );
