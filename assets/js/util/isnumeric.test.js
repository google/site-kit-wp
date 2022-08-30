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

import { isNumeric } from './isnumeric';

describe( 'isNumeric', () => {
	it( 'should return true for numeric values', () => {
		expect( isNumeric( 1 ) ).toBe( true );
		expect( isNumeric( '1' ) ).toBe( true );
		expect( isNumeric( '1.0' ) ).toBe( true );
	} );

	it( 'should return false for non-numeric values', () => {
		expect( isNumeric( null ) ).toBe( false );
		expect( isNumeric( undefined ) ).toBe( false );
		expect( isNumeric( '' ) ).toBe( false );
		expect( isNumeric( 'a' ) ).toBe( false );
		expect( isNumeric( 'a1' ) ).toBe( false );
		expect( isNumeric( '1a' ) ).toBe( false );
	} );
} );
