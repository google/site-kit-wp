/**
 * Tests for averageObjectListValue.
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
import averageObjectValueList from '../average-object-list-value.js';

describe( 'averageObjectValueList', () => {
	it( 'returns the average of fieldName in a list of objects', () => {
		const list = [
			{ count: 1 },
			{ count: 2 },
			{ count: 3 },
			{ count: 4 },
			{ count: 5 },
		];
		expect( averageObjectValueList( list, 'count' ) ).toBe( 3 );
	} );

	it( 'rounds the average if all fieldName values are integers', () => {
		const list = [
			{ count: 1 },
			{ count: 2 },
		];
		expect( averageObjectValueList( list, 'count' ) ).toBe( 2 );
	} );

	it( 'returns floating point if any value is not an integer', () => {
		const list = [
			{ count: 1 },
			{ count: 2 },
			{ count: 3.5 },
			{ count: 4 },
		];
		expect( averageObjectValueList( list, 'count' ) ).toBe( 2.625 );
	} );

	it( 'only averages the correct fieldName', () => {
		const list = [
			{ count: 1 },
			{ count: 2 },
			{ number: 3 },
			{ number: 4 },
			{ number: 5 },
		];
		expect( averageObjectValueList( list, 'count' ) ).toBe( 2 );
	} );

	it( 'returns 0 if list is empty or fieldName is not found on any objects in list', () => {
		const list = [
			{ number: 1 },
			{ number: 2 },
			{ number: 3 },
			{ number: 4 },
			{ number: 5 },
		];
		expect( averageObjectValueList( [], 'count' ) ).toBe( 0 );
		expect( averageObjectValueList( list, 'count' ) ).toBe( 0 );
	} );
} );
