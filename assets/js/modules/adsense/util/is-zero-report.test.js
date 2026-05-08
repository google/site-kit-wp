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

const validReport = {
	totalMatchedRows: '1',
	headers: [
		{
			name: 'TOTAL_EARNINGS',
			type: 'METRIC_CURRENCY',
			currencyCode: 'EUR',
		},
		{
			name: 'IMPRESSIONS',
			type: 'METRIC_TALLY',
		},
		{
			name: 'PAGE_VIEWS_RPM',
			type: 'METRIC_CURRENCY',
			currencyCode: 'EUR',
		},
	],
	rows: [
		{
			cells: [
				{
					value: '0.00',
				},
				{
					value: '20075',
				},
				{
					value: '2.60',
				},
			],
		},
	],
	totals: {
		cells: [
			{
				value: '0.00',
			},
			{
				value: '20075',
			},
			{
				value: '2.60',
			},
		],
	},
	averages: {
		cells: [
			{
				value: '0.00',
			},
			{
				value: '20075',
			},
			{
				value: '0.00',
			},
		],
	},
	warnings: [
		'Some of the requested metrics are not available for some of the ad clients used by this report.',
	],
	startDate: {
		year: 2021,
		month: 6,
		day: 1,
	},
	endDate: {
		year: 2021,
		month: 6,
		day: 20,
	},
};

describe( 'isZeroReport', () => {
	it.each( [
		[ 'NULL', null ],
		[ 'FALSE', false ],
		[ 'a number', 1 ],
		[ 'a string', 'test' ],
		[ 'an empty object', {} ],
		[ 'an object without totals', { rows: [ [] ] } ],
		[ 'an object with invalid totals', { rows: [ [] ], totals: 11 } ],
		[ 'an object without rows', { totals: [ 1 ] } ],
		[ 'an object with invalid rows', { rows: 12, totals: [ 1 ] } ],
	] )( 'should return TRUE when %s is passed', ( _, report ) => {
		expect( isZeroReport( report, 1 ) ).toBe( true );
	} );

	it( 'should return FALSE when a valid object is passed', () => {
		expect( isZeroReport( validReport, 1 ) ).toBe( false );
	} );

	it( 'should return undefined when an undefined value is passed', () => {
		expect( isZeroReport( undefined, 1 ) ).toBeUndefined();
	} );
} );
