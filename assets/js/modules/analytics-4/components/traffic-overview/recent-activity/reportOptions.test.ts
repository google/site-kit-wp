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
	getPlainPermalinkTopPostsReportOptions,
	getTopChannelsReportOptions,
	getTopPostsReportOptions,
	getTopReferralsReportOptions,
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

describe( 'getPlainPermalinkTopPostsReportOptions', () => {
	/**
	 * Gets the pattern of the filter that leaves the product URLs out of the
	 * report, as a regular expression.
	 *
	 * Analytics reads the pattern as RE2, which reads it the same way as
	 * JavaScript, because it has no lookaround and no backreference.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string|null} queryVar The query var of the product post type, or `null` for none.
	 * @return {RegExp} The pattern.
	 */
	function getProductPattern( queryVar: string | null ): RegExp {
		const { dimensionFilters } = getPlainPermalinkTopPostsReportOptions(
			{ startDate: '2025-02-03', endDate: '2025-02-05' },
			{ by: 'queryString', postType: 'product', queryVar }
		);
		const filter = dimensionFilters?.pagePathPlusQueryString as {
			value: string;
		};

		return new RegExp( filter.value );
	}

	it( 'should build options that request the 1,000 URLs with the most views over the date range, by their path and query string, most views first', () => {
		expect(
			getPlainPermalinkTopPostsReportOptions(
				{ startDate: '2025-02-03', endDate: '2025-02-05' },
				null
			)
		).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			metrics: [ { name: 'screenPageViews' } ],
			dimensions: [ 'pagePathPlusQueryString' ],
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 1000,
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_plainPermalinkTopPostsArgs',
		} );
	} );

	it( 'should build options that leave out the URL of each single product, by its query var or by its post type with an ID', () => {
		expect(
			getPlainPermalinkTopPostsReportOptions(
				{ startDate: '2025-02-03', endDate: '2025-02-05' },
				{ by: 'queryString', postType: 'product', queryVar: 'product' }
			).dimensionFilters
		).toEqual( {
			pagePathPlusQueryString: {
				filterType: 'stringFilter',
				matchType: 'PARTIAL_REGEXP',
				value: '[?&](?:product=[^&]|post_type=product&(?:[^&]*&)*p=[0-9]|p=[0-9]+&(?:[^&]*&)*post_type=product(?:&|$))',
				notExpression: true,
			},
		} );
	} );

	it( 'should build options that leave out a single product only by its post type with an ID when the product post type has no query var', () => {
		expect(
			getPlainPermalinkTopPostsReportOptions(
				{ startDate: '2025-02-03', endDate: '2025-02-05' },
				{ by: 'queryString', postType: 'product', queryVar: null }
			).dimensionFilters
		).toEqual( {
			pagePathPlusQueryString: {
				filterType: 'stringFilter',
				matchType: 'PARTIAL_REGEXP',
				value: '[?&](?:post_type=product&(?:[^&]*&)*p=[0-9]|p=[0-9]+&(?:[^&]*&)*post_type=product(?:&|$))',
				notExpression: true,
			},
		} );
	} );

	it( 'should build a product filter that matches each URL of a single product', () => {
		const productPattern = getProductPattern( 'product' );

		expect( productPattern.test( '/?product=hoodie' ) ).toBe( true );
		expect(
			productPattern.test( '/?product=hoodie&attribute_pa_color=red' )
		).toBe( true );
		expect( productPattern.test( '/?post_type=product&p=5' ) ).toBe( true );
		expect( productPattern.test( '/?p=5&post_type=product' ) ).toBe( true );
		expect(
			productPattern.test( '/?post_type=product&utm_source=x&p=5' )
		).toBe( true );
	} );

	it( 'should build a product filter that matches neither the shop, a product search, a product category, another post type nor another query var', () => {
		const productPattern = getProductPattern( 'product' );

		expect( productPattern.test( '/?post_type=product' ) ).toBe( false );
		expect( productPattern.test( '/?s=hats&post_type=product' ) ).toBe(
			false
		);
		expect( productPattern.test( '/?product_cat=hats' ) ).toBe( false );
		expect( productPattern.test( '/?post_type=products&p=5' ) ).toBe(
			false
		);
		expect( productPattern.test( '/?p=5&post_type=products' ) ).toBe(
			false
		);
		expect( productPattern.test( '/?featured_product=hoodie' ) ).toBe(
			false
		);
		expect( productPattern.test( '/?p=5' ) ).toBe( false );
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
