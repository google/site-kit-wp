/**
 * Tests for the report cache key helpers.
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
import { getCacheableReportOptions, getReportCacheKey } from './report-options';

describe( 'getCacheableReportOptions', () => {
	it( 'removes `reportID` and keeps every other option unchanged', () => {
		const options = {
			startDate: '2024-01-01',
			endDate: '2024-01-28',
			dimensions: [ 'date' ],
			metrics: [ { name: 'totalUsers' } ],
			reportID: 'test_component_reportArgs',
		};

		expect( getCacheableReportOptions( options ) ).toEqual( {
			startDate: '2024-01-01',
			endDate: '2024-01-28',
			dimensions: [ 'date' ],
			metrics: [ { name: 'totalUsers' } ],
		} );
	} );

	it( 'returns the same options when there is no `reportID`', () => {
		const options = {
			startDate: '2024-01-01',
			endDate: '2024-01-28',
		};

		expect( getCacheableReportOptions( options ) ).toEqual( options );
	} );

	it( 'keeps the passed options object unchanged', () => {
		const options = {
			startDate: '2024-01-01',
			endDate: '2024-01-28',
			reportID: 'test_component_reportArgs',
		};

		getCacheableReportOptions( options );

		expect( options.reportID ).toBe( 'test_component_reportArgs' );
	} );

	it( 'returns the same result for options that differ only in `reportID`', () => {
		const baseOptions = {
			startDate: '2024-01-01',
			endDate: '2024-01-28',
			dimensions: [ 'date' ],
		};

		expect(
			getCacheableReportOptions( {
				...baseOptions,
				reportID: 'first_component_reportArgs',
			} )
		).toEqual(
			getCacheableReportOptions( {
				...baseOptions,
				reportID: 'second_component_reportArgs',
			} )
		);
	} );

	it.each( [
		[ undefined ],
		[ null ],
		[ 'startDate' ],
		[ 123 ],
		[ [ 'date' ] ],
	] )( 'returns the passed value %s unchanged', ( value: unknown ) => {
		expect( getCacheableReportOptions( value ) ).toBe( value );
	} );
} );

describe( 'getReportCacheKey', () => {
	it( 'returns a string key', () => {
		expect(
			typeof getReportCacheKey( {
				startDate: '2024-01-01',
				endDate: '2024-01-28',
			} )
		).toBe( 'string' );
	} );

	it( 'returns the same key for options that differ only in `reportID`', () => {
		const baseOptions = {
			startDate: '2024-01-01',
			endDate: '2024-01-28',
			dimensions: [ 'date' ],
		};

		expect(
			getReportCacheKey( {
				...baseOptions,
				reportID: 'first_component_reportArgs',
			} )
		).toBe(
			getReportCacheKey( {
				...baseOptions,
				reportID: 'second_component_reportArgs',
			} )
		);
	} );

	it( 'returns different keys for options that differ in a field other than `reportID`', () => {
		expect(
			getReportCacheKey( {
				startDate: '2024-01-01',
				endDate: '2024-01-28',
			} )
		).not.toBe(
			getReportCacheKey( {
				startDate: '2024-02-01',
				endDate: '2024-02-28',
			} )
		);
	} );
} );
