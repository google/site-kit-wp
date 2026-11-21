/**
 * Traffic Overview `getBreakdownValuesFromReport` utility tests.
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
import { createBreakdownReport } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { getBreakdownValuesFromReport } from './getBreakdownValuesFromReport';

describe( 'getBreakdownValuesFromReport', () => {
	it( 'should read each row as a value with its dimension value as the label and its visits, in the order of the report', () => {
		expect(
			getBreakdownValuesFromReport(
				createBreakdownReport( [
					[ 'Organic Search', 30 ],
					[ 'Direct', 10 ],
					[ '(not set)', 2 ],
				] )
			)
		).toEqual( [
			{ label: 'Organic Search', visits: 30 },
			{ label: 'Direct', visits: 10 },
			{ label: '(not set)', visits: 2 },
		] );
	} );

	it( 'should keep a row with no visits, so `getBreakdownRows()` decides what to leave out', () => {
		expect(
			getBreakdownValuesFromReport(
				createBreakdownReport( [
					[ 'desktop', 4 ],
					[ 'tablet', 0 ],
				] )
			)
		).toEqual( [
			{ label: 'desktop', visits: 4 },
			{ label: 'tablet', visits: 0 },
		] );
	} );

	it( 'should read zero visits for a row whose metric value is missing or not a number', () => {
		expect(
			getBreakdownValuesFromReport( {
				rows: [
					{ dimensionValues: [ { value: 'Brazil' } ] },
					{
						dimensionValues: [ { value: 'China' } ],
						metricValues: [ { value: 'n/a' } ],
					},
				],
			} )
		).toEqual( [
			{ label: 'Brazil', visits: 0 },
			{ label: 'China', visits: 0 },
		] );
	} );

	it( 'should return no values without a report, or for a report without rows', () => {
		expect( getBreakdownValuesFromReport( undefined ) ).toEqual( [] );
		expect( getBreakdownValuesFromReport( {} ) ).toEqual( [] );
	} );
} );
