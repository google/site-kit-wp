/**
 * Create Incremental Array by Size utility tests.
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
import { createIncrementalArrayBySize } from './create-incremental-array-by-size';

describe( 'createIncrementalArrayBySize', () => {
	function registerCase(
		size: number | null | undefined,
		expected: number[]
	): void {
		it( `with size equal to ${ size }, should return ${ expected }`, () => {
			expect( createIncrementalArrayBySize( size ) ).toEqual( expected );
		} );
	}

	registerCase( undefined, [] );
	registerCase( null, [] );
	registerCase( 0, [] );
	registerCase( 1, [ 0 ] );
	registerCase( 2, [ 0, 1 ] );
	registerCase( 3, [ 0, 1, 2 ] );
	registerCase( 4, [ 0, 1, 2, 3 ] );
	registerCase( 5, [ 0, 1, 2, 3, 4 ] );
} );
