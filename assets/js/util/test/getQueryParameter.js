/**
 * Internal dependencies
 */
import { getQueryParameter } from '../';

const valuesToTest = [
	[
		'?foo=bar&x=1',
		'foo',
		'bar'
	],
	[
		'?bar=foo&x=1',
		'bar',
		'foo'
	],
	[
		'?foo=bar&x=1',
		'x',
		'1'
	],
	[
		'?foo=bar&y=2&x=1',
		'y',
		'2'
	]
];

// eslint-disable-next-line no-undef
global.window = Object.create( window );
const url = 'https://example.com';
Object.defineProperty( window, 'location', {
	value: {
		href: url
	}
} );

describe( 'getQueryParameter', () => {
	it.each( valuesToTest )( 'given search string %s and key %s, should return %s', ( search, param, expected ) => {
		expect( getQueryParameter( search, param ) ).toStrictEqual( expected );
	} );
} );
