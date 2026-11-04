/**
 * Analytics 4 property creation date utility tests.
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
import { getPropertyCreateDate } from './property-create-date';

describe( 'getPropertyCreateDate', () => {
	it( 'should return the creation day in the browser time zone', () => {
		expect(
			getPropertyCreateDate( new Date( 2024, 0, 1 ).getTime() )
		).toBe( '2024-01-01' );
	} );

	it.each( [
		undefined,
		// The settings store `0` until the property's creation time is synced.
		0,
	] )(
		'should return `undefined` when the creation time is %s',
		( propertyCreateTime ) => {
			expect(
				getPropertyCreateDate( propertyCreateTime )
			).toBeUndefined();
		}
	);
} );
