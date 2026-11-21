/**
 * `formatVisitsChange` utility tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { formatVisitsChange } from './formatVisitsChange';

describe( 'formatVisitsChange', () => {
	it( 'should give a rise a plus sign and the plural unit', () => {
		expect( formatVisitsChange( 65 ) ).toBe( '+65 visits' );
	} );

	it( 'should give a drop a minus sign', () => {
		expect( formatVisitsChange( -21 ) ).toBe( '-21 visits' );
	} );

	it.each( [
		[ 1, '+1 visit' ],
		[ -1, '-1 visit' ],
	] )(
		'should use the singular unit for a change of one visit, such as %d',
		( change, expected ) => {
			expect( formatVisitsChange( change ) ).toBe( expected );
		}
	);

	it( 'should give no change no sign', () => {
		expect( formatVisitsChange( 0 ) ).toBe( '0 visits' );
	} );

	it( 'should group the digits of a large change rather than shorten it', () => {
		expect( formatVisitsChange( 12345 ) ).toBe( '+12,345 visits' );
	} );
} );
