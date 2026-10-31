/**
 * CTA utilities tests.
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
import { getCTAID } from './ctas';

describe( 'getCTAID', () => {
	it( 'should return the last segment of the resource name', () => {
		expect(
			getCTAID(
				'publications/ABC123/ctas/9f7c2d1e-0a4b-4c3e-8f55-2b6a1d9e7c10'
			)
		).toBe( '9f7c2d1e-0a4b-4c3e-8f55-2b6a1d9e7c10' );
	} );

	it( 'should return undefined when there is no resource name', () => {
		expect( getCTAID() ).toBeUndefined();
		expect( getCTAID( '' ) ).toBeUndefined();
	} );

	it( 'should return undefined when the resource name has no last segment', () => {
		expect( getCTAID( 'publications/ABC123/ctas/' ) ).toBeUndefined();
	} );
} );
