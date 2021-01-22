/**
 * Tests for sumObjectListValue.
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
import sumObjectListValue from '../sum-object-list-value.js';

describe( 'sumObjectListValue', () => {
	it( 'returns the sum of fieldName in a list of objects', () => {
		const list = [
			{ count: 1 },
			{ count: 2 },
			{ count: 3 },
			{ count: 4 },
			{ count: 5 },
		];
		expect( sumObjectListValue( list, 'count' ) ).toBe( 15 );
	} );

	it( 'only sums the correct fieldName', () => {
		const list = [
			{ count: 1 },
			{ count: 2 },
			{ number: 3 },
			{ number: 4 },
			{ number: 5 },
		];
		expect( sumObjectListValue( list, 'count' ) ).toBe( 3 );
	} );

	it( 'returns 0 if list is empty or fieldName is not found', () => {
		const list = [
			{ number: 1 },
			{ number: 2 },
			{ number: 3 },
			{ number: 4 },
			{ number: 5 },
		];
		expect( sumObjectListValue( [], 'count' ) ).toBe( 0 );
		expect( sumObjectListValue( list, 'count' ) ).toBe( 0 );
	} );
} );
