/**
 * Recent activity report options tests.
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
	INSIGHT_REPORT_ID,
	getInsightReportArgs,
	getTopChannelsReportOptions,
	getTopPostsReportOptions,
	getTopReferralsReportOptions,
} from './reportOptions';

const DATE_RANGE = { startDate: '2025-02-03', endDate: '2025-02-05' };

describe( 'getInsightReportArgs', () => {
	it( 'should return the total users by date from 28 days before the date range starts to the last day of the date range', () => {
		expect(
			getInsightReportArgs( {
				startDate: '2025-02-03',
				endDate: '2025-02-05',
			} )
		).toEqual( {
			startDate: '2025-01-06',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'date' ],
			orderby: [ { dimension: { dimensionName: 'date' } } ],
			reportID: INSIGHT_REPORT_ID,
		} );
	} );
} );

describe( 'getTopPostsReportOptions', () => {
	it( 'should build options that request the three pages with the most visitors over the date range, most visitors first', () => {
		expect( getTopPostsReportOptions( DATE_RANGE ) ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'pagePath' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			limit: 3,
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topPostsArgs',
		} );
	} );
} );

describe( 'getTopChannelsReportOptions', () => {
	it( 'should build options that request the three channels with the most visitors over the date range, most visitors first', () => {
		expect( getTopChannelsReportOptions( DATE_RANGE ) ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'sessionDefaultChannelGroup' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			limit: 3,
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topChannelsArgs',
		} );
	} );
} );

describe( 'getTopReferralsReportOptions', () => {
	it( 'should build options that request the three sources of the "Referral" channel with the most visitors over the date range, most visitors first', () => {
		expect( getTopReferralsReportOptions( DATE_RANGE ) ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'sessionSource' ],
			dimensionFilters: { sessionDefaultChannelGroup: 'Referral' },
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			limit: 3,
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topReferralsArgs',
		} );
	} );

	it( 'should filter on the same dimension that the channels report groups by, so the sources are those of its "Referral" row', () => {
		expect( getTopChannelsReportOptions( DATE_RANGE ).dimensions ).toEqual(
			[ 'sessionDefaultChannelGroup' ]
		);
		expect(
			Object.keys(
				getTopReferralsReportOptions( DATE_RANGE ).dimensionFilters ??
					{}
			)
		).toEqual( [ 'sessionDefaultChannelGroup' ] );
	} );
} );
