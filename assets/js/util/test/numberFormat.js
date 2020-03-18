/**
 * Internal dependencies
 */
import { numberFormat } from '../';

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
} );
