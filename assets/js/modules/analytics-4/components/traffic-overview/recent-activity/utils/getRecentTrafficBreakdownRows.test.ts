/**
 * Recent traffic breakdown row shaping tests.
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
	it( "should show each row's visitors and its share of the report's visitor total", () => {
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
			{ label: 'Organic Search', value: '30', secondaryValue: '(25%)' },
			{ label: 'Referral', value: '10', secondaryValue: '(8.3%)' },
		] );
	} );

	it( 'should show shares that add up to more than 100% when visitors appear in several rows, because the total counts each visitor once', () => {
		// 80 visitors read the two posts, and 30 of them read both.
		const report = createBreakdownReport(
			[
				[ '/ice-cream/', 60 ],
				[ '/hydration/', 50 ],
			],
			80
		);

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(75%)', '(62.5%)' ] );
	} );

	it( 'should round a share to one decimal place', () => {
		const report = createBreakdownReport(
			[
				[ '/autumn-recipes/', 2 ],
				[ '/winter-recipes/', 1 ],
			],
			3
		);

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(66.7%)', '(33.3%)' ] );
	} );

	it( 'should show a share that rounds to 0% as "<0.1%", and a share below 100% that rounds to 100% as ">99.9%"', () => {
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
		).toEqual( [ '(>99.9%)', '(<0.1%)' ] );
	} );

	it( 'should show a share of 0.05%, which rounds up, as "0.1%"', () => {
		const report = createBreakdownReport(
			[
				[ 'Direct', 1999 ],
				[ 'Email', 1 ],
			],
			2000
		);

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(>99.9%)', '(0.1%)' ] );
	} );

	it( 'should show a count of a thousand visitors or more in the short form the dashboard uses, such as "12K"', () => {
		const report = createBreakdownReport( [ [ 'Direct', 12345 ] ], 12345 );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '12K', secondaryValue: '(100%)' },
		] );
	} );

	it( 'should show 100% for a row with as many visitors as the total, even when other rows have visitors', () => {
		// Every visitor viewed the home page, and some of them read a post too.
		const report = createBreakdownReport(
			[
				[ '/', 40 ],
				[ '/ice-cream/', 12 ],
			],
			40
		);

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(100%)', '(30%)' ] );
	} );

	it( 'should stop a share at 100% when a row comes out above the total, because Analytics visitor counts are estimates', () => {
		const report = createBreakdownReport( [ [ 'Direct', 101 ] ], 100 );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '101', secondaryValue: '(100%)' },
		] );
	} );

	it( 'should leave out the values with no visitors', () => {
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

	it( 'should return no rows when no value in the report had visitors', () => {
		const report = createBreakdownReport(
			[
				[ 'Direct', 0 ],
				[ 'Referral', 0 ],
			],
			0
		);

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [] );
	} );

	it( 'should show no share when the report has no total, or a total of zero', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [ [ 'Direct', 5 ] ] )
			)
		).toEqual( [
			{ label: 'Direct', value: '5', secondaryValue: undefined },
		] );
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [ [ 'Direct', 5 ] ], 0 )
			)
		).toEqual( [
			{ label: 'Direct', value: '5', secondaryValue: undefined },
		] );
	} );

	it( 'should sort the rows by visitors, most visitors first', () => {
		const report = createBreakdownReport(
			[
				[ 'blog.example.com', 1 ],
				[ 'news.example.com', 5 ],
				[ 'forum.example.com', 3 ],
			],
			9
		);

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

	it( 'should keep the order of the report for values with the same visitors', () => {
		const report = createBreakdownReport(
			[
				[ 'forum.example.com', 2 ],
				[ 'blog.example.com', 2 ],
				[ 'news.example.com', 2 ],
			],
			6
		);

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

	it( 'should show no more than three rows, picked after the sort', () => {
		const report = createBreakdownReport(
			[
				[ '/a/', 1 ],
				[ '/b/', 2 ],
				[ '/c/', 3 ],
				[ '/d/', 4 ],
			],
			10
		);

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { label } ) => label
			)
		).toEqual( [ '/d/', '/c/', '/b/' ] );
	} );

	it( 'should keep the dimension value as the label, exactly as the report returned it', () => {
		const report = createBreakdownReport( [ [ '(not set)', 4 ] ], 4 );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: '(not set)', value: '4', secondaryValue: '(100%)' },
		] );
	} );

	it( 'should return no rows for an empty report, a report with no rows, and no report', () => {
		expect(
			getRecentTrafficBreakdownRows( createBreakdownReport( [], 0 ) )
		).toEqual( [] );
		expect( getRecentTrafficBreakdownRows( {} ) ).toEqual( [] );
		expect( getRecentTrafficBreakdownRows() ).toEqual( [] );
	} );
} );
