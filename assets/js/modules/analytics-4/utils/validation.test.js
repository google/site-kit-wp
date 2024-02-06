/**
 * Validation function tests.
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
 * Internal dependencies
 */
import { WEBDATASTREAM_CREATE } from '../datastore/constants';
import {
	isValidAdsConversionID,
	isValidGoogleTagAccountID,
	isValidGoogleTagContainerID,
	isValidGoogleTagID,
	isValidWebDataStreamID,
	isValidWebDataStreamSelection,
} from './validation';

describe( 'modules/analytics-4 validations', () => {
	describe( 'isValidWebDataStreamID', () => {
		it( 'should return TRUE when a valid webDataStreamID is passed', () => {
			expect( isValidWebDataStreamID( '12345' ) ).toBe( true );
		} );

		it.each( [
			[ 'undefined', undefined ],
			[ 'null', null ],
			[ 'false', false ],
			[ 'a number', 12345 ],
			[ 'WEBDATASTREAM_CREATE', WEBDATASTREAM_CREATE ],
		] )(
			'should return FALSE when %s is passed',
			( _, webDataStreamID ) => {
				expect( isValidWebDataStreamID( webDataStreamID ) ).toBe(
					false
				);
			}
		);
	} );

	describe( 'isValidWebDataStreamSelection', () => {
		it( 'should return TRUE when a valid webDataStreamID is passed', () => {
			expect( isValidWebDataStreamSelection( '12345' ) ).toBe( true );
		} );

		it( 'should return TRUE when WEBDATASTREAM_CREATE is passed', () => {
			expect(
				isValidWebDataStreamSelection( WEBDATASTREAM_CREATE )
			).toBe( true );
		} );

		it.each( [
			[ 'undefined', undefined ],
			[ 'null', null ],
			[ 'false', false ],
			[ 'a number', 12345 ],
		] )(
			'should return FALSE when %s is passed',
			( _, webDataStreamID ) => {
				expect( isValidWebDataStreamSelection( webDataStreamID ) ).toBe(
					false
				);
			}
		);
	} );

	describe( 'isValidGoogleTagID', () => {
		it( 'should return TRUE when a valid googleTagId is passed', () => {
			expect( isValidGoogleTagID( 'G-ABC123' ) ).toBe( true );
			expect( isValidGoogleTagID( 'GT-THE567' ) ).toBe( true );
			expect( isValidGoogleTagID( 'AW-WD40' ) ).toBe( true );
		} );

		it( 'should return FALSE when an invalid googleTagId is passed', () => {
			expect( isValidGoogleTagID( 'ABC12' ) ).toBe( false );
			expect( isValidGoogleTagID( 'AB-C12' ) ).toBe( false );
			expect( isValidGoogleTagID( 'GT-_35' ) ).toBe( false );
			expect( isValidGoogleTagID( '12GT-THE567' ) ).toBe( false );
		} );
	} );

	describe( 'isValidGoogleTagAccountID', () => {
		it( 'should return TRUE when a valid googleTagAccountId is passed', () => {
			expect( isValidGoogleTagAccountID( 1 ) ).toBe( true );
			expect( isValidGoogleTagAccountID( '1' ) ).toBe( true );
		} );

		it( 'should return FALSE when an invalid googleTagId is passed', () => {
			expect( isValidGoogleTagAccountID( 1.1 ) ).toBe( false );
			expect( isValidGoogleTagAccountID( '' ) ).toBe( false );
			expect( isValidGoogleTagAccountID( 'X' ) ).toBe( false );
		} );
	} );

	describe( 'isValidGoogleTagContainerID', () => {
		it( 'should return TRUE when a valid googleTagAccountId is passed', () => {
			expect( isValidGoogleTagContainerID( 1 ) ).toBe( true );
			expect( isValidGoogleTagContainerID( '1' ) ).toBe( true );
		} );

		it( 'should return FALSE when an invalid googleTagId is passed', () => {
			expect( isValidGoogleTagContainerID( '' ) ).toBe( false );
			expect( isValidGoogleTagContainerID( 'X' ) ).toBe( false );
		} );
	} );

	describe( 'isValidAdsConversionID', () => {
		it( 'should return TRUE when a valid AdsConversionID is passed', () => {
			expect( isValidAdsConversionID( 'AW-123456789' ) ).toBe( true );
		} );

		it.each( [
			[ 'false', false ],
			[ 'an integer', 12345 ],
			[ 'an empty string', '' ],
			[ 'a string not starting with AW', 'AB-123456789' ],
			[
				'a string starts with AW but ends without numbers',
				'AW-ABCDEFGHI',
			],
		] )(
			'should return FALSE when %s is passed',
			( _, adsConversionID ) => {
				expect( isValidAdsConversionID( adsConversionID ) ).toBe(
					false
				);
			}
		);
	} );
} );
