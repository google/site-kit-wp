/**
 * Audience Tiles report option builder tests.
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
	getAudienceTilesMetricsReportOptions,
	getAudienceTilesSiteKitAudiencesReportOptions,
	getAudienceTilesTopCitiesReportOptions,
	getAudienceTilesTopContentPageTitlesReportOptions,
	getAudienceTilesTopContentReportOptions,
	getAudienceTilesTotalPageviewsReportOptions,
} from './audienceTilesReportOptions';

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

const AUDIENCES = [ 'properties/1/audiences/1', 'properties/1/audiences/2' ];

const METRICS = [
	{ name: 'totalUsers' },
	{ name: 'sessionsPerUser' },
	{ name: 'screenPageViewsPerSession' },
	{ name: 'screenPageViews' },
];

const POST_TYPE_FILTER = {
	'customEvent:googlesitekit_post_type': {
		filterType: 'stringFilter',
		matchType: 'EXACT',
		value: 'post',
	},
};

describe( 'audienceTilesReportOptions', () => {
	describe( 'getAudienceTilesMetricsReportOptions', () => {
		it( 'splits by audience, filters to the given audiences, and keeps the comparison range', () => {
			expect(
				getAudienceTilesMetricsReportOptions( DATES, AUDIENCES )
			).toEqual( {
				...DATES,
				dimensions: [ { name: 'audienceResourceName' } ],
				dimensionFilters: { audienceResourceName: AUDIENCES },
				metrics: METRICS,
				reportID:
					'audience-segmentation_use-audience-tiles-reports_hook_reportOptions',
			} );
		} );
	} );

	describe( 'getAudienceTilesSiteKitAudiencesReportOptions', () => {
		it( 'splits by newVsReturning for the Site Kit fallback report', () => {
			expect(
				getAudienceTilesSiteKitAudiencesReportOptions( DATES )
			).toEqual( {
				...DATES,
				dimensions: [ { name: 'newVsReturning' } ],
				dimensionFilters: { newVsReturning: [ 'new', 'returning' ] },
				metrics: METRICS,
				reportID:
					'audience-segmentation_use-audience-tiles-reports_hook_newVsReturningReportOptions',
			} );
		} );
	} );

	describe( 'getAudienceTilesTotalPageviewsReportOptions', () => {
		it( 'requests site-wide pageviews for the current range only', () => {
			const options =
				getAudienceTilesTotalPageviewsReportOptions( DATES );

			expect( options ).toEqual( {
				startDate: DATES.startDate,
				endDate: DATES.endDate,
				metrics: [ { name: 'screenPageViews' } ],
				reportID:
					'audience-segmentation_use-audience-tiles-reports_hook_totalPageviewsReportOptions',
			} );
			expect( options ).not.toHaveProperty( 'compareStartDate' );
		} );
	} );

	describe( 'getAudienceTilesTopCitiesReportOptions', () => {
		it( 'requests cities ranked by users, limited to four so (not set) can be dropped', () => {
			expect( getAudienceTilesTopCitiesReportOptions( DATES ) ).toEqual( {
				startDate: DATES.startDate,
				endDate: DATES.endDate,
				dimensions: [ 'city' ],
				metrics: [ { name: 'totalUsers' } ],
				orderby: [
					{ metric: { metricName: 'totalUsers' }, desc: true },
				],
				limit: 4,
				reportID:
					'audience-segmentation_use-audience-tiles-reports_hook_topCitiesReportOptions',
			} );
		} );
	} );

	describe( 'getAudienceTilesTopContentReportOptions', () => {
		it( 'requests the top three post pages by pageviews', () => {
			expect( getAudienceTilesTopContentReportOptions( DATES ) ).toEqual(
				{
					startDate: DATES.startDate,
					endDate: DATES.endDate,
					dimensions: [ 'pagePath' ],
					metrics: [ { name: 'screenPageViews' } ],
					dimensionFilters: POST_TYPE_FILTER,
					orderby: [
						{
							metric: { metricName: 'screenPageViews' },
							desc: true,
						},
					],
					limit: 3,
					reportID:
						'audience-segmentation_use-audience-tiles-reports_hook_topContentReportOptions',
				}
			);
		} );
	} );

	describe( 'getAudienceTilesTopContentPageTitlesReportOptions', () => {
		it( 'pairs page paths with titles for the path-to-title lookup', () => {
			expect(
				getAudienceTilesTopContentPageTitlesReportOptions( DATES )
			).toEqual( {
				startDate: DATES.startDate,
				endDate: DATES.endDate,
				dimensions: [ 'pagePath', 'pageTitle' ],
				metrics: [ { name: 'screenPageViews' } ],
				dimensionFilters: POST_TYPE_FILTER,
				orderby: [
					{ metric: { metricName: 'screenPageViews' }, desc: true },
				],
				limit: 15,
				reportID:
					'audience-segmentation_use-audience-tiles-reports_hook_topContentPageTitlesReportOptions',
			} );
		} );
	} );
} );
