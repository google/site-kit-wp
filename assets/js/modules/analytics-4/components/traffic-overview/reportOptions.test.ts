/**
 * Traffic Overview report options tests.
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
import {
	getBreakdownReportArgs,
	getBreakdownReportOptions,
} from './reportOptions';

describe( 'getBreakdownReportOptions', () => {
	it( 'should return the sessions metric, the dimension, the ordering by sessions, and the report ID it receives', () => {
		expect(
			getBreakdownReportOptions( {
				dimensionName: 'country',
				reportID: 'test-locations-breakdown',
			} )
		).toEqual( {
			metrics: [ { name: 'sessions' } ],
			dimensions: [ 'country' ],
			orderby: [ { metric: { metricName: 'sessions' }, desc: true } ],
			reportID: 'test-locations-breakdown',
		} );
	} );
} );

describe( 'getBreakdownReportArgs', () => {
	it( 'should return the dates, the sessions metric, the dimension, the ordering, and the report ID', () => {
		expect(
			getBreakdownReportArgs( {
				dimensionName: 'sessionDefaultChannelGrouping',
				reportID: 'test-channels-breakdown',
				startDate: '2025-01-08',
				endDate: '2025-02-04',
			} )
		).toEqual( {
			startDate: '2025-01-08',
			endDate: '2025-02-04',
			metrics: [ { name: 'sessions' } ],
			dimensions: [ 'sessionDefaultChannelGrouping' ],
			orderby: [ { metric: { metricName: 'sessions' }, desc: true } ],
			reportID: 'test-channels-breakdown',
		} );
	} );

	it( 'should add the URL to the args when it receives an entity URL', () => {
		expect(
			getBreakdownReportArgs( {
				dimensionName: 'deviceCategory',
				reportID: 'test-devices-breakdown',
				startDate: '2025-01-08',
				endDate: '2025-02-04',
				url: 'https://example.com/about/',
			} )
		).toEqual( {
			startDate: '2025-01-08',
			endDate: '2025-02-04',
			metrics: [ { name: 'sessions' } ],
			dimensions: [ 'deviceCategory' ],
			orderby: [ { metric: { metricName: 'sessions' }, desc: true } ],
			reportID: 'test-devices-breakdown',
			url: 'https://example.com/about/',
		} );
	} );

	it( 'should omit the URL when it receives no entity URL', () => {
		const args = getBreakdownReportArgs( {
			dimensionName: 'deviceCategory',
			reportID: 'test-devices-breakdown',
			startDate: '2025-01-08',
			endDate: '2025-02-04',
		} );

		expect( args ).not.toHaveProperty( 'url' );
	} );
} );
