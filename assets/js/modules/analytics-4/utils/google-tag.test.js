/**
 * Google Tag utility tests.
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

/**
 * Internal dependencies
 */
import { getBestTagID } from './google-tag';

describe( 'getBestTagID', () => {
	it( 'should return the only tag ID in an array with one tag', () => {
		expect( getBestTagID( [ 'SINGLE-TAG' ] ) ).toBe( 'SINGLE-TAG' );
	} );

	it( 'should return the first tag with "GT-" in an array with multiple tags', () => {
		expect(
			getBestTagID(
				[
					'G-2B7M8YQ1K6',
					'G-2B7M8YQ1K4',
					'AW-2B7M8YQ1K4',
					'GT-NBQN9V3',
					'GT-NBQN9V4',
				],
				'G-2B7M8YQ1K4'
			)
		).toBe( 'GT-NBQN9V3' );
	} );

	it( 'should return the "G-" tag that matches the Measurement ID passed in an array with multiple tags', () => {
		expect(
			getBestTagID(
				[ 'G-2B7M8YQ1K6', 'G-2B7M8YQ1K4', 'AW-2B7M8YQ1K4' ],
				'G-2B7M8YQ1K4'
			)
		).toBe( 'G-2B7M8YQ1K4' );
	} );

	it( 'should return the first "G-" tag if no "GT-" or Measurement ID matching tag is found', () => {
		expect(
			getBestTagID(
				[ 'AW-2B7M8YQ1K6', 'G-2B7M8YQ1K6', 'AW-2B7M8YQ1K4' ],
				'G-2B7M8YQ1K4'
			)
		).toBe( 'G-2B7M8YQ1K6' );
	} );

	it( 'should return the first tag found if no "G-" tag, "GT-" tag or Measurement ID matching tag is found', () => {
		expect(
			getBestTagID(
				[ 'AW-2B7M8YQ1K6', 'AW-2B7M8YQ1K4' ],
				'AW-2B7M8YQ1K6'
			)
		).toBe( 'AW-2B7M8YQ1K6' );
	} );
} );
