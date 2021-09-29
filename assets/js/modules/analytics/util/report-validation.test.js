/**
 * Tests for reporting API validation utilities.
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
 * Internal dependencies
 */
import {
	isValidDimensions,
	isValidDimensionFilters,
	isValidMetrics,
} from './report-validation';

describe( 'Analytics Reporting API validation', () => {
	describe( 'isValidDimensions', () => {
		it( 'should return TRUE if a non empty string is passed', () => {
			expect( isValidDimensions( 'test' ) ).toBe( true );
		} );

		it( 'should return TRUE if a valid object is passed', () => {
			expect(
				isValidDimensions( {
					name: 'test',
				} )
			).toBe( true );
		} );

		it( 'should return TRUE if a valid array of objects/strings is passed', () => {
			expect(
				isValidDimensions( [
					{
						name: 'test',
					},
					'test2',
					'test3',
					{
						name: 'test4',
					},
				] )
			).toBe( true );
		} );

		it( 'should return FALSE if neither string nor array is passed', () => {
			expect( isValidDimensions( 5.2 ) ).toBe( false );
		} );

		it( 'should return FALSE if not a valid array of objects/strings is passed', () => {
			expect(
				isValidDimensions( [
					{
						name: 'test',
					},
					'test2',
					5,
					{
						name: 'test4',
					},
				] )
			).toBe( false );
		} );
	} );

	describe( 'isValidDimensionFilters', () => {
		it( 'should return TRUE if a valid object is passed with a valid dimension', () => {
			expect( isValidDimensionFilters( { test: 'foo' } ) ).toBe( true );
			expect( isValidDimensionFilters( { foo: 3 } ) ).toBe( true );
			expect( isValidDimensionFilters( { foo: [ 3, 'foo' ] } ) ).toBe(
				true
			);
		} );
		it( 'should return TRUE if no dimensionFilters are passed.', () => {
			expect( isValidDimensionFilters( {} ) ).toBe( true );
			expect( isValidDimensionFilters( {} ) ).toBe( true );
		} );
		it( 'should return FALSE if an invalid dimensionFilters object is passed', () => {
			expect( isValidDimensionFilters( { foo: false } ) ).toBe( false );
			expect( isValidDimensionFilters( { foo: 'bar', baz: null } ) ).toBe(
				false
			);
		} );
	} );

	describe( 'isValidMetrics', () => {
		it( 'should return TRUE if a non empty string is passed', () => {
			expect( isValidMetrics( 'test' ) ).toBe( true );
		} );

		it( 'should return TRUE if a valid object is passed', () => {
			expect(
				isValidMetrics( {
					expression: 'test',
					alias: 'Test',
				} )
			).toBe( true );

			// 'alias' is optional.
			expect(
				isValidMetrics( {
					expression: 'test',
				} )
			).toBe( true );
		} );

		it( 'should return TRUE if a valid array of objects/strings is passed', () => {
			expect(
				isValidMetrics( [
					{
						expression: 'test',
						alias: 'Test',
					},
					'test2',
					'test3',
					{
						expression: 'test4',
						alias: 'Test4',
					},
					{ expression: 'test5' },
				] )
			).toBe( true );
		} );

		it( 'should return FALSE if neither string nor array is passed', () => {
			expect( isValidMetrics( 5.2 ) ).toBe( false );
		} );

		it( 'should return FALSE if not a valid array of objects/strings is passed', () => {
			expect(
				isValidMetrics( [
					{
						expression: 'test',
						alias: 'Test',
					},
					'test2',
					5,
					{
						expression: 'test4',
						alias: 'Test4',
					},
				] )
			).toBe( false );
		} );
	} );
} );
