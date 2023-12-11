/**
 * Tests for report utilities.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
		[ true, 'FALSE', false ],
		[ true, 'a number', 1 ],
		[ true, 'a string', 'test' ],
		[ true, 'an empty object', {} ],
		[ true, 'an object without rows or totals', [ { data: {} } ] ],
		[ true, 'an object with empty rows', [ { data: { rows: [] } } ] ],
		[ true, 'an object with empty totals', [ { data: { totals: [] } } ] ],
		[
			true,
			'a report that has no data within a single total with a single value',
			[
				{
					data: {
						rows: [ {}, {}, {} ],
						totals: [ { values: [ '0' ] } ],
					},
				},
			],
		],
		[
			true,
			'a report that has no data within a single total with multiple values',
			[
				{
					data: {
						rows: [ {}, {}, {} ],
						totals: [ { values: [ '0', '0' ] } ],
					},
				},
			],
		],
		[
			true,
			'a report that has no data within multiple totals with multiple values',
			[
				{
					data: {
						rows: [ {}, {}, {} ],
						totals: [
							{ values: [ '0', '0' ] },
							{ values: [ '0', '0' ] },
						],
					},
				},
			],
		],
		[
			false,
			'a report that has data',
			[
				{
					data: {
						rows: [ {}, {}, {} ],
						totals: [ { values: [ '123', '234' ] } ],
					},
				},
			],
		],
		[
			false,
			'a report that has data with a zero value',
			[
				{
					data: {
						rows: [ {}, {}, {} ],
						totals: [ { values: [ '0', '123' ] } ],
					},
				},
			],
		],
		[
			false,
			'a report that has data with multiple totals',
			[
				{
					data: {
						rows: [ {}, {}, {} ],
						totals: [
							{ values: [ '123', '234' ] },
							{ values: [ '0', '345' ] },
						],
					},
				},
			],
		],
		[
			false,
			'a report that has data with a single value',
			[
				{
					data: {
						rows: [ {}, {}, {} ],
						totals: [ { values: [ '123' ] } ],
					},
				},
			],
		],
	] )( 'returns %s when %s is passed', ( expectedValue, _, report ) => {
		expect( isZeroReport( report ) ).toBe( expectedValue );
	} );
} );
