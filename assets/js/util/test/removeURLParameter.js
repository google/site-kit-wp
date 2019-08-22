/**
 * Internal dependencies
 */
import { removeURLParameter } from '../';

const valuesToTest = [
	[
		'message',
		'https://google.com?message=toast&topping=butter',
		'https://google.com/?topping=butter'
	],
	[
		'message',
		'https://google.com?success=true&message=toast&topping=butter',
		'https://google.com/?success=true&topping=butter'
	],
	[
		'topping',
		'https://google.com?message=toast&topping=butter',
		'https://google.com/?message=toast'
	],
	[
		'topping',
		'https://google.com?success=true&message=toast&topping=butter',
		'https://google.com/?success=true&message=toast'
	],
	[
		'success',
		'https://google.com?success=true&message=toast&topping=butter',
		'https://google.com/?message=toast&topping=butter'
	],
];

describe( 'removeURLParameter', () => {
	it.each( valuesToTest )( 'should remove param %s from URL %s', ( param, url, expected ) => {
		expect( removeURLParameter( url, param ) ).toStrictEqual( expected );
	} );
} );


