/**
 * Validation utility tests.
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
 * Internal dependencies
 */
import { isValidAccountID, isValidClientID } from './validation';

describe( 'isValidAccountID', () => {
	it( 'returns true for valid account IDs', () => {
		const ids = [
			'pub-12345678',
			'pub-561',
			'pub-91111111111111111',
		];
		ids.forEach( ( id ) => {
			expect( isValidAccountID( id ) ).toEqual( true );
		} );
	} );

	it( 'returns false for invalid account IDs', () => {
		const ids = [
			'pub-12345678a',
			'test',
			'',
			'UA-1234',
			'pub12345678',
			'ca-pub-12345678',
		];
		ids.forEach( ( id ) => {
			expect( isValidAccountID( id ) ).toEqual( false );
		} );
	} );
} );

describe( 'isValidClientID', () => {
	it( 'returns true for valid account IDs', () => {
		const ids = [
			'ca-pub-12345678',
			'ca-pub-561',
			'ca-pub-91111111111111111',
		];
		ids.forEach( ( id ) => {
			expect( isValidClientID( id ) ).toEqual( true );
		} );
	} );

	it( 'returns false for invalid account IDs', () => {
		const ids = [
			'pub-12345678',
			'test',
			'',
			'UA-1234',
			'capub12345678',
			'ca-pub12345678',
			'ca-pub-12345678a',
		];
		ids.forEach( ( id ) => {
			expect( isValidClientID( id ) ).toEqual( false );
		} );
	} );
} );
