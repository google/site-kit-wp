/**
 * Traffic Overview breakdown row shaping tests.
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
import { getBreakdownRows } from './getBreakdownRows';

describe( 'getBreakdownRows', () => {
	it( 'gives each value its share of the column total', () => {
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'Organic Search', 1200 ],
				[ 'Direct', 600 ],
				[ 'Paid Search', 400 ],
			] )
		);

		expect( rows.map( ( { label } ) => label ) ).toEqual( [
			'Organic Search',
			'Direct',
			'Paid Search',
		] );
		// Shares of the 2200 the three values add up to, which the column
		// renders as 55%, 27% and 18%.
		expect( rows.map( ( { percentage } ) => percentage ) ).toEqual( [
			1200 / 2200,
			600 / 2200,
			400 / 2200,
		] );
	} );

	it( 'keeps the report order rather than re-sorting', () => {
		// The report arrives ordered by visitors, so a row out of order is
		// passed through as it came.
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'First', 10 ],
				[ 'Second', 90 ],
			] )
		);

		expect( rows.map( ( { label } ) => label ) ).toEqual( [
			'First',
			'Second',
		] );
	} );

	it( 'gives five values one row each and no "Others" row', () => {
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'A', 50 ],
				[ 'B', 40 ],
				[ 'C', 30 ],
				[ 'D', 20 ],
				[ 'E', 10 ],
			] )
		);

		expect( rows ).toHaveLength( 5 );
		expect( rows.map( ( { label } ) => label ) ).not.toContain( 'Others' );
	} );

	it( 'folds a sixth value and beyond into an "Others" row', () => {
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'A', 50 ],
				[ 'B', 40 ],
				[ 'C', 30 ],
				[ 'D', 20 ],
				[ 'E', 10 ],
				[ 'F', 5 ],
			] )
		);

		expect( rows ).toHaveLength( 5 );
		expect( rows.map( ( { label } ) => label ) ).toEqual( [
			'A',
			'B',
			'C',
			'D',
			'Others',
		] );
		// The last two values, 10 and 5, out of 155.
		expect( rows[ 4 ].percentage ).toBeCloseTo( 15 / 155, 6 );
		// Three percents are missing after the whole parts. "Others" has the
		// third largest remainder, so it gets one of them.
		expect(
			rows.map( ( { formattedPercentage } ) => formattedPercentage )
		).toEqual( [ '32%', '26%', '19%', '13%', '10%' ] );
	} );

	it( 'drops the "Others" row when the values it would fold have no visitors', () => {
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'A', 50 ],
				[ 'B', 40 ],
				[ 'C', 30 ],
				[ 'D', 20 ],
				[ 'E', 0 ],
				[ 'F', 0 ],
			] )
		);

		expect( rows ).toHaveLength( 4 );
		expect( rows.map( ( { label } ) => label ) ).toEqual( [
			'A',
			'B',
			'C',
			'D',
		] );
	} );

	it.each( [ [ '(not set)' ], [ '(other)' ] ] )(
		'keeps the %s label as GA4 returned it',
		( label ) => {
			const rows = getBreakdownRows(
				createBreakdownReport( [
					[ 'Direct', 90 ],
					[ label, 10 ],
				] )
			);

			expect( rows[ 1 ].label ).toBe( label );
			expect( rows[ 1 ].percentage ).toBeCloseTo( 0.1, 6 );
		}
	);

	it( 'gives an empty array for a report with no rows', () => {
		expect( getBreakdownRows( createBreakdownReport( [] ) ) ).toEqual( [] );
		expect( getBreakdownRows( undefined ) ).toEqual( [] );
	} );

	it( 'gives an empty array when nobody visited', () => {
		expect(
			getBreakdownRows(
				createBreakdownReport( [
					[ 'A', 0 ],
					[ 'B', 0 ],
				] )
			)
		).toEqual( [] );
	} );

	it( 'leaves out a value with no visitors, so it does not push the fifth value into "Others"', () => {
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'A', 50 ],
				[ 'B', 40 ],
				[ 'C', 30 ],
				[ 'D', 20 ],
				[ 'E', 10 ],
				[ 'F', 0 ],
			] )
		);

		// Five values have visitors, so each gets its own row.
		expect( rows.map( ( { label } ) => label ) ).toEqual( [
			'A',
			'B',
			'C',
			'D',
			'E',
		] );
	} );

	it( 'formats each share as a whole percent', () => {
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'Organic Search', 1200 ],
				[ 'Direct', 600 ],
				[ 'Paid Search', 400 ],
			] )
		);

		expect(
			rows.map( ( { formattedPercentage } ) => formattedPercentage )
		).toEqual( [ '55%', '27%', '18%' ] );
	} );

	it( 'gives shares that add up to 100% when rounding each one would give 99%', () => {
		// 33.4%, 33.3%, and 33.3% each round down to 33%.
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'A', 334 ],
				[ 'B', 333 ],
				[ 'C', 333 ],
			] )
		);

		expect(
			rows.map( ( { formattedPercentage } ) => formattedPercentage )
		).toEqual( [ '34%', '33%', '33%' ] );
	} );

	it( 'gives shares that add up to 100% when rounding each one would give 101%', () => {
		// 50.5% and 30.5% each round up, to 51% and 31%.
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'desktop', 505 ],
				[ 'mobile', 305 ],
				[ 'tablet', 190 ],
			] )
		);

		expect(
			rows.map( ( { formattedPercentage } ) => formattedPercentage )
		).toEqual( [ '51%', '30%', '19%' ] );
	} );

	it( 'shows a value that gets no whole percent as "<1%" rather than "0%"', () => {
		// 99.6%, 0.3%, and 0.1% leave one percent missing, which goes to the
		// 0.3% value.
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'United States', 996 ],
				[ 'Germany', 3 ],
				[ 'France', 1 ],
			] )
		);

		expect( rows[ 2 ].percentage ).toBeCloseTo( 0.001, 6 );
		expect(
			rows.map( ( { formattedPercentage } ) => formattedPercentage )
		).toEqual( [ '99%', '1%', '<1%' ] );
	} );

	it( 'never shows "100%" beside another value, and gives that percent to the next value', () => {
		// 99.9% would get the missing percent by its remainder.
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'desktop', 999 ],
				[ 'mobile', 1 ],
			] )
		);

		expect(
			rows.map( ( { formattedPercentage } ) => formattedPercentage )
		).toEqual( [ '99%', '1%' ] );
	} );

	it( 'shows a single value as "100%"', () => {
		const rows = getBreakdownRows(
			createBreakdownReport( [ [ 'desktop', 42 ] ] )
		);

		expect(
			rows.map( ( { formattedPercentage } ) => formattedPercentage )
		).toEqual( [ '100%' ] );
	} );

	it( 'shows a value below one percent that gets a missing percent as "1%"', () => {
		// 99.3% and 0.7% leave one percent missing, and 0.7% has the larger
		// remainder.
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'United States', 993 ],
				[ 'Germany', 7 ],
			] )
		);

		expect(
			rows.map( ( { formattedPercentage } ) => formattedPercentage )
		).toEqual( [ '99%', '1%' ] );
	} );

	it( 'shows an "Others" row that gets no whole percent as "<1%" when the shares add up to 100%', () => {
		// 46.3%, 30.4%, 15.6%, 7.3%, and 0.4% would round to 46%, 30%, 16%,
		// 7%, and 0%, which adds up to 99%. "Others" ties with "Organic Search"
		// for the missing percent, and the earlier row gets it.
		const rows = getBreakdownRows(
			createBreakdownReport( [
				[ 'Direct', 4630 ],
				[ 'Organic Search', 3040 ],
				[ 'Organic Social', 1560 ],
				[ 'Referral', 730 ],
				[ 'Paid Search', 25 ],
				[ 'Email', 15 ],
			] )
		);

		expect(
			rows.map( ( { label, formattedPercentage } ) => [
				label,
				formattedPercentage,
			] )
		).toEqual( [
			[ 'Direct', '46%' ],
			[ 'Organic Search', '31%' ],
			[ 'Organic Social', '16%' ],
			[ 'Referral', '7%' ],
			[ 'Others', '<1%' ],
		] );
	} );
} );
