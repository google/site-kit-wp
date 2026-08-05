/**
 * DashboardPopularKeywordsWidgetPDF tests.
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
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import DashboardPopularKeywordsWidgetPDF from './DashboardPopularKeywordsWidgetPDF';

/**
 * Widget data fixture used by the render tests.
 */
const DATA = {
	rows: [
		{ keys: [ 'cat food' ], clicks: 1200, impressions: 4500 },
		{ keys: [ 'dog toys' ], clicks: 300, impressions: 900 },
	],
	links: {
		'cat food': 'https://example.com/search-console-report/cat-food',
		'dog toys': 'https://example.com/search-console-report/dog-toys',
	},
};

/**
 * Renders the widget to a JSON string for content and style assertions.
 *
 * @since 1.183.0
 *
 * @param props Props passed to the widget.
 * @return JSON string of the rendered tree.
 */
function renderJSON(
	props: ComponentProps< typeof DashboardPopularKeywordsWidgetPDF >
) {
	return JSON.stringify(
		TestRenderer.create(
			<DashboardPopularKeywordsWidgetPDF { ...props } />
		).toJSON()
	);
}

describe( 'DashboardPopularKeywordsWidgetPDF', () => {
	it( 'renders the "Top search queries for your site" section heading', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( 'Top search queries for your site' );
	} );

	it( 'renders the Search query, Clicks, and Impressions headers in order', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( 'Search query' );

		const headerPositions = [ 'Search query', 'Clicks', 'Impressions' ].map(
			( header ) => json.indexOf( header )
		);

		// All three headers appear, in the order Search query, then Clicks,
		// then Impressions.
		expect( headerPositions ).not.toContain( -1 );
		expect( headerPositions ).toEqual(
			[ ...headerPositions ].sort(
				( firstPosition, secondPosition ) =>
					firstPosition - secondPosition
			)
		);
	} );

	it( 'renders each search query', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( 'cat food' );
		expect( json ).toContain( 'dog toys' );
	} );

	it( 'shows the rank number before each query', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '1.' );
		expect( json ).toContain( '2.' );
	} );

	it( 'links each query to its Search Console report', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( DATA.links[ 'cat food' ] );
		expect( json ).toContain( DATA.links[ 'dog toys' ] );
		// The `Link` primitive from `@react-pdf` renders as `pdf-link` under
		// the test mock. So a `pdf-link` in the tree means the query rendered
		// as a link, not as text that happens to hold the URL.
		expect( json ).toContain( 'pdf-link' );
	} );

	it( 'renders each query as plain text when a query has no link', () => {
		// An empty `links` map gives every query an empty link, so each one
		// renders as plain text.
		const json = renderJSON( { data: { ...DATA, links: {} } } );

		expect( json ).toContain( 'cat food' );
		expect( json ).toContain( 'dog toys' );
		// No `pdf-link` in the tree means every query rendered as plain text.
		expect( json ).not.toContain( 'pdf-link' );
	} );

	it( 'renders each query link in the link color', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '#108080' );
	} );

	it( 'formats Clicks and Impressions with thousands separators', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '1,200' );
		expect( json ).toContain( '4,500' );
	} );

	it( 'truncates a long query to one line with an ellipsis and keeps a 20px gap before the Clicks column', () => {
		const json = renderJSON( {
			data: {
				...DATA,
				rows: [
					{
						keys: [
							"A very long search query that doesn't fit on one line",
						],
						clicks: 9,
						impressions: 1204,
					},
				],
			},
		} );

		expect( json ).toContain( '"maxLines":1' );
		expect( json ).toContain( '"textOverflow":"ellipsis"' );
		expect( json ).toContain(
			`"flexBasis":0,"marginRight":${ 20 * PDF_SCALE }`
		);
	} );

	it( 'applies the column widths and the scaled column gap', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '66.7%' );
		expect( json ).toContain( '3.69%' );
		expect( json ).toContain( '28.87%' );
		expect( json ).toContain( `"columnGap":${ 8 * PDF_SCALE }` );
	} );

	it( 'returns null when there are no rows', () => {
		// The whole section returns null, heading and card included.
		const renderer = TestRenderer.create(
			<DashboardPopularKeywordsWidgetPDF data={ { rows: [] } } />
		);

		expect( renderer.toJSON() ).toBeNull();
	} );

	it( 'returns null when data is null', () => {
		const renderer = TestRenderer.create(
			<DashboardPopularKeywordsWidgetPDF data={ null } />
		);

		expect( renderer.toJSON() ).toBeNull();
	} );
} );
