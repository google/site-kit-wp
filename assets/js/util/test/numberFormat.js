/**
 * `numberFormat` tests
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
	} );
} );
