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
import { buildCitiesReportOptions, mapCitiesRows } from './cities';

function makeRow( dimensionValue: string, ...metricValues: string[] ) {
	return {
		dimensionValues: [ { value: dimensionValue } ],
		metricValues: metricValues.map( ( value ) => ( { value } ) ),
	};
}

describe( 'buildCitiesReportOptions', () => {
	const dates = { startDate: '2025-08-01', endDate: '2025-08-28' };

	it( 'should request the city dimension', () => {
		const options = buildCitiesReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );

		expect( options?.dimensions ).toEqual( [ 'city' ] );
	} );

	it( 'should exclude "(not set)" city rows', () => {
		const options = buildCitiesReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );

		expect( options?.dimensionFilters?.city ).toMatchObject( {
			filterType: 'emptyFilter',
			notExpression: true,
		} );
	} );
} );

describe( 'mapCitiesRows', () => {
	it( 'should map each row to its share of the total as a percentage', () => {
		const rows = [ makeRow( 'Paris', '3' ), makeRow( 'Berlin', '1' ) ];

		expect( mapCitiesRows( rows ) ).toEqual( [
			{ label: 'Paris', value: '75%' },
			{ label: 'Berlin', value: '25%' },
		] );
	} );

	it( 'should label empty dimension values as "(not set)"', () => {
		expect( mapCitiesRows( [ makeRow( '', '1' ) ] ) ).toEqual( [
			{ label: '(not set)', value: '100%' },
		] );
	} );
} );
