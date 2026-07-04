/**
 * Data mock tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { getAdSenseMockResponse } from './data-mock';

describe( 'getAdSenseMockResponse', () => {
	const startDate = '2021-07-01';
	const endDate = '2021-07-28';
	const metrics = [ 'IMPRESSIONS' ];

	it( 'throws if called without report options', () => {
		expect( () => getAdSenseMockResponse() ).toThrow(
			'report options are required'
		);
	} );

	it( 'throws if called without a valid startDate', () => {
		expect( () =>
			getAdSenseMockResponse( { startDate: 'not-a-date' } )
		).toThrow( 'a valid startDate is required' );
	} );

	it( 'throws if called without a valid endDate', () => {
		expect( () =>
			getAdSenseMockResponse( { endDate: 'not-a-date', startDate } )
		).toThrow( 'a valid endDate is required' );
	} );

	it( 'throws if called with invalid metrics', () => {
		expect( () =>
			getAdSenseMockResponse( {
				metrics: [ 'invalid' ],
				startDate,
				endDate,
			} )
		).toThrow( 'invalid AdSense metrics requested' );
	} );

	it( 'generates a valid report', () => {
		const report = getAdSenseMockResponse( {
			startDate,
			endDate,
			metrics,
		} );
		const rowMatcher = {
			cells: [ { value: expect.stringMatching( /^\d+$/ ) } ],
		};
		expect( report.startDate ).toEqual( { year: 2021, month: 7, day: 1 } );
		expect( report.endDate ).toEqual( { year: 2021, month: 7, day: 28 } );
		expect( report.totalMatchedRows ).toBe( '28' );
		expect( report.headers ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( { name: 'IMPRESSIONS' } ),
			] )
		);
		expect( report.totals ).toEqual( rowMatcher );
		expect( report.averages ).toEqual( rowMatcher );
		expect( report.rows ).toHaveLength( 28 );

		for ( const row of report.rows ) {
			expect( row ).toEqual( rowMatcher );
		}
	} );
} );
