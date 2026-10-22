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
	it( "should show each row's count and its share of the report's total", () => {
		// The report's total also counts the 30 visits of the channels that
		// its `limit` leaves out.
		const report = createBreakdownReport(
			[
				[ 'Direct', 50 ],
				[ 'Organic Search', 30 ],
				[ 'Referral', 10 ],
			],
			120
		);

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '50', secondaryValue: '(41.7%)' },
			{ label: 'Organic Search', value: '30', secondaryValue: '(25.0%)' },
			{ label: 'Referral', value: '10', secondaryValue: '(8.3%)' },
		] );
	} );

	it( 'should add the missing tenth of a percent to the share with the largest remainder', () => {
		// 96, 41, and 17 of 157 visits are 61.15%, 26.11%, and 10.83%, and the
		// other 3 visits are 1.91%. Their whole tenths add up to 99.9%, and
		// 61.15% has the largest remainder.
		const report = createBreakdownReport(
			[
				[ 'Direct', 96 ],
				[ 'Organic Search', 41 ],
				[ 'Organic Social', 17 ],
			],
			157
		);

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(61.2%)', '(26.1%)', '(10.8%)' ] );
	} );

	it( 'should show shares that add up to 100% when the rows count the whole total', () => {
		const report = createBreakdownReport(
			[
				[ 'Direct', 1 ],
				[ 'Organic Search', 1 ],
				[ 'Referral', 1 ],
			],
			3
		);

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(33.4%)', '(33.3%)', '(33.3%)' ] );
	} );

	it( 'should show "<0.1%" for a share under a tenth of a percent when the rest of the total gets the missing tenth', () => {
		// 5,000 and 1 of 10,000 views are 50% and 0.01%, and the other 4,999
		// views are 49.99%.
		const report = createBreakdownReport(
			[
				[ '/ice-cream/', 5000 ],
				[ '/spf/', 1 ],
			],
			10000
		);

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(50.0%)', '(<0.1%)' ] );
	} );

	it( 'should show "99.9%" rather than "100.0%" for a row below the total, and add the missing tenth to another row', () => {
		const report = createBreakdownReport(
			[
				[ 'Direct', 2999 ],
				[ 'Email', 1 ],
			],
			3000
		);

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(99.9%)', '(0.1%)' ] );
	} );

	it( 'should show "100.0%" for a row with the whole total', () => {
		const report = createBreakdownReport( [ [ 'Direct', 40 ] ], 40 );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '40', secondaryValue: '(100.0%)' },
		] );
	} );

	it( 'should show a count of a thousand or more in the short form the dashboard uses, such as "12K"', () => {
		const report = createBreakdownReport( [ [ 'Direct', 12345 ] ], 12345 );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '12K', secondaryValue: '(100.0%)' },
		] );
	} );

	it( 'should leave out the values with no count', () => {
		const report = createBreakdownReport(
			[
				[ 'Direct', 5 ],
				[ 'Paid Search', 0 ],
				[ 'Referral', 3 ],
			],
			8
		);

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '5', secondaryValue: '(62.5%)' },
			{ label: 'Referral', value: '3', secondaryValue: '(37.5%)' },
		] );
	} );

	it( 'should not return a row when no value in the report has a count', () => {
		const report = createBreakdownReport(
			[
				[ 'Direct', 0 ],
				[ 'Referral', 0 ],
			],
			0
		);

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [] );
	} );

	it( 'should not show a share when the report has no total', () => {
		const report = createBreakdownReport( [ [ 'Direct', 5 ] ] );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '5', secondaryValue: undefined },
		] );
	} );

	it( 'should sort the rows by count, most first', () => {
		const report = createBreakdownReport( [
			[ 'blog.example.com', 1 ],
			[ 'news.example.com', 5 ],
			[ 'forum.example.com', 3 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { label } ) => label
			)
		).toEqual( [
			'news.example.com',
			'forum.example.com',
			'blog.example.com',
		] );
	} );

	it( 'should keep the order of the report for values with the same count', () => {
		const report = createBreakdownReport( [
			[ 'forum.example.com', 2 ],
			[ 'blog.example.com', 2 ],
			[ 'news.example.com', 2 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { label } ) => label
			)
		).toEqual( [
			'forum.example.com',
			'blog.example.com',
			'news.example.com',
		] );
	} );

	it( 'should show at most three rows, picked after the sort', () => {
		const report = createBreakdownReport( [
			[ '/a/', 1 ],
			[ '/b/', 2 ],
			[ '/c/', 3 ],
			[ '/d/', 4 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { label } ) => label
			)
		).toEqual( [ '/d/', '/c/', '/b/' ] );
	} );

	it( 'should keep the dimension value as the label, exactly as the report returned it', () => {
		const report = createBreakdownReport( [ [ '(not set)', 4 ] ], 4 );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: '(not set)', value: '4', secondaryValue: '(100.0%)' },
		] );
	} );

	it( 'should not return a row for a report whose `rows` is an empty array', () => {
		expect(
			getRecentTrafficBreakdownRows( createBreakdownReport( [] ) )
		).toEqual( [] );
	} );

	it( 'should not return a row for a report with no `rows`', () => {
		expect( getRecentTrafficBreakdownRows( {} ) ).toEqual( [] );
	} );

	it( 'should not return a row when there is no report', () => {
		expect( getRecentTrafficBreakdownRows() ).toEqual( [] );
	} );
} );
