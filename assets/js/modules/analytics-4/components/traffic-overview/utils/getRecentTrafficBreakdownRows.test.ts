/**
 * Recent activity breakdown row shaping tests.
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
	it( 'should give each row its visitors and its share of the visitors of every value in the report', () => {
		const rows = getRecentTrafficBreakdownRows(
			createBreakdownReport( [
				[ 'Direct', 120 ],
				[ 'Organic Search', 60 ],
				[ 'Organic Social', 15 ],
				[ 'Email', 5 ],
			] )
		);

		// The four values have 200 visitors, and "Email" adds 2.5% that no
		// row shows.
		expect( rows ).toEqual( [
			{ label: 'Direct', value: '120', secondaryValue: '(60.0%)' },
			{ label: 'Organic Search', value: '60', secondaryValue: '(30.0%)' },
			{ label: 'Organic Social', value: '15', secondaryValue: '(7.5%)' },
		] );
	} );

	it( 'should return the three values with the most visitors when the report has more values', () => {
		const rows = getRecentTrafficBreakdownRows(
			createBreakdownReport( [
				[ 'A', 50 ],
				[ 'B', 40 ],
				[ 'C', 30 ],
				[ 'D', 20 ],
				[ 'E', 10 ],
			] )
		);

		expect( rows.map( ( { label } ) => label ) ).toEqual( [
			'A',
			'B',
			'C',
		] );
	} );

	it( 'should sort the rows by visitors, most first', () => {
		const rows = getRecentTrafficBreakdownRows(
			createBreakdownReport( [
				[ 'reddit.com', 5 ],
				[ 'substack.com', 50 ],
				[ 'medium.com', 20 ],
				[ 'example.org', 1 ],
			] )
		);

		expect( rows.map( ( { label } ) => label ) ).toEqual( [
			'substack.com',
			'medium.com',
			'reddit.com',
		] );
	} );

	it( 'should round each share to one decimal place', () => {
		const rows = getRecentTrafficBreakdownRows(
			createBreakdownReport( [
				[ 'Direct', 2 ],
				[ 'Referral', 1 ],
			] )
		);

		expect( rows.map( ( { secondaryValue } ) => secondaryValue ) ).toEqual(
			[ '(66.7%)', '(33.3%)' ]
		);
	} );

	it( 'should show "(<0.1%)" for a value with visitors whose share rounds to 0.0%', () => {
		const rows = getRecentTrafficBreakdownRows(
			createBreakdownReport( [
				[ 'Direct', 2000 ],
				[ 'Referral', 1 ],
			] )
		);

		expect( rows[ 1 ] ).toEqual( {
			label: 'Referral',
			value: '1',
			secondaryValue: '(<0.1%)',
		} );
	} );

	it( 'should show "(99.9%)" for a share that rounds up to 100.0% while another value has visitors', () => {
		const rows = getRecentTrafficBreakdownRows(
			createBreakdownReport( [
				[ 'Direct', 2000 ],
				[ 'Referral', 1 ],
			] )
		);

		expect( rows[ 0 ] ).toEqual( {
			label: 'Direct',
			value: '2K',
			secondaryValue: '(99.9%)',
		} );
	} );

	it( 'should show "(100.0%)" for the only value with visitors', () => {
		const rows = getRecentTrafficBreakdownRows(
			createBreakdownReport( [ [ 'Direct', 7 ] ] )
		);

		expect( rows ).toEqual( [
			{ label: 'Direct', value: '7', secondaryValue: '(100.0%)' },
		] );
	} );

	it( 'should format a count of a thousand or more in its short form, such as "1.2K"', () => {
		const rows = getRecentTrafficBreakdownRows(
			createBreakdownReport( [ [ 'Direct', 1234 ] ] )
		);

		expect( rows[ 0 ].value ).toBe( '1.2K' );
	} );

	it( 'should leave values with no visitors out of the rows and out of the shares', () => {
		const rows = getRecentTrafficBreakdownRows(
			createBreakdownReport( [
				[ 'Direct', 10 ],
				[ 'Email', 0 ],
			] )
		);

		expect( rows ).toEqual( [
			{ label: 'Direct', value: '10', secondaryValue: '(100.0%)' },
		] );
	} );

	it( 'should return no rows when no value has visitors', () => {
		expect(
			getRecentTrafficBreakdownRows(
				createBreakdownReport( [
					[ 'Direct', 0 ],
					[ 'Email', 0 ],
				] )
			)
		).toEqual( [] );
	} );

	it( 'should return no rows for a report with no rows', () => {
		expect( getRecentTrafficBreakdownRows( {} ) ).toEqual( [] );
	} );

	it( 'should return no rows while the report is `undefined`', () => {
		expect( getRecentTrafficBreakdownRows( undefined ) ).toEqual( [] );
	} );
} );
