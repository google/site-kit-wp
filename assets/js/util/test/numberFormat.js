/**
 * Internal dependencies
 */
import { numberFormat } from '../';

const valuesToTest = [
	[
		123.87,
		'en-US',
		'123.87',
	],
	[
		1234.87,
		'en-US',
		'1,234.87',
	],
	[
		12345.87,
		'en-US',
		'12,345.87',
	],
	[
		123456.87,
		'en-US',
		'123,456.87',
	],
	[
		1234567.87,
		'en-US',
		'1,234,567.87',
	],
	[
		12345678.87,
		'en-US',
		'12,345,678.87',
	],
	[
		123456789.87,
		'en-US',
		'123,456,789.87',
	],
	[
		123.87,
		'de-DE',
		'123,87',
	],
	[
		1234.87,
		'de-DE',
		'1.234,87',
	],
	[
		12345.87,
		'de-DE',
		'12.345,87',
	],
	[
		123456.87,
		'de-DE',
		'123.456,87',
	],
	[
		1234567.87,
		'de-DE',
		'1.234.567,87',
	],
	[
		12345678.87,
		'de-DE',
		'12.345.678,87',
	],
	[
		123456789.87,
		'de-DE',
		'123.456.789,87',
	]
];

// Disable reason: Node needs some polyfills for supporting a different locale.
// eslint-disable-next-line jest/no-disabled-tests
describe.skip( 'numberFormat', () => {
	it.each( valuesToTest )( 'for %s and locale %s should return %s', ( value, locale, expected ) => {
		expect( numberFormat( value, locale ) ).toStrictEqual( expected );
	} );
} );
