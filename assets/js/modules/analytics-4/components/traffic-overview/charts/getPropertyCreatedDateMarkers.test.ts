/**
 * Traffic Overview `getPropertyCreatedDateMarkers` utility tests.
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
import { getPropertyCreatedDateMarkers } from './getPropertyCreatedDateMarkers';

describe( 'getPropertyCreatedDateMarkers', () => {
	it( 'should return a marker on the given day whose tooltip reads "Google Analytics property created"', () => {
		expect( getPropertyCreatedDateMarkers( '2025-10-01' ) ).toEqual( [
			{
				date: '2025-10-01',
				text: 'Google Analytics property created',
			},
		] );
	} );

	it( 'should return no marker when there is no day to mark', () => {
		expect( getPropertyCreatedDateMarkers( undefined ) ).toBeUndefined();
	} );
} );
