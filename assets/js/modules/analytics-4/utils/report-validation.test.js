/**
 * Tests for Analytics 4 reporting API validation utilities.
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
 * Internal dependencies
 */
import {
	isValidDimensions,
	isValidDimensionFilters,
	isValidMetrics,
	isValidOrders,
} from './report-validation';

describe( 'Analytics 4 Reporting API validation', () => {
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
		it.each( [
			[
				'a string filter is passed using short notation',
				{ test: 'foo' },
			],
			[
				'an in-list filter is passed using short notation',
				{ foo: [ 'foo', 'bar' ] },
			],
			[ 'an empty object is passed', {} ],
			[
				'a filter with expanded notation is used',
				{ test: { filterType: 'inList', value: [ 'a', 'b', 'c' ] } },
			],
		] )( 'should return TRUE if %s', ( _, filters ) => {
			expect( isValidDimensionFilters( filters ) ).toBe( true );
		} );

		it.each( [
			[ 'an invalid filter is passed', { foo: false } ],
			[
				'a mixed values are passed in short notation',
				{ foo: [ 3, 'foo' ] },
			],
			[
				'a filter with the expanded notation misses the filterType property',
				{ test: { value: [ 'a', 'b', 'c' ] } },
			],
			[
				'a filter with the expanded notation misses the value property',
				{ test: { filterType: 'inList', values: [ 'a', 'b', 'c' ] } },
			],
		] )( 'should return FALSE if %s', ( _, filters ) => {
			expect( isValidDimensionFilters( filters ) ).toBe( false );
		} );
	} );

	describe( 'isValidMetrics', () => {
		it( 'should return TRUE if a non empty string is passed', () => {
			expect( isValidMetrics( 'test' ) ).toBe( true );
		} );

		it( 'should return TRUE if a comma separated list of strings is passed', () => {
			expect( isValidMetrics( 'test1,test2,test3' ) ).toBe( true );
		} );

		it( 'should return TRUE if a valid object is passed', () => {
			expect(
				isValidMetrics( {
					expression: 'test',
					name: 'Test',
				} )
			).toBe( true );

			// 'name' is optional.
			expect(
				isValidMetrics( {
					name: 'test',
				} )
			).toBe( true );
		} );

		it( 'should return TRUE if a valid array of objects/strings is passed', () => {
			expect(
				isValidMetrics( [
					{
						expression: 'test',
						name: 'Test',
					},
					'test2',
					'test3',
					{
						expression: 'test4',
						name: 'Test4',
					},
					{ name: 'test5' },
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
						name: 'Test',
					},
					'test2',
					5,
					{
						expression: 'test4',
						name: 'Test4',
					},
				] )
			).toBe( false );
		} );

		it( "should return FALSE if a metric name is passed that doesn't match the required regular expression ^[a-zA-Z0-9_]+$", () => {
			// Test the empty string cases.
			expect( isValidMetrics( '' ) ).toBe( false );
			expect( isValidMetrics( ',test' ) ).toBe( false );
			expect( isValidMetrics( 'test,' ) ).toBe( false );
			expect( isValidMetrics( { name: '' } ) ).toBe( false );
			expect( isValidMetrics( [ { name: '' } ] ) ).toBe( false );
			expect( isValidMetrics( [ { name: 'test' }, '' ] ) ).toBe( false );
			expect(
				isValidMetrics( [ { name: '', expression: 'test' } ] )
			).toBe( false );

			// Test the invalid character cases.
			// Please note this is not a comprehensive list of invalid characters, as that would be a very long list. This is just a representative sample.
			const invalidCharacters =
				' !"#$%&\'()*+,-./:;<=>?@[\\]^`{|}~ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïð';

			invalidCharacters.split( '' ).forEach( ( character ) => {
				const invalidName = `test${ character }`;

				expect( isValidMetrics( invalidName ) ).toBe( false );
				expect( isValidMetrics( `test,${ invalidName }` ) ).toBe(
					false
				);
				expect( isValidMetrics( { name: invalidName } ) ).toBe( false );
				expect( isValidMetrics( [ { name: invalidName } ] ) ).toBe(
					false
				);
				expect(
					isValidMetrics( [ { name: 'test' }, invalidName ] )
				).toBe( false );
				expect(
					isValidMetrics( [
						{ name: invalidName, expression: 'test' },
					] )
				).toBe( false );
			} );
		} );
	} );

	describe( 'isValidOrders', () => {
		it.each( [
			[
				true,
				'an array of valid order objects is passed',
				[
					{
						metric: {
							metricName: 'totalUsers',
						},
						desc: false,
					},
					{
						metric: {
							metricName: 'sessions',
						},
						desc: true,
					},
					{
						dimension: {
							dimensionName: 'date',
						},
						desc: true,
					},
					{
						dimension: {
							dimensionName: 'sessionDefaultChannelGrouping',
						},
					},
				],
			],
			[ false, 'an array is not passed (null)', null ],
			[ false, 'an array is not passed (string)', 'test' ],

			[ false, 'an array is not passed (object)', { test: 123 } ],
			[ false, 'a non-object is passed in the array (null)', [ null ] ],
			[
				false,
				'a non-object is passed in the array (string)',
				[ 'test' ],
			],
			[
				false,
				'a non-object is passed in the array (object)',
				[ { test: 123 } ],
			],
			[
				false,
				'metric and dimension are both undefined',
				[
					{
						desc: false,
					},
				],
			],
			[
				false,
				'metric and dimension are both defined',
				[
					{
						metric: {
							metricName: 'totalUsers',
						},
						dimension: {
							dimensionName: 'date',
						},
						desc: false,
					},
				],
			],
			[
				false,
				'metric is defined but metricName is not',
				[
					{
						metric: {},
						desc: false,
					},
				],
			],
			[
				false,
				'metricName is defined but not a string',
				[
					{
						metric: {
							metricName: 123,
						},
						desc: false,
					},
				],
			],
			[
				false,
				'dimension is defined but dimensionName is not',
				[
					{
						dimension: {},
						desc: false,
					},
				],
			],
			[
				false,
				'dimensionName is defined but not a string',
				[
					{
						dimension: {
							dimensionName: 123,
						},
						desc: false,
					},
				],
			],
			[
				false,
				'desc is defined but not a boolean',
				[
					{
						metric: {
							metricName: 'totalUsers',
						},
						desc: 'test',
					},
				],
			],
		] )(
			'should return %s if %s',
			( expectedResult, testDescription, order ) => {
				expect( isValidOrders( order ) ).toBe( expectedResult );
			}
		);
	} );
} );
