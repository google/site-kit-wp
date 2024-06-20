/**
 * Tests for report utilities.
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
import { isZeroReport } from './is-zero-report';

describe( 'isZeroReport', () => {
	it.each( [
		[ undefined, 'undefined', undefined ],
		[ true, 'NULL', null ],
		[ true, 'FALSE', false ],
		[ true, 'a number', 1 ],
		[ true, 'a string', 'test' ],
		[ true, 'an empty object', {} ],
		[ true, 'a report with rows but no totals', { rows: [ {}, {}, {} ] } ],
		[
			true,
			'a report with totals but no rows',
			{ totals: [ { metricValues: [ { value: '123' } ] } ] },
		],
		[
			true,
			'a report with rows but empty totals',
			{ rows: [ {}, {}, {} ], totals: [] },
		],
		[
			true,
			'a report with empty totals objects',
			{ rows: [ {}, {}, {} ], totals: [ {}, {}, {} ] },
		],
		[
			true,
			'a report that has no data within a single total with a single value',
			{
				rows: [ {}, {}, {} ],
				totals: [ { metricValues: [ { value: '0' } ] } ],
			},
		],
		[
			true,
			'a report that has no data within a single total with multiple values',
			{
				rows: [ {}, {}, {} ],
				totals: [
					{ metricValues: [ { value: '0' }, { value: '0' } ] },
				],
			},
		],
		[
			true,
			'a report that has no data within multiple totals with multiple values',
			{
				rows: [ {}, {}, {} ],
				totals: [
					{ metricValues: [ { value: '0' }, { value: '0' } ] },
					{ metricValues: [ { value: '0' }, { value: '0' } ] },
				],
			},
		],
		[
			false,
			'a report that has data',
			{
				rows: [ {}, {}, {} ],
				totals: [
					{
						metricValues: [ { value: '123' }, { value: '234' } ],
					},
				],
			},
		],
		[
			false,
			'a report that has data with a zero value',
			{
				rows: [ {}, {}, {} ],
				totals: [
					{ metricValues: [ { value: '0' }, { value: '123' } ] },
				],
			},
		],
		[
			false,
			'a report that has data with multiple totals',
			{
				rows: [ {}, {}, {} ],
				totals: [
					{ metricValues: [ { value: '123' }, { value: '234' } ] },
					{ metricValues: [ { value: '0' }, { value: '345' } ] },
				],
			},
		],
		[
			false,
			'a report that has data with a single value',
			{
				rows: [ {}, {}, {} ],
				totals: [ { metricValues: [ { value: '123' } ] } ],
			},
		],
		[
			false,
			'a report that has a single row with no metricValues but another with data',
			{
				rows: [ {}, {}, {} ],
				totals: [
					{},
					{ metricValues: [ { value: '123' }, { value: '234' } ] },
				],
			},
		],
		[
			true,
			'a report that has multiple rows that have no metricValues, and no rows with data',
			{
				rows: [ {}, {}, {} ],
				totals: [ {}, {} ],
			},
		],
		[
			false,
			'a report that has metric values and dimension values',
			{
				rows: [ {} ],
				totals: [
					{
						dimensionValues: [
							{
								value: 'RESERVED_TOTAL',
							},
							{
								value: 'date_range_1',
							},
						],
						metricValues: [
							{
								value: '1',
							},
						],
					},
				],
			},
		],
		// RE: bug report #8442 where GA4 appears to occasionally return boolean for totals rows.
		[
			true,
			'a report that has a boolean value for totals',
			{
				rows: [ {}, {}, {} ],
				totals: true,
			},
		],
	] )( 'returns %s when %s is passed', ( expectedValue, _, report ) => {
		expect( isZeroReport( report ) ).toBe( expectedValue );
	} );
} );
