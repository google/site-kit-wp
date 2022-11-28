/**
 * Tests for isNumeric.
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

import { isValidNumericID } from './is-valid-numeric-id';

describe( 'isValidNumericID', () => {
	it( 'should return true for numeric values', () => {
		expect( isValidNumericID( 1 ) ).toBe( true );
		expect( isValidNumericID( 1 ) ).toBe( true );
		expect( isValidNumericID( '1' ) ).toBe( true );
	} );

	it( 'should return false for non-numeric values', () => {
		expect( isValidNumericID( null ) ).toBe( false );
		expect( isValidNumericID( undefined ) ).toBe( false );
		expect( isValidNumericID( -1 ) ).toBe( false );
		expect( isValidNumericID( '-1' ) ).toBe( false );
		expect( isValidNumericID( 0 ) ).toBe( false );
		expect( isValidNumericID( '0' ) ).toBe( false );
		expect( isValidNumericID( 'X' ) ).toBe( false );
		expect( isValidNumericID( '1.1' ) ).toBe( false );
		expect( isValidNumericID( 1.1 ) ).toBe( false );
		expect( isValidNumericID( '-1.1' ) ).toBe( false );
		expect( isValidNumericID( -1.1 ) ).toBe( false );
	} );
} );
