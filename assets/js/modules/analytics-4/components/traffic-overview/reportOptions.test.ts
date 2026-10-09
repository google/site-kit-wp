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
	getRecentTopChannelsReportArgs,
	getRecentTopPostsReportArgs,
	getRecentTopReferralsReportArgs,
} from './reportOptions';

describe( 'getBreakdownReportOptions', () => {
	it( 'should return the dimension, the ordering by total users, and the report ID it receives', () => {
		expect(
			getBreakdownReportOptions( {
				dimensionName: 'country',
				reportID: 'test-locations-breakdown',
			} )
		).toEqual( {
			dimensions: [ 'country' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			reportID: 'test-locations-breakdown',
		} );
	} );
} );

describe( 'getBreakdownReportArgs', () => {
	it( 'should return the dates, the total users metric, the dimension, the ordering, and the report ID', () => {
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
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'sessionDefaultChannelGrouping' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
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
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'deviceCategory' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
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

describe( 'getRecentTopPostsReportArgs', () => {
	it( 'should return the dates, the total users metric, the page path dimension, the ordering by total users, and the report ID', () => {
		expect(
			getRecentTopPostsReportArgs( {
				startDate: '2025-02-04',
				endDate: '2025-02-05',
			} )
		).toEqual( {
			startDate: '2025-02-04',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'pagePath' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			reportID:
				'analytics-4_recent-traffic-breakdown_component_topPostsArgs',
		} );
	} );
} );

describe( 'getRecentTopChannelsReportArgs', () => {
	it( 'should return the dates, the total users metric, the channel group dimension, the ordering by total users, and the report ID', () => {
		expect(
			getRecentTopChannelsReportArgs( {
				startDate: '2025-02-04',
				endDate: '2025-02-05',
			} )
		).toEqual( {
			startDate: '2025-02-04',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'sessionDefaultChannelGroup' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			reportID:
				'analytics-4_recent-traffic-breakdown_component_topChannelsArgs',
		} );
	} );
} );

describe( 'getRecentTopReferralsReportArgs', () => {
	it( 'should return the session source dimension, and a filter that keeps the "Referral" channel group alone', () => {
		expect(
			getRecentTopReferralsReportArgs( {
				startDate: '2025-02-04',
				endDate: '2025-02-05',
			} )
		).toEqual( {
			startDate: '2025-02-04',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'sessionSource' ],
			dimensionFilters: { sessionDefaultChannelGroup: 'Referral' },
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			reportID:
				'analytics-4_recent-traffic-breakdown_component_topReferralsArgs',
		} );
	} );
} );
