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
	it( "should show each row's visitors and its share of the visitors of every value in the report, not only of the rows shown", () => {
		const report = createBreakdownReport( [
			[ 'Direct', 50 ],
			[ 'Organic Search', 30 ],
			[ 'Referral', 10 ],
			[ 'Organic Social', 6 ],
			[ 'Email', 4 ],
		] );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '50', secondaryValue: '(50%)' },
			{ label: 'Organic Search', value: '30', secondaryValue: '(30%)' },
			{ label: 'Referral', value: '10', secondaryValue: '(10%)' },
		] );
	} );

	it( 'should show shares that add up to 100% when the report has no more values than the column shows', () => {
		const report = createBreakdownReport( [
			[ 'substack.com', 5 ],
			[ 'reddit.com', 3 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(62.5%)', '(37.5%)' ] );
	} );

	it( 'should round a share to one decimal place', () => {
		const report = createBreakdownReport( [
			[ '/autumn-recipes/', 2 ],
			[ '/winter-recipes/', 1 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(66.7%)', '(33.3%)' ] );
	} );

	it( 'should show a share that rounds to 0% as "<0.1%", and a share below 100% that rounds to 100% as ">99.9%"', () => {
		const report = createBreakdownReport( [
			[ 'Direct', 2999 ],
			[ 'Email', 1 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(>99.9%)', '(<0.1%)' ] );
	} );

	it( 'should show a share of 0.05%, which rounds up, as "0.1%"', () => {
		const report = createBreakdownReport( [
			[ 'Direct', 1999 ],
			[ 'Email', 1 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(>99.9%)', '(0.1%)' ] );
	} );

	it( 'should show a count of a thousand visitors or more in the short form the dashboard uses, such as "12K"', () => {
		const report = createBreakdownReport( [ [ 'Direct', 12345 ] ] );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '12K', secondaryValue: '(100%)' },
		] );
	} );

	it( 'should show 100% for a value that is the only one with visitors', () => {
		const report = createBreakdownReport( [
			[ 'Direct', 7 ],
			[ 'Email', 0 ],
		] );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '7', secondaryValue: '(100%)' },
		] );
	} );

	it( 'should leave out the values with no visitors, and their rows take no part in the shares', () => {
		const report = createBreakdownReport( [
			[ 'Direct', 5 ],
			[ 'Paid Search', 0 ],
			[ 'Referral', 3 ],
		] );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '5', secondaryValue: '(62.5%)' },
			{ label: 'Referral', value: '3', secondaryValue: '(37.5%)' },
		] );
	} );

	it( 'should return no rows when the values in the report have a total of zero visitors', () => {
		const report = createBreakdownReport( [
			[ 'Direct', 0 ],
			[ 'Referral', 0 ],
		] );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [] );
	} );

	it( 'should sort the rows by visitors, most visitors first', () => {
		const report = createBreakdownReport( [
			[ 'medium.com', 1 ],
			[ 'substack.com', 5 ],
			[ 'reddit.com', 3 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { label } ) => label
			)
		).toEqual( [ 'substack.com', 'reddit.com', 'medium.com' ] );
	} );

	it( 'should keep the order of the report for values with the same visitors', () => {
		const report = createBreakdownReport( [
			[ 'reddit.com', 2 ],
			[ 'medium.com', 2 ],
			[ 'substack.com', 2 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { label } ) => label
			)
		).toEqual( [ 'reddit.com', 'medium.com', 'substack.com' ] );
	} );

	it( 'should show no more than three rows, picked after the sort', () => {
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
		const report = createBreakdownReport( [ [ '(not set)', 4 ] ] );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: '(not set)', value: '4', secondaryValue: '(100%)' },
		] );
	} );

	it( 'should return no rows for an empty report, a report with no rows, and no report', () => {
		expect(
			getRecentTrafficBreakdownRows( createBreakdownReport( [] ) )
		).toEqual( [] );
		expect( getRecentTrafficBreakdownRows( {} ) ).toEqual( [] );
		expect( getRecentTrafficBreakdownRows() ).toEqual( [] );
	} );
} );
