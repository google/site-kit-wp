/**
 * ModulePopularPagesWidgetGA4PDF tests.
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
import ModulePopularPagesWidgetGA4PDF from './ModulePopularPagesWidgetGA4PDF';

/**
 * Widget data fixture used by the render tests.
 */
const DATA = {
	rows: [
		{
			dimensionValues: [ { value: '/home-page' } ],
			metricValues: [
				{ value: '1200' },
				{ value: '1100' },
				{ value: '0.5' },
				{ value: '98' },
			],
		},
		{
			dimensionValues: [ { value: '/about-page' } ],
			metricValues: [
				{ value: '300' },
				{ value: '200' },
				{ value: '0.4' },
				{ value: '51' },
			],
		},
	],
	titles: { '/home-page': 'Home Title', '/about-page': 'About Title' },
	links: {
		'/home-page': {
			detailsURL:
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=http%3A%2F%2Fexample.com%2Fhome-page',
			permaLink: 'http://example.com/home-page',
		},
		'/about-page': {
			detailsURL:
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=http%3A%2F%2Fexample.com%2Fabout-page',
			permaLink: 'http://example.com/about-page',
		},
	},
};

/**
 * Renders the widget to a JSON string for content and style assertions.
 *
 * @since 1.182.0
 *
 * @param props Props passed to the widget.
 * @return JSON string of the rendered tree.
 */
function renderJSON(
	props: ComponentProps< typeof ModulePopularPagesWidgetGA4PDF >
) {
	return JSON.stringify(
		TestRenderer.create(
			<ModulePopularPagesWidgetGA4PDF { ...props } />
		).toJSON()
	);
}

describe( 'ModulePopularPagesWidgetGA4PDF', () => {
	it( 'renders the "Top content over time" section heading', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( 'Top content over time' );
	} );

	it( 'renders the five columns in order', () => {
		const json = renderJSON( { data: DATA } );

		const headerPositions = [
			'Title',
			'Pageviews',
			'Sessions',
			'Engaged sessions',
			'Session duration',
		].map( ( header ) => json.indexOf( header ) );

		// Every header is present (no -1), and the positions are ascending, so
		// the columns render in the expected order.
		expect( headerPositions ).not.toContain( -1 );
		expect( headerPositions ).toEqual(
			[ ...headerPositions ].sort(
				( firstPosition, secondPosition ) =>
					firstPosition - secondPosition
			)
		);
	} );

	it( 'renders the page title above the page URL in the Title cell', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( 'Home Title' );
		expect( json ).toContain( '/home-page' );

		// The title line comes before its own URL line.
		expect( json.indexOf( 'Home Title' ) ).toBeLessThan(
			json.indexOf( '/home-page' )
		);
	} );

	it( 'links each title to its entity dashboard and each URL to its page', () => {
		const json = renderJSON( { data: DATA } );

		// The title links to the entity dashboard.
		expect( json ).toContain(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=http%3A%2F%2Fexample.com%2Fhome-page'
		);
		// The URL line links to the page itself.
		expect( json ).toContain( 'http://example.com/home-page' );
		expect( json ).toContain( 'http://example.com/about-page' );
	} );

	it( 'renders the title and URL links without an underline', () => {
		const json = renderJSON( { data: DATA } );

		// @react-pdf underlines links by default, so the PDF report removes it.
		expect( json ).toContain( '"textDecoration":"none"' );
	} );

	it( 'truncates a long page URL with an ellipsis', () => {
		const longURL = `/${ 'a'.repeat( 80 ) }`;
		const json = renderJSON( {
			data: {
				rows: [
					{
						dimensionValues: [ { value: longURL } ],
						metricValues: [
							{ value: '1' },
							{ value: '1' },
							{ value: '0.5' },
							{ value: '1' },
						],
					},
				],
				titles: { [ longURL ]: 'Long Title' },
			},
		} );

		// The full URL is replaced by a truncated form ending in an ellipsis.
		expect( json ).toContain( '…' );
		expect( json ).not.toContain( longURL );
	} );

	it( 'numbers each row by its rank in the Title cell', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '1.' );
		expect( json ).toContain( '2.' );
	} );

	it( 'renders the page title in the Site Kit teal color', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '#108080' );
	} );

	it( 'sets each metric column width', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '6.46%' );
		expect( json ).toContain( '10.15%' );
		expect( json ).toContain( '15.5%' );
		expect( json ).toContain( '10.33%' );
	} );

	it( 'formats Pageviews and Sessions with thousands separators', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '1,200' );
		expect( json ).toContain( '1,100' );
	} );

	it( 'formats Engaged sessions as a percentage from the engagement rate', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '50%' );
		expect( json ).toContain( '40%' );
	} );

	it( 'formats Session duration as minutes and seconds, like 1m 38s or 51s', () => {
		const json = renderJSON( { data: DATA } );

		// 98 seconds renders as 1m 38s, 51 seconds renders as 51s.
		expect( json ).toContain( '1m 38s' );
		expect( json ).toContain( '51s' );
	} );

	it( 'renders the No data available placeholder when there are no rows', () => {
		const json = renderJSON( { data: { rows: [], titles: {} } } );

		expect( json ).toContain( 'No data available' );
		expect( json ).not.toContain( 'Pageviews' );
	} );

	it( 'renders the No data available placeholder when data is null', () => {
		const json = renderJSON( { data: null } );

		expect( json ).toContain( 'No data available' );
		expect( json ).not.toContain( 'Pageviews' );
	} );

	it( 'scales the cell font size', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( `"fontSize":${ 14 * PDF_SCALE }` );
	} );
} );
