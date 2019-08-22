/**
 * Internal dependencies
 */
import { removeURLParameter } from '../';

const valuesToTest = [
	[
		'https://google.com?message=toast&topping=butter',
		'message',
		'https://google.com/?topping=butter'
	],
	[
		'https://google.com?success=true&message=toast&topping=butter',
		'message',
		'https://google.com/?success=true&topping=butter'
	],
	[
		'https://google.com?message=toast&topping=butter',
		'topping',
		'https://google.com/?message=toast'
	],
	[
		'https://google.com?success=true&message=toast&topping=butter',
		'topping',
		'https://google.com/?success=true&message=toast'
	],
	[
		'https://google.com?success=true&message=toast&topping=butter',
		'success',
		'https://google.com/?message=toast&topping=butter'
	],
];

describe( 'removeURLParameter', () => {
	it.each( valuesToTest )( 'should remove param %2$s from URL %1$s', ( url, param, expected ) => {
		expect( removeURLParameter( url, param ) ).toStrictEqual( expected );
	} );
} );


