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
	it( 'returns undefined when undefined is passed', () => {
		expect( isZeroReport( undefined ) ).toBe( undefined );
	} );

	it.each( [
		[ 'NULL', null ],
		[ 'FALSE', false ],
		[ 'a number', 1 ],
		[ 'a string', 'test' ],
		[ 'an empty object', {} ],
		[ 'an object with empty rows', { rows: [] } ],
		[ 'an object with empty totals', { totals: [] } ],
	] )( 'returns true when %s is passed', ( _, report ) => {
		expect( isZeroReport( report ) ).toBe( true );
	} );

	it( 'returns true for a report that has no data within a single total with a single value', () => {
		const reportSingleTotal = {
			rows: [ {}, {}, {} ],
			totals: [
				{
					metricValues: [ { value: '0' } ],
				},
			],
		};

		expect( isZeroReport( reportSingleTotal ) ).toBe( true );
	} );

	it( 'returns true for a report that has no data within a single total with multiple values', () => {
		const report = {
			rows: [ {}, {}, {} ],
			totals: [
				{
					metricValues: [ { value: '0' }, { value: '0' } ],
				},
			],
		};

		expect( isZeroReport( report ) ).toBe( true );
	} );

	it( 'returns true for a report that has no data within multiple totals with multiple values', () => {
		const reportMultipleTotals = {
			rows: [ {}, {}, {} ],
			totals: [
				{
					metricValues: [ { value: '0' }, { value: '0' } ],
				},
				{
					metricValues: [ { value: '0' }, { value: '0' } ],
				},
			],
		};

		expect( isZeroReport( reportMultipleTotals ) ).toBe( true );
	} );

	it( 'returns false for a report that has data', () => {
		const report = {
			rows: [ {}, {}, {} ],
			totals: [
				{
					metricValues: [ { value: '123' }, { value: '234' } ],
				},
			],
		};

		expect( isZeroReport( report ) ).toBe( false );
	} );

	it( 'returns false for a report that has data with a zero value', () => {
		const report = {
			rows: [ {}, {}, {} ],
			totals: [
				{
					metricValues: [ { value: '0' }, { value: '123' } ],
				},
			],
		};

		expect( isZeroReport( report ) ).toBe( false );
	} );

	it( 'returns false for a report that has data with multiple totals', () => {
		const report = {
			rows: [ {}, {}, {} ],
			totals: [
				{
					metricValues: [ { value: '123' }, { value: '234' } ],
				},
				{
					metricValues: [ { value: '0' }, { value: '345' } ],
				},
			],
		};

		expect( isZeroReport( report ) ).toBe( false );
	} );

	it( 'returns false for a report that has data with a single value', () => {
		const report = {
			rows: [ {}, {}, {} ],
			totals: [
				{
					metricValues: [ { value: '123' } ],
				},
			],
		};

		expect( isZeroReport( report ) ).toBe( false );
	} );
} );
