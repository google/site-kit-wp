/**
 * Recent traffic breakdown rows helper tests.
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
import { getRecentTrafficBreakdownRows } from './getRecentTrafficBreakdownRows';

describe( 'getRecentTrafficBreakdownRows', () => {
	it( "should show each row's count and its share of the given total, such as 82 of 157 visitors as 52.2%", () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [
					[ 'Direct', 82 ],
					[ 'Organic Search', 21 ],
					[ 'Referral', 8 ],
				] ),
				157
			)
		).toEqual( [
			{ label: 'Direct', value: '82', secondaryValue: '(52.2%)' },
			{ label: 'Organic Search', value: '21', secondaryValue: '(13.4%)' },
			{ label: 'Referral', value: '8', secondaryValue: '(5.1%)' },
		] );
	} );

	it( 'should show shares that add up to more than 100% when one visitor counts in several rows', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [
					[ '/a/', 80 ],
					[ '/b/', 60 ],
					[ '/c/', 40 ],
				] ),
				100
			).map( ( { secondaryValue } ) => secondaryValue )
		).toEqual( [ '(80.0%)', '(60.0%)', '(40.0%)' ] );
	} );

	it( 'should show no share when no total is given, even when the report has its own total', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [ [ 'google.com', 5 ] ], 5 )
			)
		).toEqual( [
			{ label: 'google.com', value: '5', secondaryValue: undefined },
		] );
	} );

	it( 'should show "<0.1%" for a share under a twentieth of a percent', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [
					[ '/ice-cream/', 5000 ],
					[ '/spf/', 1 ],
				] ),
				10000
			).map( ( { secondaryValue } ) => secondaryValue )
		).toEqual( [ '(50.0%)', '(<0.1%)' ] );
	} );

	it( 'should show "99.9%" rather than "100.0%" for a row below the total', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [ [ 'Direct', 2999 ] ] ),
				3000
			).map( ( { secondaryValue } ) => secondaryValue )
		).toEqual( [ '(99.9%)' ] );
	} );

	it( 'should show "100.0%" for a row with the whole total', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [ [ 'Direct', 40 ] ] ),
				40
			)
		).toEqual( [
			{ label: 'Direct', value: '40', secondaryValue: '(100.0%)' },
		] );
	} );

	it( 'should show a count of a thousand or more in the short form the dashboard uses, such as "12K"', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [ [ 'Direct', 12345 ] ] ),
				24690
			)
		).toEqual( [
			{ label: 'Direct', value: '12K', secondaryValue: '(50.0%)' },
		] );
	} );

	it( 'should leave out the values with no count', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [
					[ 'Direct', 5 ],
					[ 'Paid Search', 0 ],
					[ 'Referral', 3 ],
				] ),
				8
			)
		).toEqual( [
			{ label: 'Direct', value: '5', secondaryValue: '(62.5%)' },
			{ label: 'Referral', value: '3', secondaryValue: '(37.5%)' },
		] );
	} );

	it( 'should not return a row when no value in the report has a count', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [
					[ 'Direct', 0 ],
					[ 'Referral', 0 ],
				] ),
				0
			)
		).toEqual( [] );
	} );

	it( 'should sort the rows by count, most first', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [
					[ 'blog.example.com', 1 ],
					[ 'news.example.com', 5 ],
					[ 'forum.example.com', 3 ],
				] )
			).map( ( { label } ) => label )
		).toEqual( [
			'news.example.com',
			'forum.example.com',
			'blog.example.com',
		] );
	} );

	it( 'should keep the order of the report for values with the same count', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [
					[ 'forum.example.com', 2 ],
					[ 'blog.example.com', 2 ],
					[ 'news.example.com', 2 ],
				] )
			).map( ( { label } ) => label )
		).toEqual( [
			'forum.example.com',
			'blog.example.com',
			'news.example.com',
		] );
	} );

	it( 'should show at most three rows, picked after the sort', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [
					[ '/a/', 1 ],
					[ '/b/', 2 ],
					[ '/c/', 3 ],
					[ '/d/', 4 ],
				] )
			).map( ( { label } ) => label )
		).toEqual( [ '/d/', '/c/', '/b/' ] );
	} );

	it( 'should keep the dimension value as the label, exactly as the report returned it', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [ [ '(not set)', 4 ] ] ),
				8
			)
		).toEqual( [
			{ label: '(not set)', value: '4', secondaryValue: '(50.0%)' },
		] );
	} );

	it( 'should not return a row for a report whose `rows` is an empty array', () => {
		expect(
			getRecentTrafficBreakdownRows( createBreakdownReport( [] ), 10 )
		).toEqual( [] );
	} );

	it( 'should not return a row for a report with no `rows`', () => {
		expect( getRecentTrafficBreakdownRows( {}, 10 ) ).toEqual( [] );
	} );

	it( 'should not return a row when there is no report', () => {
		expect( getRecentTrafficBreakdownRows() ).toEqual( [] );
	} );
} );
