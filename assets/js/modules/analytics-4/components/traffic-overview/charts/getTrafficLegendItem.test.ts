/**
 * Traffic Overview `getTrafficLegendItem` utility tests.
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
import { getTrafficLegendItem } from './getTrafficLegendItem';

describe( 'getTrafficLegendItem', () => {
	it( 'should return the "Last 28 days traffic" label and the `#462083` line color for a 28-day range', () => {
		expect( getTrafficLegendItem( 28 ) ).toEqual( {
			label: 'Last 28 days traffic',
			color: '#462083',
		} );
	} );

	it( 'should return the "Last 1 day traffic" label for a one-day range', () => {
		expect( getTrafficLegendItem( 1 ).label ).toBe( 'Last 1 day traffic' );
	} );
} );
