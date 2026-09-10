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
import { REPORT_UTILS_TEST_DATES as dates, makeRow } from './__fixtures__';
import { buildCountriesReportOptions, mapCountriesRows } from './countries';

describe( 'buildCountriesReportOptions', () => {
	it( 'should request the country dimension', () => {
		const options = buildCountriesReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );

		expect( options?.dimensions ).toEqual( [ 'country' ] );
	} );

	it( 'should exclude "(not set)" country rows', () => {
		const options = buildCountriesReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );

		expect( options?.dimensionFilters?.country ).toMatchObject( {
			filterType: 'emptyFilter',
			notExpression: true,
		} );
	} );
} );

describe( 'mapCountriesRows', () => {
	it( 'should map each row to its share of the total as a percentage', () => {
		const rows = [ makeRow( 'France', '3' ), makeRow( 'Germany', '1' ) ];

		expect( mapCountriesRows( rows ) ).toEqual( [
			{ label: 'France', value: '75%' },
			{ label: 'Germany', value: '25%' },
		] );
	} );

	it( 'should label empty dimension values as "(not set)"', () => {
		expect( mapCountriesRows( [ makeRow( '', '1' ) ] ) ).toEqual( [
			{ label: '(not set)', value: '100%' },
		] );
	} );
} );
