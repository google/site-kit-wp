/**
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
import {
	getGoalDriverTotalCount,
	makeShareOfExplicitTotalMapper,
	makeShareOfTotalMapper,
	mapRowsToShareOfTotal,
	parseMetricValue,
} from './rowMapperHelpers';

function makeRow( dimensionValue: string, ...metricValues: string[] ) {
	return {
		dimensionValues: [ { value: dimensionValue } ],
		metricValues: metricValues.map( ( value ) => ( { value } ) ),
	};
}

describe( 'parseMetricValue', () => {
	it( 'should parse the metric value at the given index', () => {
		expect( parseMetricValue( makeRow( '', '42', '7' ), 1 ) ).toBe( 7 );
	} );

	it( 'should default to the first metric value', () => {
		expect( parseMetricValue( makeRow( '', '42' ) ) ).toBe( 42 );
	} );

	it( 'should return 0 when the metric value is missing', () => {
		expect( parseMetricValue( makeRow( '' ) ) ).toBe( 0 );
	} );
} );

describe( 'mapRowsToShareOfTotal', () => {
	it( "should sum the total from the rows' own metric values when no explicit total is given", () => {
		const rows = [ makeRow( 'label', '3' ), makeRow( 'label', '1' ) ];

		expect( mapRowsToShareOfTotal( rows, () => 'label' ) ).toEqual( [
			{ label: 'label', value: '75%' },
			{ label: 'label', value: '25%' },
		] );
	} );

	it( 'should divide by the given explicit total instead of summing the rows', () => {
		const rows = [ makeRow( 'label', '30' ) ];

		expect( mapRowsToShareOfTotal( rows, () => 'label', 1000 ) ).toEqual( [
			{ label: 'label', value: '3%' },
		] );
	} );

	it( 'should return a 0% value rather than dividing by zero when the total is zero', () => {
		const rows = [ makeRow( 'label', '0' ) ];

		expect( mapRowsToShareOfTotal( rows, () => 'label' ) ).toEqual( [
			{ label: 'label', value: '0%' },
		] );
	} );
} );

describe( 'makeShareOfTotalMapper', () => {
	it( 'should map each row to its share of the total as a percentage', () => {
		const rows = [ makeRow( 'Paris', '3' ), makeRow( 'Berlin', '1' ) ];

		expect( makeShareOfTotalMapper()( rows ) ).toEqual( [
			{ label: 'Paris', value: '75%' },
			{ label: 'Berlin', value: '25%' },
		] );
	} );

	it( 'should default empty dimension values to the "(not set)" label', () => {
		const rows = [ makeRow( '', '1' ) ];

		expect( makeShareOfTotalMapper()( rows ) ).toEqual( [
			{ label: '(not set)', value: '100%' },
		] );
	} );

	it( 'should use the given emptyLabel and getLabel options', () => {
		const rows = [ makeRow( 'new', '1' ), makeRow( '', '1' ) ];

		expect(
			makeShareOfTotalMapper( {
				getLabel: ( value ) =>
					value === 'new' ? 'New visitors' : value,
				emptyLabel: '-',
			} )( rows )
		).toEqual( [
			{ label: 'New visitors', value: '50%' },
			{ label: '-', value: '50%' },
		] );
	} );
} );

describe( 'makeShareOfExplicitTotalMapper', () => {
	it( "should divide each row by the given total, not the rows' own sum", () => {
		// The rows shown (top 3) sum to less than the true site-wide
		// total passed in, exactly the "top authors" / "top traffic
		// channels" case this mapper exists for.
		const rows = [
			makeRow( 'AuthorName1', '305' ),
			makeRow( 'AuthorName2', '247' ),
			makeRow( 'AuthorName3', '162' ),
		];

		expect( makeShareOfExplicitTotalMapper( 1000 )( rows ) ).toEqual( [
			{ label: 'AuthorName1', value: '30.5%' },
			{ label: 'AuthorName2', value: '24.7%' },
			{ label: 'AuthorName3', value: '16.2%' },
		] );
	} );

	it( 'should return a 0% value rather than dividing by zero when the total is zero', () => {
		expect(
			makeShareOfExplicitTotalMapper( 0 )( [ makeRow( 'Paris', '0' ) ] )
		).toEqual( [ { label: 'Paris', value: '0%' } ] );
	} );

	it( 'should label empty dimension values as "(not set)" by default', () => {
		expect(
			makeShareOfExplicitTotalMapper( 100 )( [ makeRow( '', '50' ) ] )
		).toEqual( [ { label: '(not set)', value: '50%' } ] );
	} );
} );

describe( 'getGoalDriverTotalCount', () => {
	it( 'should read the total report row into a plain count', () => {
		expect(
			getGoalDriverTotalCount( {
				rows: [ { metricValues: [ { value: '1000' } ] } ],
			} )
		).toBe( 1000 );
	} );

	it( 'should return 0 when the report has no rows yet', () => {
		expect( getGoalDriverTotalCount( { rows: [] } ) ).toBe( 0 );
		expect( getGoalDriverTotalCount( undefined ) ).toBe( 0 );
	} );
} );
