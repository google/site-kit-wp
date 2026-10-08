/**
 * Recent activity latest post report options tests.
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
	getEngagementReportOptions,
	getPurchasesReportOptions,
	getTopChannelReportOptions,
	getTopKeywordReportOptions,
	getTopReferrerReportOptions,
	getVisitorsReportOptions,
} from './postReportOptions';

const POST_REPORT_ARGS = {
	permalink: 'https://example.com/hello-world/',
	startDate: '2026-09-17',
	endDate: '2026-10-08',
};

const PLAIN_PERMALINK_REPORT_ARGS = {
	...POST_REPORT_ARGS,
	permalink: 'https://example.com/?p=42',
};

describe( 'getVisitorsReportOptions', () => {
	it( 'splits the total users of the post into new and returning visitors with a dimension filter', () => {
		expect( getVisitorsReportOptions( POST_REPORT_ARGS ) ).toEqual( {
			startDate: '2026-09-17',
			endDate: '2026-10-08',
			dimensions: [ 'newVsReturning' ],
			dimensionFilters: {
				pagePath: '/hello-world/',
				newVsReturning: [ 'new', 'returning' ],
			},
			metrics: [ { name: 'totalUsers' } ],
			reportID: 'analytics-4_latest-post-performance_visitors',
		} );
	} );

	it( 'matches a plain permalink by its path and query string, since its path is the home page path', () => {
		expect(
			getVisitorsReportOptions( PLAIN_PERMALINK_REPORT_ARGS )
				.dimensionFilters
		).toEqual( {
			pagePathPlusQueryString: '/?p=42',
			newVsReturning: [ 'new', 'returning' ],
		} );
	} );
} );

describe( 'getTopChannelReportOptions', () => {
	it( 'requests the channel with the most visitors to the post', () => {
		expect( getTopChannelReportOptions( POST_REPORT_ARGS ) ).toEqual( {
			startDate: '2026-09-17',
			endDate: '2026-10-08',
			dimensions: [ 'sessionDefaultChannelGroup' ],
			dimensionFilters: { pagePath: '/hello-world/' },
			metrics: [ { name: 'totalUsers' } ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			limit: 1,
			reportID: 'analytics-4_latest-post-performance_top-channel',
		} );
	} );
} );

describe( 'getTopReferrerReportOptions', () => {
	it( 'requests the source with the most visitors to the post from the referral channel only', () => {
		expect( getTopReferrerReportOptions( POST_REPORT_ARGS ) ).toEqual( {
			startDate: '2026-09-17',
			endDate: '2026-10-08',
			dimensions: [ 'sessionSource' ],
			dimensionFilters: {
				pagePath: '/hello-world/',
				sessionDefaultChannelGroup: 'Referral',
			},
			metrics: [ { name: 'totalUsers' } ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			limit: 1,
			reportID: 'analytics-4_latest-post-performance_top-referrer',
		} );
	} );
} );

describe( 'getEngagementReportOptions', () => {
	it( 'requests the average session duration and the engaged sessions of the post', () => {
		expect( getEngagementReportOptions( POST_REPORT_ARGS ) ).toEqual( {
			startDate: '2026-09-17',
			endDate: '2026-10-08',
			dimensionFilters: { pagePath: '/hello-world/' },
			metrics: [
				{ name: 'averageSessionDuration' },
				{ name: 'engagedSessions' },
			],
			reportID: 'analytics-4_latest-post-performance_engagement',
		} );
	} );
} );

describe( 'getPurchasesReportOptions', () => {
	it( 'counts the purchase events in the sessions that landed on the post', () => {
		expect( getPurchasesReportOptions( POST_REPORT_ARGS ) ).toEqual( {
			startDate: '2026-09-17',
			endDate: '2026-10-08',
			dimensions: [ 'eventName' ],
			dimensionFilters: {
				landingPage: '/hello-world/',
				eventName: 'purchase',
			},
			metrics: [ { name: 'eventCount' } ],
			reportID: 'analytics-4_latest-post-performance_purchases',
		} );
	} );

	it( 'matches the landing page of a plain permalink by its path and query string', () => {
		expect(
			getPurchasesReportOptions( PLAIN_PERMALINK_REPORT_ARGS )
				.dimensionFilters
		).toEqual( {
			landingPagePlusQueryString: '/?p=42',
			eventName: 'purchase',
		} );
	} );
} );

describe( 'getTopKeywordReportOptions', () => {
	it( 'requests the top search query for the post URL', () => {
		expect( getTopKeywordReportOptions( POST_REPORT_ARGS ) ).toEqual( {
			startDate: '2026-09-17',
			endDate: '2026-10-08',
			dimensions: 'query',
			url: 'https://example.com/hello-world/',
			limit: 1,
			reportID: 'search-console_latest-post-performance_top-keyword',
		} );
	} );
} );
