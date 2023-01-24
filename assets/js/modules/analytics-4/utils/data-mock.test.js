/**
 * Data mock tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { getAnalytics4MockResponse } from './data-mock';

describe( 'getAnalytics4MockResponse', () => {
	it( 'throws if called without report options', () => {
		expect( () => getAnalytics4MockResponse() ).toThrow(
			'report options are required'
		);
	} );

	it( 'throws if called without a valid startDate', () => {
		expect( () =>
			getAnalytics4MockResponse( { startDate: 'not-a-date' } )
		).toThrow( 'a valid startDate is required' );
	} );

	it( 'throws if called without a valid endDate', () => {
		expect( () =>
			getAnalytics4MockResponse( {
				endDate: 'not-a-date',
				startDate: '2020-12-31',
			} )
		).toThrow( 'a valid endDate is required' );
	} );

	it( 'generates a valid report with no compare dates', () => {
		const report = getAnalytics4MockResponse( {
			startDate: '2020-12-31',
			endDate: '2021-01-27',
			metrics: [
				{
					name: 'sessions',
				},
				{
					name: 'newUsers',
				},
			],
			dimensions: [ 'date' ],
		} );

		const firstRow = report[ 0 ].rows[ 0 ];
		expect( firstRow ).toHaveProperty( 'dimensionValues' );
		expect( firstRow ).toHaveProperty( 'metricValues' );
	} );

	it( 'generates the correct number of rows when there is no date range', () => {
		const report = getAnalytics4MockResponse( {
			startDate: '2020-12-01',
			endDate: '2020-12-05',
			metrics: [
				{
					name: 'totalUsers',
				},
				{
					name: 'averageSessionDuration',
				},
			],
			dimensions: [ 'date' ],
		} );

		expect( report[ 0 ].rows ).toHaveLength( 5 );
	} );

	it( 'generates the correct number of rows when there is a date range', () => {
		const report = getAnalytics4MockResponse( {
			startDate: '2020-12-01',
			endDate: '2020-12-05',
			compareStartDate: '2020-11-26',
			compareEndDate: '2020-11-30',
			metrics: [
				{
					name: 'totalUsers',
				},
				{
					name: 'averageSessionDuration',
				},
			],
			dimensions: [ 'date' ],
		} );

		expect( report[ 0 ].rows ).toHaveLength( 20 );
	} );

	it( 'checks the number of metric values generated', () => {
		const report = getAnalytics4MockResponse( {
			startDate: '2020-12-01',
			endDate: '2020-12-15',
			compareStartDate: '2020-11-26',
			compareEndDate: '2020-11-30',
			metrics: [
				{
					name: 'totalUsers',
				},
				{
					name: 'averageSessionDuration',
				},
				'sessions',
			],
			dimensions: [ 'date' ],
		} );

		expect( report[ 0 ].rows[ 0 ].metricValues ).toHaveLength( 3 );
	} );

	it( 'checks the number of dimension values generated', () => {
		const report = getAnalytics4MockResponse( {
			startDate: '2020-12-01',
			endDate: '2020-12-15',
			metrics: [ 'sessions' ],
			dimensions: [ 'date', { name: 'country' } ],
		} );

		expect( report[ 0 ].rows[ 0 ].dimensionValues ).toHaveLength( 2 );
	} );

	it( 'checks if aggregations are rendered', () => {
		const report = getAnalytics4MockResponse( {
			startDate: '2020-12-01',
			endDate: '2020-12-15',
			metrics: [ 'sessions' ],
			dimensions: [ 'date' ],
			metricAggregations: [ 'TOTAL', 'MINIMUM' ],
		} );

		expect( report[ 0 ] ).toHaveProperty( 'totals' );
		expect( report[ 0 ] ).toHaveProperty( 'minimums' );
	} );
} );
