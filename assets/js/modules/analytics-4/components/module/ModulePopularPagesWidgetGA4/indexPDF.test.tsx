/**
 * ModulePopularPagesWidgetGA4 indexPDF tests.
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
import ModulePopularPagesWidgetGA4PDF from './indexPDF';

const DATA = {
	rows: [
		{
			dimensionValues: [ { value: '/' } ],
			metricValues: [
				{ value: '1200' },
				{ value: '800' },
				{ value: '0.5' },
				{ value: '98' },
			],
		},
		{
			dimensionValues: [ { value: '/about' } ],
			metricValues: [
				{ value: '300' },
				{ value: '200' },
				{ value: '0.4' },
				{ value: '51' },
			],
		},
	],
	titles: { '/': 'Home', '/about': 'About' },
};

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
	it( 'renders the five columns in order', () => {
		const json = renderJSON( { data: DATA } );

		const headerPositions = [
			'Title',
			'Pageviews',
			'Sessions',
			'Engaged sessions',
			'Session duration',
		].map( ( header ) => json.indexOf( header ) );

		// Every header is present (no -1), and the positions are ascending,
		// so the columns render in the expected order.
		expect( headerPositions ).not.toContain( -1 );
		expect( headerPositions ).toEqual(
			[ ...headerPositions ].sort( ( a, b ) => a - b )
		);
	} );

	it( 'renders the resolved title above the page URL in the Title cell', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( 'Home' );
		expect( json ).toContain( '/about' );
		expect( json ).toContain( 'About' );

		// The title line comes before its URL line.
		expect( json.indexOf( 'Home' ) ).toBeLessThan( json.indexOf( '/about' ) );
	} );

	it( 'numbers each row by its rank in the Title cell', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '1.' );
		expect( json ).toContain( '2.' );
	} );

	it( 'renders the page title in the teal link colour', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '#108080' );
	} );

	it( 'formats Pageviews and Sessions with thousands separators', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '1,200' );
		expect( json ).toContain( '800' );
	} );

	it( 'formats Engaged sessions as a percentage from the engagement rate', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '50%' );
		expect( json ).toContain( '40%' );
	} );

	it( 'formats Session duration in the Xm Ys form', () => {
		const json = renderJSON( { data: DATA } );

		// 98 seconds renders as 1m 38s, 51 seconds renders as 51s.
		expect( json ).toContain( '1m 38s' );
		expect( json ).toContain( '51s' );
	} );

	it( 'renders the No data available placeholder when there are no rows', () => {
		const json = renderJSON( { data: { rows: [], titles: {} } } );

		expect( json ).toContain( 'No data available' );
	} );

	it( 'renders the No data available placeholder when data is null', () => {
		const json = renderJSON( { data: null } );

		expect( json ).toContain( 'No data available' );
	} );
} );
