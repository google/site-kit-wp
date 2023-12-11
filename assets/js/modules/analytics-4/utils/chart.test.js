/**
 * Tests for chart utilities.
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
 * Internal dependencies.
 */
import { isSingleSlice } from './chart';

describe( 'isSingleSlice', () => {
	it( 'returns undefined when undefined is passed', () => {
		expect( isSingleSlice( undefined ) ).toBe( undefined );
	} );

	it( 'returns true for a report that has a single row of data', () => {
		const report = {
			rows: [
				{
					dimensionValues: [
						{ value: 'Referral' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '3',
						},
						{
							value: '7',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Referral' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '4',
						},
						{
							value: '8',
						},
					],
				},
			],
			totals: [
				{
					dimensionValues: [
						{ value: 'RESERVED_TOTAL' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '3',
						},
						{
							value: '13',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'RESERVED_TOTAL' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '4',
						},
						{
							value: '8',
						},
					],
				},
			],
		};

		expect( isSingleSlice( report ) ).toBe( true );
	} );

	it( 'returns true for a report that has one row contributing 100% of the total for a given dimension', () => {
		const report = {
			rows: [
				{
					dimensionValues: [
						{ value: 'Referral' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '3',
						},
						{
							value: '7',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Referral' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '4',
						},
						{
							value: '8',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Direct' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '0',
						},
						{
							value: '5',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Direct' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '1',
						},
						{
							value: '6',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Social' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '0',
						},
						{
							value: '1',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Social' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '1',
						},
						{
							value: '2',
						},
					],
				},
			],
			totals: [
				{
					dimensionValues: [
						{ value: 'RESERVED_TOTAL' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '3',
						},
						{
							value: '13',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'RESERVED_TOTAL' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '4',
						},
						{
							value: '14',
						},
					],
				},
			],
		};

		expect( isSingleSlice( report ) ).toBe( true );
	} );

	it( 'returns false for a report that has more than a single row of data', () => {
		const report = {
			rows: [
				{
					dimensionValues: [
						{ value: 'Direct' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '995',
						},
						{
							value: '868',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Direct' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '996',
						},
						{
							value: '869',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Organic Search' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '492',
						},
						{
							value: '573',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Organic Search' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '493',
						},
						{
							value: '574',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Referral' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '291',
						},
						{
							value: '279',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Referral' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '292',
						},
						{
							value: '280',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Social' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '10',
						},
						{
							value: '4',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Social' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '11',
						},
						{
							value: '5',
						},
					],
				},
			],
			totals: [
				{
					dimensionValues: [
						{ value: 'RESERVED_TOTAL' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '1788',
						},
						{
							value: '1724',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'RESERVED_TOTAL' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '1789',
						},
						{
							value: '1725',
						},
					],
				},
			],
		};

		expect( isSingleSlice( report ) ).toBe( false );
	} );

	it( 'returns false for a report that does not have one row contributing 100% of the total for a given dimension', () => {
		const report = {
			rows: [
				{
					dimensionValues: [
						{ value: 'Direct' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '995',
						},
						{
							value: '868',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Direct' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '996',
						},
						{
							value: '869',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Organic Search' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '492',
						},
						{
							value: '573',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Organic Search' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '493',
						},
						{
							value: '574',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Referral' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '291',
						},
						{
							value: '279',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Referral' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '292',
						},
						{
							value: '280',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Social' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '10',
						},
						{
							value: '4',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'Social' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '11',
						},
						{
							value: '5',
						},
					],
				},
			],
			totals: [
				{
					dimensionValues: [
						{ value: 'RESERVED_TOTAL' },
						{ value: 'date_range_0' },
					],
					metricValues: [
						{
							value: '1788',
						},
						{
							value: '1724',
						},
					],
				},
				{
					dimensionValues: [
						{ value: 'RESERVED_TOTAL' },
						{ value: 'date_range_1' },
					],
					metricValues: [
						{
							value: '1789',
						},
						{
							value: '1725',
						},
					],
				},
			],
		};

		expect( isSingleSlice( report ) ).toBe( false );
	} );
} );
