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
	FRESH_DATA_REPORT_FETCH_OPTIONS,
	TOP_CHANNELS_REPORT_ID,
	TOP_POSTS_REPORT_ID,
	TOP_REFERRALS_REPORT_ID,
	getTopChannelsReportOptions,
	getTopPostsReportOptions,
	getTopReferralsReportOptions,
} from './reportOptions';

const DATE_RANGE = { startDate: '2025-02-03', endDate: '2025-02-05' };

describe( 'FRESH_DATA_REPORT_FETCH_OPTIONS', () => {
	it( 'should cache a report for five minutes', () => {
		expect( FRESH_DATA_REPORT_FETCH_OPTIONS ).toEqual( { cacheTTL: 300 } );
	} );
} );

describe( 'getTopPostsReportOptions', () => {
	it( 'should return the visitors for each page over the date range, most visitors first', () => {
		expect( getTopPostsReportOptions( DATE_RANGE ) ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'pagePath' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			reportID: TOP_POSTS_REPORT_ID,
		} );
	} );
} );

describe( 'getTopChannelsReportOptions', () => {
	it( 'should return the visitors for each channel over the date range, most visitors first', () => {
		expect( getTopChannelsReportOptions( DATE_RANGE ) ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'sessionDefaultChannelGroup' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			reportID: TOP_CHANNELS_REPORT_ID,
		} );
	} );
} );

describe( 'getTopReferralsReportOptions', () => {
	it( 'should return the visitors for each source of the "Referral" channel over the date range, most visitors first', () => {
		expect( getTopReferralsReportOptions( DATE_RANGE ) ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'sessionSource' ],
			dimensionFilters: { sessionDefaultChannelGroup: 'Referral' },
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			reportID: TOP_REFERRALS_REPORT_ID,
		} );
	} );

	it( 'should filter on the same dimension that the channels report groups by, so the sources are those of its "Referral" row', () => {
		const [ channelDimension ] =
			getTopChannelsReportOptions( DATE_RANGE ).dimensions ?? [];

		expect(
			Object.keys(
				getTopReferralsReportOptions( DATE_RANGE ).dimensionFilters ??
					{}
			)
		).toEqual( [ channelDimension ] );
	} );
} );
