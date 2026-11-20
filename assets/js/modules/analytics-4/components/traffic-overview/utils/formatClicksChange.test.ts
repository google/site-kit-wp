/**
 * `formatClicksChange` utility tests.
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
import { formatClicksChange } from './formatClicksChange';

describe( 'formatClicksChange', () => {
	it( 'should give a rise a plus sign and the plural unit', () => {
		expect( formatClicksChange( 140 ) ).toBe( '+140 clicks' );
	} );

	it( 'should give a drop a minus sign', () => {
		expect( formatClicksChange( -1426 ) ).toBe( '-1,426 clicks' );
	} );

	it.each( [
		[ 1, '+1 click' ],
		[ -1, '-1 click' ],
	] )(
		'should use the singular unit for a change of one click, such as %d',
		( change, expected ) => {
			expect( formatClicksChange( change ) ).toBe( expected );
		}
	);

	it( 'should give no change no sign', () => {
		expect( formatClicksChange( 0 ) ).toBe( '0 clicks' );
	} );
} );
