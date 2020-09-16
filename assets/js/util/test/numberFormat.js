/**
 * Internal dependencies
 */
import { numberFormat } from '../';

/**
 * Sets the Site Kit locale to a (legacy) global variable.
 *
 * @param {string} langCode The locale to set Site Kit to use. E.g. `en-US` or `de-DE`.
 * @return {Object} Site Kit configuration object.
 */
const setupGoogleSiteKit = ( langCode ) => {
	return global._googlesitekitLegacyData = {
		locale: { '': { lang: langCode } },
	};
};

describe( 'numberFormat', () => {
	it( 'formats numbers correctly according to the locale provided', () => {
		expect(
			numberFormat( 123.87, { locale: 'en-US' } )
		).toStrictEqual( '123.87' );

		expect(
			numberFormat( 1234.87, { locale: 'en-US' } )
		).toStrictEqual( '1,234.87' );

		expect(
			numberFormat( 12345.87, { locale: 'en-US' } )
		).toStrictEqual( '12,345.87' );

		expect(
			numberFormat( 123456.87, { locale: 'en-US' } )
		).toStrictEqual( '123,456.87' );

		expect(
			numberFormat( 1234567.87, { locale: 'en-US' } )
		).toStrictEqual( '1,234,567.87' );

		expect(
			numberFormat( 12345678.87, { locale: 'en-US' } )
		).toStrictEqual( '12,345,678.87' );

		expect(
			numberFormat( 123456789.87, { locale: 'en-US' } )
		).toStrictEqual( '123,456,789.87' );

		expect(
			numberFormat( 123.87, { locale: 'de-DE' } )
		).toStrictEqual( '123,87' );

		expect(
			numberFormat( 1234.87, { locale: 'de-DE' } )
		).toStrictEqual( '1.234,87' );

		expect(
			numberFormat( 12345.87, { locale: 'de-DE' } )
		).toStrictEqual( '12.345,87' );

		expect(
			numberFormat( 123456.87, { locale: 'de-DE' } )
		).toStrictEqual( '123.456,87' );

		expect(
			numberFormat( 1234567.87, { locale: 'de-DE' } )
		).toStrictEqual( '1.234.567,87' );

		expect(
			numberFormat( 12345678.87, { locale: 'de-DE' } )
		).toStrictEqual( '12.345.678,87' );

		expect(
			numberFormat( 123456789.87, { locale: 'de-DE' } )
		).toStrictEqual( '123.456.789,87' );
	} );

	afterEach( () => {
		global._googlesitekitLegacyData = null;
	} );

	const siteKitLocales = [
		[
			'de_DE_formal',
			123.87,
			'123,87',

		],
		[
			'de_CH_informal',
			123.87,
			'123.87',
		],
		[
			'pt_PT_ao90',
			123.87,
			'123,87',
		],
	];

	it.each( siteKitLocales )( 'formats numbers correctly with locale variant %s', ( locale, value, expected ) => {
		setupGoogleSiteKit( locale );
		expect( numberFormat( value ) ).toStrictEqual( expected );
	} );
} );
