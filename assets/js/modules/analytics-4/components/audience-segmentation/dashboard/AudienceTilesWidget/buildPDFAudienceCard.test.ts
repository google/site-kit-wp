/**
 * Your visitor groups buildPDFAudienceCard tests.
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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import {
	AudienceCardInput,
	buildPDFAudienceCard,
	buildTopCities,
	buildTopContent,
	readAudienceMetrics,
	siteKitAudienceDimensionValue,
} from './buildPDFAudienceCard';

/**
 * Builds a minimal report from row and totals literals.
 *
 * @since n.e.x.t
 *
 * @param rows   The report rows.
 * @param totals Optional. The report totals.
 * @return A report the card helpers can read.
 */
function buildReport( rows: unknown[], totals?: unknown[] ): Report {
	return { rows, totals } as unknown as Report;
}

/**
 * Builds the current and previous metric rows for one audience.
 *
 * @since n.e.x.t
 *
 * @param dimensionValue The audience dimension value the rows belong to.
 * @param base           The base metric value. The previous row adds one.
 * @return The current and previous metric rows.
 */
function buildMetricRows( dimensionValue: string, base: number ) {
	return [ 'date_range_0', 'date_range_1' ].map( ( dateRange, index ) => ( {
		dimensionValues: [ { value: dimensionValue }, { value: dateRange } ],
		metricValues: [
			{ value: String( base + index ) }, // totalUsers
			{ value: '2' }, // sessionsPerUser
			{ value: '3' }, // screenPageViewsPerSession
			{ value: String( base * 10 + index ) }, // screenPageViews
		],
	} ) );
}

describe( 'siteKitAudienceDimensionValue', () => {
	it( 'returns `new` for the new visitors slug', () => {
		expect( siteKitAudienceDimensionValue( 'new-visitors' ) ).toBe( 'new' );
	} );

	it( 'returns `returning` for any other slug', () => {
		expect( siteKitAudienceDimensionValue( 'returning-visitors' ) ).toBe(
			'returning'
		);
	} );

	it( 'returns `returning` when the slug is undefined', () => {
		expect( siteKitAudienceDimensionValue( undefined ) ).toBe(
			'returning'
		);
	} );
} );

describe( 'readAudienceMetrics', () => {
	it( 'reads the four metrics with a current and previous value', () => {
		const metrics = readAudienceMetrics(
			buildReport( buildMetricRows( 'aud-1', 10 ) ),
			'aud-1'
		);

		expect( metrics.visitors ).toEqual( { current: 10, previous: 11 } );
		expect( metrics.pageviews.current ).toBe( 100 );
		expect( metrics.pageviews.previous ).toBe( 101 );
		// The card builder fills in the share later.
		expect( metrics.pageviews.percentageOfTotalPageViews ).toBe( 0 );
	} );

	it( 'reads a missing metric as zero', () => {
		const metrics = readAudienceMetrics( undefined, 'aud-1' );

		expect( metrics.visitors ).toEqual( { current: 0, previous: 0 } );
	} );
} );

describe( 'buildTopCities', () => {
	it( 'drops the `(not set)` row and computes each share of visitors', () => {
		const cities = buildTopCities(
			buildReport( [
				{
					dimensionValues: [ { value: 'Dublin' } ],
					metricValues: [ { value: '50' } ],
				},
				{
					dimensionValues: [ { value: '(not set)' } ],
					metricValues: [ { value: '10' } ],
				},
			] ),
			100
		);

		expect( cities ).toEqual( [ { name: 'Dublin', percentage: 0.5 } ] );
	} );

	it( 'reports a zero share when the audience has no visitors', () => {
		const cities = buildTopCities(
			buildReport( [
				{
					dimensionValues: [ { value: 'Dublin' } ],
					metricValues: [ { value: '50' } ],
				},
			] ),
			0
		);

		expect( cities[ 0 ].percentage ).toBe( 0 );
	} );
} );

