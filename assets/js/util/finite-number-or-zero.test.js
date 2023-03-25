/**
 * Tests for `finiteNumberOrZero()`.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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

import { finiteNumberOrZero } from './finite-number-or-zero';

describe( 'finiteNumberOrZero', () => {
	it.each( [
		[ 0 ],
		[ 1 ],
		[ 123 ],
		[ -2 ],
		[ -234 ],
		[ 0.1234 ],
		[ -23.456 ],
	] )(
		'should return the passed value %s as it is a finite number',
		( value ) => {
			expect( finiteNumberOrZero( value ) ).toBe( value );
		}
	);

	it.each( [
		[ null ],
		[ undefined ],
		[ NaN ],
		[ Infinity ],
		[ -Infinity ],
		[ '0' ],
		[ '123' ],
		[ '-2.345' ],
		[ 'abc' ],
		[ true ],
		[ false ],
		[ [] ],
		[ {} ],
		[ () => {} ],
	] )(
		'should return zero as the passed value %s is not a finite number',
		( value ) => {
			expect( finiteNumberOrZero( value ) ).toBe( 0 );
		}
	);
} );
