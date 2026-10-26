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
	getSearchPerformanceReportOptions,
	getSiteVisitorsReportOptions,
	getTimeZoneReportOptions,
	getTopChannelsReportOptions,
	getTopPostsReportOptions,
	getTopReferralsReportOptions,
	getTotalVisitorsReportOptions,
} from './reportOptions';

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

describe( 'getSiteVisitorsReportOptions', () => {
	it( 'should request the total users of the whole date range, with no dimension', () => {
		expect(
			getSiteVisitorsReportOptions( {
				startDate: '2025-02-03',
				endDate: '2025-02-05',
			} )
		).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			reportID:
				'analytics-4_traffic-overview_recent-activity_siteVisitorsArgs',
		} );
	} );
} );

describe( 'getTimeZoneReportOptions', () => {
	it( 'should request `totalUsers` for the days of the window in UTC', () => {
		// The window ends at 19:00 UTC on October 13, which is already
		// October 14 in time zones five or more hours ahead of UTC, such as
		// `Asia/Tokyo`.
		expect(
			getTimeZoneReportOptions( Date.parse( '2026-10-12T20:00:00Z' ) )
		).toEqual( {
			startDate: '2026-10-12',
			endDate: '2026-10-13',
			metrics: [ { name: 'totalUsers' } ],
			reportID: 'analytics-4_fresh-metrics-row_widget_timeZoneArgs',
		} );
	} );
} );

describe( 'getTotalVisitorsReportOptions', () => {
	it( 'should filter the Total visitors report by the hours of the window in the time zone of the property, without a `dateHour` dimension', () => {
		expect(
			getTotalVisitorsReportOptions(
				Date.parse( '2026-10-12T09:00:00Z' ),
				'Asia/Tokyo'
			)
		).toEqual( {
			startDate: '2026-10-12',
			endDate: '2026-10-13',
			metrics: [ { name: 'totalUsers' } ],
			dimensionFilters: {
				dateHour: [
					'2026101218',
					'2026101219',
					'2026101220',
					'2026101221',
					'2026101222',
					'2026101223',
					'2026101300',
					'2026101301',
					'2026101302',
					'2026101303',
					'2026101304',
					'2026101305',
					'2026101306',
					'2026101307',
					'2026101308',
					'2026101309',
					'2026101310',
					'2026101311',
					'2026101312',
					'2026101313',
					'2026101314',
					'2026101315',
					'2026101316',
					'2026101317',
				],
			},
			reportID: 'analytics-4_fresh-metrics-row_widget_totalVisitorsArgs',
		} );
	} );
} );

describe( 'getSearchPerformanceReportOptions', () => {
	it( 'should request the Search Console report by hour for the days of the window in Pacific Time', () => {
		// The window starts at 23:00 on October 11 in Pacific Time, a day
		// earlier than in UTC.
		expect(
			getSearchPerformanceReportOptions(
				Date.parse( '2026-10-12T06:00:00Z' )
			)
		).toEqual( {
			startDate: '2026-10-11',
			endDate: '2026-10-12',
			dimensions: 'hour',
			reportID:
				'search-console_fresh-metrics-row_widget_searchPerformanceArgs',
		} );
	} );
} );

describe( 'getTopPostsReportOptions', () => {
	it( 'should build options that request the three pages with the most views over the date range, most views first', () => {
		expect(
			getTopPostsReportOptions( {
				startDate: '2025-02-03',
				endDate: '2025-02-05',
			} )
		).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'screenPageViews' } ],
			dimensions: [ 'pagePath' ],
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 3,
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topPostsArgs',
		} );
	} );

	it( 'should build options that keep every page when no product pages are excluded', () => {
		expect(
			getTopPostsReportOptions(
				{ startDate: '2025-02-03', endDate: '2025-02-05' },
				null
			)
		).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'screenPageViews' } ],
			dimensions: [ 'pagePath' ],
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 3,
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topPostsArgs',
		} );
	} );

	it( 'should build options that leave out the pages whose path starts with the path of every product URL', () => {
		expect(
			getTopPostsReportOptions(
				{ startDate: '2025-02-03', endDate: '2025-02-05' },
				{ by: 'pathPrefix', pathPrefix: '/product/' }
			)
		).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'screenPageViews' } ],
			dimensions: [ 'pagePath' ],
			dimensionFilters: {
				pagePath: {
					filterType: 'stringFilter',
					matchType: 'BEGINS_WITH',
					value: '/product/',
					notExpression: true,
				},
			},
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 3,
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topPostsArgs',
		} );
	} );

	it( 'should build options that leave out the views of pages whose `googlesitekit_post_type` custom dimension is the product post type', () => {
		expect(
			getTopPostsReportOptions(
				{ startDate: '2025-02-03', endDate: '2025-02-05' },
				{ by: 'postTypeDimension', postType: 'product' }
			)
		).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'screenPageViews' } ],
			dimensions: [ 'pagePath' ],
			dimensionFilters: {
				'customEvent:googlesitekit_post_type': {
					filterType: 'stringFilter',
					matchType: 'EXACT',
					value: 'product',
					notExpression: true,
				},
			},
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 3,
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topPostsArgs',
		} );
	} );
} );

describe( 'getTopChannelsReportOptions', () => {
	it( 'should build options that request the three channels with the most visits over the date range, most visits first', () => {
		expect(
			getTopChannelsReportOptions( {
				startDate: '2025-02-03',
				endDate: '2025-02-05',
			} )
		).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'sessions' } ],
			dimensions: [ 'sessionDefaultChannelGroup' ],
			orderby: [ { metric: { metricName: 'sessions' }, desc: true } ],
			limit: 3,
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topChannelsArgs',
		} );
	} );
} );

describe( 'getTopReferralsReportOptions', () => {
	it( 'should build options that request the three sources of the "Referral" channel with the most visits over the date range, most visits first', () => {
		expect(
			getTopReferralsReportOptions( {
				startDate: '2025-02-03',
				endDate: '2025-02-05',
			} )
		).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'sessions' } ],
			dimensions: [ 'sessionSource' ],
			dimensionFilters: { sessionDefaultChannelGroup: 'Referral' },
			orderby: [ { metric: { metricName: 'sessions' }, desc: true } ],
			limit: 3,
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topReferralsArgs',
		} );
	} );

	it( 'should filter on the same dimension that the channels report groups by, so the sources are those of its "Referral" row', () => {
		expect(
			getTopChannelsReportOptions( {
				startDate: '2025-02-03',
				endDate: '2025-02-05',
			} ).dimensions
		).toEqual( [ 'sessionDefaultChannelGroup' ] );
		expect(
			Object.keys(
				getTopReferralsReportOptions( {
					startDate: '2025-02-03',
					endDate: '2025-02-05',
				} ).dimensionFilters ?? {}
			)
		).toEqual( [ 'sessionDefaultChannelGroup' ] );
	} );
} );
