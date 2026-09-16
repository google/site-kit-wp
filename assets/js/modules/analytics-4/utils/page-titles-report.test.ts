/**
 * Analytics 4 page titles report helpers tests.
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
	PAGE_TITLES_REPORT_ID,
	PAGE_TITLES_REQUEST_MULTIPLIER,
	getPagePaths,
	getPageTitleMap,
	getPageTitlesReportOptions,
} from './page-titles-report';

const DATES = { startDate: '2025-01-08', endDate: '2025-02-04' };

describe( 'page titles report helpers', () => {
	describe( 'getPagePaths', () => {
		it( 'returns the unique first-dimension values in row order', () => {
			const report = {
				rows: [
					{ dimensionValues: [ { value: '/' } ] },
					{ dimensionValues: [ { value: '/about' } ] },
					{ dimensionValues: [ { value: '/' } ] },
				],
			};

			expect( getPagePaths( report ) ).toEqual( [ '/', '/about' ] );
		} );

		it( 'returns an empty array for a missing or empty report', () => {
			expect( getPagePaths() ).toEqual( [] );
			expect( getPagePaths( { rows: [] } ) ).toEqual( [] );
		} );
	} );

	describe( 'getPageTitlesReportOptions', () => {
		it( 'builds the page titles report args with sorted paths and the shared report ID', () => {
			const options = getPageTitlesReportOptions( DATES, [ '/b', '/a' ] );

			expect( options ).toEqual( {
				startDate: '2025-01-08',
				endDate: '2025-02-04',
				dimensions: [ 'pagePath', 'pageTitle' ],
				dimensionFilters: { pagePath: [ '/a', '/b' ] },
				metrics: [ { name: 'screenPageViews' } ],
				orderby: [
					{
						metric: { metricName: 'screenPageViews' },
						desc: true,
					},
				],
				limit: PAGE_TITLES_REQUEST_MULTIPLIER * 2,
				reportID: PAGE_TITLES_REPORT_ID,
			} );
		} );

		it( 'does not mutate the passed page paths array', () => {
			const pagePaths = [ '/b', '/a' ];

			getPageTitlesReportOptions( DATES, pagePaths );

			expect( pagePaths ).toEqual( [ '/b', '/a' ] );
		} );
	} );

	describe( 'getPageTitleMap', () => {
		it( 'keeps the first title for a path and falls back to "(unknown)" for a missing one', () => {
			const titlesReport = {
				rows: [
					{ dimensionValues: [ { value: '/' }, { value: 'Home' } ] },
					{
						dimensionValues: [
							{ value: '/' },
							{ value: 'Home (older)' },
						],
					},
					{
						dimensionValues: [
							{ value: '/about' },
							{ value: 'About' },
						],
					},
				],
			};

			expect(
				getPageTitleMap( [ '/', '/about', '/contact' ], titlesReport )
			).toEqual( {
				'/': 'Home',
				'/about': 'About',
				'/contact': '(unknown)',
			} );
		} );
	} );
} );
