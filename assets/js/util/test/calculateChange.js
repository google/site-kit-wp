/**
 * `calculateChange` tests
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
import { calculateChange } from '../';

const valuesToTest = [
	[ 100, 110, 0.1 ],
	[ 100, 90, -0.1 ],
	[ 100, 121, 0.21 ],
	[ 100, 121, 0.21 ],
	[ 100, 101, 0.01 ],
	[ 110, 111, 0.00909090909090909 ],
	[ 110, 115, 0.045454545454545456 ],
	[ 110, 121, 0.1 ],
	[ 121, 110, -0.09090909090909091 ],
	[ 322, 359, 0.11490683229813664 ],
	[ 4531, 4921, 0.08607371441182962 ],
];

describe( 'calculateChange', () => {
	it.each( valuesToTest )(
		'given %d and %d should return %s',
		( previous, current, expected ) => {
			expect( calculateChange( previous, current ) ).toStrictEqual(
				expected
			);
		}
	);
} );
