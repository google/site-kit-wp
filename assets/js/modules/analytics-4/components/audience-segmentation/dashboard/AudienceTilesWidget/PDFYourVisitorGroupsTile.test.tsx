/**
 * PDFYourVisitorGroupsTile tests.
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
 * External dependencies
 */
import { ComponentProps } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFYourVisitorGroupsTile from './PDFYourVisitorGroupsTile';

const METRICS = {
	visitors: { current: 24200, previous: 22000 },
	visitsPerVisitor: { current: 3, previous: 3 },
	pagesPerVisit: { current: 2, previous: 2.5 },
	pageviews: {
		current: 1565,
		previous: 1500,
		percentageOfTotalPageViews: 0.33,
	},
};

const TOP_CITIES = [
	{ name: 'Dublin', percentage: 0.388 },
	{ name: 'London', percentage: 0.126 },
	{ name: 'New York', percentage: 0.094 },
];

const TOP_CONTENT = [
	{
		title: 'First post title',
		pageviews: 847,
		serviceURL: 'https://example.com/analytics-report/first-post',
	},
	{
		title: 'Second post title',
		pageviews: 596,
		serviceURL: 'https://example.com/analytics-report/second-post',
	},
];

/**
 * Renders `PDFYourVisitorGroupsTile` with default props, as a JSON tree string.
 *
 * @since 1.184.0
 *
 * @param props Props that override the defaults.
 * @return The rendered tree serialized to a string.
 */
function renderTile(
	props: Partial< ComponentProps< typeof PDFYourVisitorGroupsTile > > = {}
) {
	const renderer = TestRenderer.create(
		<PDFYourVisitorGroupsTile
			audienceName="New visitors"
			metrics={ METRICS }
			topCities={ TOP_CITIES }
			topContent={ TOP_CONTENT }
			isAudiencePartialData={ false }
			isTopContentPartialData={ false }
			{ ...props }
		/>
	);
	return JSON.stringify( renderer.toJSON() );
}

/**
 * Counts the "Partial data" badges.
 *
 * @since n.e.x.t
 *
 * @param json The rendered PDF content, serialized to a string.
 * @return The number of "Partial data" badges.
 */
function countPartialDataBadges( json: string ) {
	return json.split( 'Partial data' ).length - 1;
}

describe( 'PDFYourVisitorGroupsTile', () => {
	it( 'renders the audience name header', () => {
		expect( renderTile() ).toContain( 'New visitors' );
	} );

	it( 'renders the four metric tiles in order, with the pageviews share label', () => {
		const json = renderTile();

		expect( json ).toContain( 'Visitors' );
		expect( json ).toContain( 'Visits per visitor' );
		expect( json ).toContain( 'Pages per visit' );
		expect( json ).toContain( '33% of total pageviews' );

		expect( json.indexOf( 'Visitors' ) ).toBeLessThan(
			json.indexOf( 'Visits per visitor' )
		);
		expect( json.indexOf( 'Visits per visitor' ) ).toBeLessThan(
			json.indexOf( 'Pages per visit' )
		);
		expect( json.indexOf( 'Pages per visit' ) ).toBeLessThan(
			json.indexOf( '33% of total pageviews' )
		);
	} );

	it( 'colors the delta chip green when rising and red when falling', () => {
		const json = renderTile();

		// Visitors rose from 22000 to 24200.
		expect( json ).toContain( '+10%' );
		expect( json ).toContain( PDF_COLORS.GREEN_G_50 );

		// Pages per visit fell from 2.5 to 2.
		expect( json ).toContain( '-20%' );
		expect( json ).toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
	} );

	it( 'renders each top city with its name and percentage', () => {
		const json = renderTile();

		expect( json ).toContain( 'Cities with the most visitors' );
		expect( json ).toContain( 'Dublin' );
		expect( json ).toContain( '38.8%' );
		expect( json ).toContain( 'London' );
		expect( json ).toContain( 'New York' );
	} );

	it( 'renders each top content row with its title and pageviews', () => {
		const json = renderTile();

		expect( json ).toContain( 'Top content by pageviews' );
		expect( json ).toContain( 'First post title' );
		expect( json ).toContain( '847' );
		expect( json ).toContain( 'Second post title' );
		expect( json ).toContain( '596' );
	} );

	it( 'shows a Partial data badge only where its flag is set', () => {
		// Neither flag: no badge in either place.
		expect( countPartialDataBadges( renderTile() ) ).toBe( 0 );

		// Header flag only: one badge beside the audience name.
		expect(
			countPartialDataBadges(
				renderTile( { isAudiencePartialData: true } )
			)
		).toBe( 1 );

		// Top content flag only: one badge on the Top content title.
		expect(
			countPartialDataBadges(
				renderTile( { isTopContentPartialData: true } )
			)
		).toBe( 1 );

		// Both flags: a badge in each place.
		expect(
			countPartialDataBadges(
				renderTile( {
					isAudiencePartialData: true,
					isTopContentPartialData: true,
				} )
			)
		).toBe( 2 );
	} );

	it( 'truncates a long city name to one line with an ellipsis', () => {
		const json = renderTile( {
			topCities: [
				{
					name: 'Municipal District of Bandon - Kinsale',
					percentage: 0.5,
				},
			],
		} );

		expect( json ).toContain( 'Municipal District of Bandon - Kinsale' );
		// `@react-pdf` wraps text by default, so the city name caps at one line
		// with an ellipsis.
		expect( json ).toContain( '"maxLines":1' );
		expect( json ).toContain( '"textOverflow":"ellipsis"' );
	} );

	it( 'links each top content title to its Analytics report', () => {
		const json = renderTile();

		expect( json ).toContain( TOP_CONTENT[ 0 ].serviceURL );
		expect( json ).toContain( TOP_CONTENT[ 1 ].serviceURL );
		// The `Link` primitive from `@react-pdf` renders as `pdf-link` under
		// the test mock. So a `pdf-link` in the tree means the title rendered
		// as a link, not as text that happens to hold the URL.
		expect( json ).toContain( 'pdf-link' );
	} );

	it( 'renders each top content title as plain text when a row has no link', () => {
		// An empty `serviceURL` gives every row an empty link, so each title
		// renders as plain text.
		const json = renderTile( {
			topContent: TOP_CONTENT.map( ( content ) => ( {
				...content,
				serviceURL: '',
			} ) ),
		} );

		expect( json ).toContain( 'First post title' );
		expect( json ).toContain( 'Second post title' );
		// No `pdf-link` in the tree means every title rendered as plain text.
		expect( json ).not.toContain( 'pdf-link' );
	} );

	it( "hides the delta chip when the change can't be calculated", () => {
		// A zero previous value leaves no calculable change for any metric.
		const json = renderTile( {
			metrics: {
				visitors: { current: 100, previous: 0 },
				visitsPerVisitor: { current: 3, previous: 0 },
				pagesPerVisit: { current: 2, previous: 0 },
				pageviews: {
					current: 1565,
					previous: 0,
					percentageOfTotalPageViews: 0.33,
				},
			},
		} );

		// No calculable change means no chip in either color.
		expect( json ).not.toContain( PDF_COLORS.GREEN_G_50 );
		expect( json ).not.toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
	} );
} );
