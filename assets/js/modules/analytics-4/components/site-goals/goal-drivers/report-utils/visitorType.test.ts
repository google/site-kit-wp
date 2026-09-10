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
	buildVisitorTypeReportOptions,
	mapVisitorTypeRows,
} from './visitorType';

function makeRow( dimensionValue: string, ...metricValues: string[] ) {
	return {
		dimensionValues: [ { value: dimensionValue } ],
		metricValues: metricValues.map( ( value ) => ( { value } ) ),
	};
}

describe( 'buildVisitorTypeReportOptions', () => {
	const dates = { startDate: '2025-08-01', endDate: '2025-08-28' };

	it( 'should request the newVsReturning dimension', () => {
		const options = buildVisitorTypeReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );

		expect( options?.dimensions ).toEqual( [ 'newVsReturning' ] );
	} );

	it( 'should scope the report to a breakdown filter when provided', () => {
		const options = buildVisitorTypeReportOptions( {
			dates,
			primaryEvent: 'purchase',
			breakdownFilter: { someDimension: 'someValue' },
			limit: 6,
		} );

		expect( options?.dimensionFilters ).toMatchObject( {
			someDimension: 'someValue',
		} );
	} );
} );

describe( 'mapVisitorTypeRows', () => {
	it( 'should translate known visitor type values to their labels', () => {
		const rows = [ makeRow( 'new', '1' ), makeRow( 'returning', '1' ) ];

		expect( mapVisitorTypeRows( rows ) ).toEqual( [
			{ label: 'New visitors', value: '50%' },
			{ label: 'Returning visitors', value: '50%' },
		] );
	} );

	it( 'should label empty dimension values as "-"', () => {
		expect( mapVisitorTypeRows( [ makeRow( '', '1' ) ] ) ).toEqual( [
			{ label: '-', value: '100%' },
		] );
	} );
} );
