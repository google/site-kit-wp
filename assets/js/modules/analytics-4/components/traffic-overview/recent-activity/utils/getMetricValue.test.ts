/**
 * Recent activity `getMetricValue` utility tests.
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
import { getMetricValue } from './getMetricValue';

describe( 'getMetricValue', () => {
	const row = { metricValues: [ { value: '76.5' }, { value: '18' } ] };

	it( 'should return the first metric of the row as a number by default', () => {
		expect( getMetricValue( row ) ).toBe( 76.5 );
	} );

	it( 'should return the metric at the given index', () => {
		expect( getMetricValue( row, 1 ) ).toBe( 18 );
	} );

	it( 'should return 0 for a row that has not loaded or has no such metric', () => {
		expect( getMetricValue( undefined ) ).toBe( 0 );
		expect( getMetricValue( row, 2 ) ).toBe( 0 );
	} );
} );
