/**
 * Tests for utility to filter out Analytics report rows which don't have a value set.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

import { reportRowsWithSetValues } from './report-rows-with-set-values';

describe( 'reportRowsWithSetValues', () => {
	let mockRows;

	beforeEach( () => {
		mockRows = [
			{ dimensionValues: [ { value: 'value1' } ] },
			{ dimensionValues: [ { value: '(not set)' } ] },
			{ dimensionValues: [ { value: '' } ] },
			{ dimensionValues: [ { value: 'value2' } ] },
			{ dimensionValues: [ { value: 'value3' } ] },
			{ dimensionValues: [ { value: 'value4' } ] },
		];
	} );

	it( 'should return rows with set dimension values only', () => {
		const result = reportRowsWithSetValues( mockRows );
		expect( result ).toEqual( [
			{ dimensionValues: [ { value: 'value1' } ] },
			{ dimensionValues: [ { value: 'value2' } ] },
			{ dimensionValues: [ { value: 'value3' } ] },
		] );
	} );

	it( 'should limit the number of returned rows to maxRows', () => {
		const result = reportRowsWithSetValues( mockRows, 2 );
		expect( result ).toEqual( [
			{ dimensionValues: [ { value: 'value1' } ] },
			{ dimensionValues: [ { value: 'value2' } ] },
		] );
	} );

	it( 'should handle maxRows greater than the number of filtered rows', () => {
		const result = reportRowsWithSetValues( mockRows, 10 );
		expect( result ).toEqual( [
			{ dimensionValues: [ { value: 'value1' } ] },
			{ dimensionValues: [ { value: 'value2' } ] },
			{ dimensionValues: [ { value: 'value3' } ] },
			{ dimensionValues: [ { value: 'value4' } ] },
		] );
	} );

	it( 'should handle empty rows input', () => {
		const result = reportRowsWithSetValues( [] );
		expect( result ).toEqual( [] );
	} );

	it( 'should handle rows where all values are "(not set)"', () => {
		const allNotSetRows = [
			{ dimensionValues: [ { value: '(not set)' } ] },
			{ dimensionValues: [ { value: '(not set)' } ] },
		];
		const result = reportRowsWithSetValues( allNotSetRows );
		expect( result ).toEqual( [] );
	} );

	it( 'should handle rows where all values are blank', () => {
		const allBlankRows = [
			{ dimensionValues: [ { value: '' } ] },
			{ dimensionValues: [ { value: '' } ] },
		];
		const result = reportRowsWithSetValues( allBlankRows );
		expect( result ).toEqual( [] );
	} );

	it( 'should return an empty array when maxRows is 0', () => {
		const result = reportRowsWithSetValues( mockRows, 0 );
		expect( result ).toEqual( [] );
	} );

	it( 'should use the default maxRows value of 3 when not specified', () => {
		const result = reportRowsWithSetValues( mockRows );
		expect( result ).toHaveLength( 3 );
	} );
} );
