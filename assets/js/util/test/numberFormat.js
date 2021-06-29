/**
 * `numberFormat` tests
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import { set, unset } from 'lodash';

/**
 * Internal dependencies
 */
import { numberFormat } from '../';

const setupGoogleSiteKit = ( langCode ) => {
	set( global._googlesitekitLegacyData, 'locale', langCode );
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
		expect( console ).not.toHaveWarned();
	} );

	afterEach( () => {
		unset( global._googlesitekitLegacyData, 'locale' );
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
		expect( console ).not.toHaveWarned();
	} );

	const NumberFormat = Intl.NumberFormat;

	/*
	 * This function mocks the implementation of certain errors identified in
	 * https://github.com/google/site-kit-wp/issues/3255
	 * so that we can test that we've properly handled them.
	 */
	const mockNumberFormat = () => {
		global.Intl.NumberFormat = ( locales, options ) => {
			if ( undefined === options ) {
				return NumberFormat( locales, options );
			}
			const optionsThatError = {
				currencyDisplay: 'narrow',
				currencySign: 'accounting',
				style: 'unit',
				signDisplay: '*', // * denotes any value.
				compactDisplay: '*',
			};
			for ( const [ key, value ] of Object.entries( options ) ) {
				if ( optionsThatError[ key ] && [ value, '*' ].includes( optionsThatError[ key ] ) ) {
					throw new Error( 'Implementation error' );
				}
			}

			return NumberFormat( locales, options );
		};
	};

	it( 'degrades gracefully when `signDisplay` has any value other than the default of `auto`', () => {
		// Regular implementation.
		expect( numberFormat( -0.0123, {
			locale: 'en-US',
			signDisplay: 'never',
			style: 'percent',
			maximumFractionDigits: 1,
		} ) ).toStrictEqual( '1.2%' );

		mockNumberFormat();

		expect( numberFormat( -0.0123, {
			locale: 'en-US',
			signDisplay: 'never', // This parameter will be removed.
			style: 'percent',
			maximumFractionDigits: 1,
		} ) ).toStrictEqual( '-1.2%' );

		const expectedWarning = 'Site Kit numberFormat error: Intl.NumberFormat( "en-US", {"signDisplay":"never","style":"percent","maximumFractionDigits":1} ).format( number )';
		expect( console ).toHaveWarnedWith( expectedWarning, 'Implementation error' );

		// Call the same function again to ensure we don't warn again.
		numberFormat( -0.0123, {
			locale: 'en-US',
			signDisplay: 'never', // This parameter will be removed.
			style: 'percent',
			maximumFractionDigits: 1,
		} );

		// Ensure we don't log more than once.
		expect( console.warn ).toHaveBeenCalledTimes( 1 ); // eslint-disable-line no-console

		// Restore the regular behaviour.
		Intl.NumberFormat = NumberFormat;
	} );

	it( 'degrades gracefully when style:unit is encountered in certain scenarios', () => {
		// Regular implementation.
		expect( numberFormat( 22, {
			locale: 'en-US',
			unitDisplay: 'narrow',
			style: 'unit',
			unit: 'second',
		} ) ).toStrictEqual( '22s' );

		expect( console ).not.toHaveWarned();

		mockNumberFormat();

		expect( numberFormat( 22, {
			locale: 'en-US',
			unitDisplay: 'narrow',
			style: 'unit',
			unit: 'second',
		} ) ).toStrictEqual( '22' );

		const expectedWarning = 'Site Kit numberFormat error: Intl.NumberFormat( "en-US", {"unitDisplay":"narrow","style":"unit","unit":"second"} ).format( number )';
		expect( console ).toHaveWarnedWith( expectedWarning, 'Implementation error' );

		// Restore the regular behaviour.
		Intl.NumberFormat = NumberFormat;
	} );
} );