describe( 'buildTopContent', () => {
	/**
	 * Maps a page path to a stable link fixture.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} pagePath Page path of a top content row.
	 * @return {string} The link fixture for the page.
	 */
	function getContentServiceURL( pagePath: string ): string {
		return `https://example.com/analytics-report${ pagePath }`;
	}

	it( 'resolves each page path to its title and its link, and falls back to the path', () => {
		const content = buildTopContent(
			buildReport( [
				{
					dimensionValues: [ { value: '/a' } ],
					metricValues: [ { value: '847' } ],
				},
				{
					dimensionValues: [ { value: '/b' } ],
					metricValues: [ { value: '5' } ],
				},
			] ),
			buildReport( [
				{ dimensionValues: [ { value: '/a' }, { value: 'Title A' } ] },
			] ),
			getContentServiceURL
		);

		expect( content ).toEqual( [
			{
				title: 'Title A',
				pageviews: 847,
				serviceURL: 'https://example.com/analytics-report/a',
			},
			{
				title: '/b',
				pageviews: 5,
				serviceURL: 'https://example.com/analytics-report/b',
			},
		] );
	} );

	it( 'keeps at most three pages', () => {
		const rows = [ '/a', '/b', '/c', '/d' ].map( ( path ) => ( {
			dimensionValues: [ { value: path } ],
			metricValues: [ { value: '1' } ],
		} ) );

		expect(
			buildTopContent( buildReport( rows ), undefined, () => '' )
		).toHaveLength( 3 );
	} );
} );

describe( 'buildPDFAudienceCard', () => {
	/**
	 * Builds a full audience card input with successful reports, so a test can
	 * override one field to make a single report fail.
	 *
	 * @since n.e.x.t
	 *
	 * @param overrides Optional. Fields to override on the input. Default `{}`.
	 * @return The card input.
	 */
	function buildCardInput(
		overrides: Partial< AudienceCardInput > = {}
	): AudienceCardInput {
		return {
			audienceResourceName: 'aud-1',
			audience: {
				name: 'aud-1',
				displayName: 'Custom A',
				audienceType: 'USER_AUDIENCE',
			},
			usesSiteKitReport: false,
			metricsResult: {
				response: buildReport( buildMetricRows( 'aud-1', 10 ) ),
			},
			topCitiesResult: {
				response: buildReport( [
					{
						dimensionValues: [ { value: 'Dublin' } ],
						metricValues: [ { value: '50' } ],
					},
				] ),
			},
			topContentResult: {
				response: buildReport( [
					{
						dimensionValues: [ { value: '/a' } ],
						metricValues: [ { value: '80' } ],
					},
				] ),
			},
			topContentPageTitlesResult: { response: buildReport( [] ) },
			totalPageviews: 1000,
			getContentServiceURL: () => '',
			...overrides,
		};
	}

	it( 'builds a card with the audience name, metrics, pageviews share, and top content links', () => {
		const card = buildPDFAudienceCard(
			buildCardInput( {
				getContentServiceURL: ( pagePath: string ) =>
					`https://example.com/analytics-report${ pagePath }`,
			} )
		);

		expect( card?.audienceName ).toBe( 'Custom A' );
		expect( card?.metrics.visitors.current ).toBe( 10 );
		// 100 current pageviews over 1000 total is a 0.1 share.
		expect( card?.metrics.pageviews.percentageOfTotalPageViews ).toBe(
			0.1
		);
		expect( card?.topCities ).toEqual( [
			{ name: 'Dublin', percentage: 5 },
		] );
		// The card hands each top content page path to the link resolver, so
		// the row holds the link its title renders as.
		expect( card?.topContent ).toEqual( [
			{
				title: '/a',
				pageviews: 80,
				serviceURL: 'https://example.com/analytics-report/a',
			},
		] );
	} );

	it( 'drops the audience when the metrics report failed', () => {
		expect(
			buildPDFAudienceCard(
				buildCardInput( {
					metricsResult: { error: { message: 'failed' } },
				} )
			)
		).toBeNull();
	} );

	it( 'drops the audience when the cities report failed', () => {
		expect(
			buildPDFAudienceCard(
				buildCardInput( {
					topCitiesResult: { error: { message: 'failed' } },
				} )
			)
		).toBeNull();
	} );

	it( 'keeps the audience when the top content error is a missing custom dimension', () => {
		const card = buildPDFAudienceCard(
			buildCardInput( {
				topContentResult: {
					error: {
						code: 400,
						message: 'field is not a valid dimension',
					},
				},
			} )
		);

		expect( card ).not.toBeNull();
		expect( card?.topContent ).toEqual( [] );
	} );
} );
