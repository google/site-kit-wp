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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { getBreakdownRows } from './getBreakdownRows';

/**
 * Builds a breakdown report from label and visitor pairs, in the order given.
 *
 * The visitors are strings, the way the API returns them.
 *
 * @since n.e.x.t
 *
 * @param {Array<Array>} pairs `[ label, visitors ]` pairs.
 * @return {Object} The breakdown report.
 */
function createReport( pairs: Array< [ string, number ] > ): Report {
	return {
		rows: pairs.map( ( [ label, visitors ] ) => ( {
			dimensionValues: [ { value: label } ],
			metricValues: [ { value: String( visitors ) } ],
		} ) ),
	};
}

describe( 'getBreakdownRows', () => {
	it( 'gives each value its share of the column total', () => {
		const rows = getBreakdownRows(
			createReport( [
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
			createReport( [
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
			createReport( [
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
			createReport( [
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
	} );

	it( 'drops the "Others" row when the values it would fold have no visitors', () => {
		const rows = getBreakdownRows(
			createReport( [
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
				createReport( [
					[ 'Direct', 90 ],
					[ label, 10 ],
				] )
			);

			expect( rows[ 1 ].label ).toBe( label );
			expect( rows[ 1 ].percentage ).toBeCloseTo( 0.1, 6 );
		}
	);

	it( 'gives an empty array for a report with no rows', () => {
		expect( getBreakdownRows( createReport( [] ) ) ).toEqual( [] );
		expect( getBreakdownRows( undefined ) ).toEqual( [] );
	} );

	it( 'gives every row a zero share when nobody visited', () => {
		const rows = getBreakdownRows(
			createReport( [
				[ 'A', 0 ],
				[ 'B', 0 ],
			] )
		);

		expect( rows.map( ( { percentage } ) => percentage ) ).toEqual( [
			0, 0,
		] );
	} );
} );
