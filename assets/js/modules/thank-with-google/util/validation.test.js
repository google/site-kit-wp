/**
 * Tests for validation utilities.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { isValidColorTheme } from './validation';

describe( 'validation', () => {
	describe( 'isValidColorTheme', () => {
		it.each( [
			[ 'blue' ],
			[ 'cyan' ],
			[ 'green' ],
			[ 'purple' ],
			[ 'pink' ],
			[ 'orange' ],
			[ 'brown' ],
			[ 'black' ],
		] )( 'should return TRUE for %s color', ( colorID ) => {
			expect( isValidColorTheme( colorID ) ).toBe( true );
		} );

		it.each( [
			[ 'undefined', undefined ],
			[ 'null', null ],
			[ 'boolean value', true ],
			[ 'numeric value', 1 ],
			[ 'unsupported color', 'gray' ],
		] )( 'should return FALSE for %s', ( _, colorID ) => {
			expect( isValidColorTheme( colorID ) ).toBe( false );
		} );
	} );
} );
