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
	isValidDateRange,
	isValidOrders,
	isValidOrdersGA4,
	isValidStringularItems,
} from './report-validation';

describe( 'Reporting API validation', () => {
	describe( 'isValidDateRange', () => {
		it( 'should return TRUE if dateRange is valid only', () => {
			expect(
				isValidDateRange( {
					dateRange: 'last-14-days',
				} )
			).toBeTruthy();
		} );

		it( 'should return TRUE if startDate and endDate are valid only', () => {
			expect(
				isValidDateRange( {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
				} )
			).toBeTruthy();
		} );

		it( 'should return FALSE if neither dateRange nor start/end dates are valid', () => {
			expect(
				isValidDateRange( {
					dateRange: 'xxx',
					startDate: '2020',
					endDate: '2020-01-01',
				} )
			).toBeFalsy();
		} );
	} );

	describe( 'isValidStringularItems', () => {
		it( 'should return TRUE if items is string', () => {
			expect( isValidStringularItems( 'device' ) ).toBe( true );
		} );

		it( 'should return TRUE if items is an array of strings', () => {
			expect( isValidStringularItems( [ 'device', 'page' ] ) ).toBe(
				true
			);
		} );

		it( 'should return FALSE if items is neither a string nor an array', () => {
			expect( isValidStringularItems( 5 ) ).toBe( false );
			expect( isValidStringularItems( [ 'device', null ] ) ).toBe(
				false
			);
		} );
	} );

	describe( 'isValidOrders', () => {
		it( 'should return TRUE if a single valid order object is passed', () => {
			expect(
				isValidOrders( {
					fieldName: 'city',
					sortOrder: 'ASCENDING',
				} )
			).toBeTruthy();
		} );

		it( 'should return TRUE if multiple valid order objects are passed', () => {
			expect(
				isValidOrders( [
					{
						fieldName: 'city',
						sortOrder: 'ASCENDING',
					},
					{
						fieldName: 'country',
						sortOrder: 'DESCENDING',
					},
				] )
			).toBeTruthy();
		} );

		it( 'should return FALSE if a non object item is passed in the array', () => {
			expect(
				isValidOrders( [
					{
						fieldName: 'city',
						sortOrder: 'ASCENDING',
					},
					15,
					{
						fieldName: 'country',
						sortOrder: 'DESCENDING',
					},
				] )
			).toBeFalsy();
		} );

		it( 'should return FALSE if a non object item is passed', () => {
			expect( isValidOrders( 'test' ) ).toBeFalsy();
		} );

		it( 'should return FALSE if invalid sortOrder is passed', () => {
			expect(
				isValidOrders( {
					fieldName: 'city',
					sortOrder: 'test',
				} )
			).toBeFalsy();
		} );

		it( 'should return FALSE if fieldName is undefined', () => {
			expect(
				isValidOrders( {
					sortOrder: 'DESCENDING',
				} )
			).toBeFalsy();
		} );
	} );

	describe( 'isValidOrdersGA4', () => {
		it( 'should return TRUE if an array of valid order objects is passed', () => {
			expect(
				isValidOrdersGA4( [
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
				] )
			).toBeTruthy();
		} );

		it( 'should return FALSE if an array is not passed', () => {
			expect( isValidOrdersGA4( null ) ).toBeFalsy();
			expect( isValidOrdersGA4( 'test' ) ).toBeFalsy();
			expect( isValidOrdersGA4( { test: 123 } ) ).toBeFalsy();
		} );

		it( 'should return FALSE if a non-object is passed in the array', () => {
			expect( isValidOrdersGA4( [ null ] ) ).toBeFalsy();
			expect( isValidOrdersGA4( [ 'test' ] ) ).toBeFalsy();
			expect( isValidOrdersGA4( [ { test: 123 } ] ) ).toBeFalsy();
		} );

		it( 'should return FALSE if metric and dimension are both undefined', () => {
			expect(
				isValidOrdersGA4( [
					{
						desc: false,
					},
				] )
			).toBeFalsy();
		} );

		it( 'should return FALSE if metric and dimension are both defined', () => {
			expect(
				isValidOrdersGA4( [
					{
						metric: {
							metricName: 'totalUsers',
						},
						dimension: {
							dimensionName: 'date',
						},
						desc: false,
					},
				] )
			).toBeFalsy();
		} );

		it( 'should return FALSE if metric is defined but metricName is not', () => {
			expect(
				isValidOrdersGA4( [
					{
						metric: {},
						desc: false,
					},
				] )
			).toBeFalsy();
		} );

		it( 'should return FALSE if metricName is defined but not a string', () => {
			expect(
				isValidOrdersGA4( [
					{
						metric: {
							metricName: 123,
						},
						desc: false,
					},
				] )
			).toBeFalsy();
		} );

		it( 'should return FALSE if dimension is defined but dimensionName is not', () => {
			expect(
				isValidOrdersGA4( [
					{
						dimension: {},
						desc: false,
					},
				] )
			).toBeFalsy();
		} );

		it( 'should return FALSE if dimensionName is defined but not a string', () => {
			expect(
				isValidOrdersGA4( [
					{
						dimension: {
							dimensionName: 123,
						},
						desc: false,
					},
				] )
			).toBeFalsy();
		} );

		it( 'should return FALSE if desc is not a boolean', () => {
			expect(
				isValidOrdersGA4( [
					{
						metric: {
							metricName: 'totalUsers',
						},
						desc: 'test',
					},
				] )
			).toBeFalsy();
		} );
	} );
} );
