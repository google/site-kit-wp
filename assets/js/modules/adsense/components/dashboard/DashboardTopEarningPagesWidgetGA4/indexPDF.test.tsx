/**
 * DashboardTopEarningPagesWidgetGA4PDF tests.
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
import DashboardTopEarningPagesWidgetGA4PDF from './indexPDF';

/**
 * Widget data fixture used by the render tests.
 */
const DATA = {
	rows: [
		{
			dimensionValues: [
				{ value: '/home-page' },
				{ value: 'Google AdSense account (pub-1234567890)' },
			],
			metricValues: [ { value: '0.31' } ],
		},
		{
			dimensionValues: [
				{ value: '/about-page' },
				{ value: 'Google AdSense account (pub-1234567890)' },
			],
			metricValues: [ { value: '0.05' } ],
		},
	],
	currencyCode: 'EUR',
	titles: { '/home-page': 'Home Title', '/about-page': 'About Title' },
};

/**
 * Renders the widget to a JSON string for content and style assertions.
 *
 * @since n.e.x.t
 *
 * @param props Props passed to the widget.
 * @return JSON string of the rendered tree.
 */
function renderJSON(
	props: ComponentProps< typeof DashboardTopEarningPagesWidgetGA4PDF >
) {
	return JSON.stringify(
		TestRenderer.create(
			<DashboardTopEarningPagesWidgetGA4PDF { ...props } />
		).toJSON()
	);
}

describe( 'DashboardTopEarningPagesWidgetGA4PDF', () => {
	it( 'renders the "Top earning pages" section heading', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( 'Top earning pages' );
	} );

	it( 'renders the page title column before the Earnings column', () => {
		const json = renderJSON( { data: DATA } );

		// The Earnings header marks the second column, and within the first body
		// row the page title cell renders before its earnings cell, so the page
		// title comes first and Earnings second.
		expect( json ).toContain( 'Earnings' );

		const firstTitlePosition = json.indexOf( 'Home Title' );
		const firstEarningsPosition = json.indexOf( '€0.31' );

		expect( firstTitlePosition ).toBeGreaterThan( -1 );
		expect( firstEarningsPosition ).toBeGreaterThan( -1 );
		expect( firstTitlePosition ).toBeLessThan( firstEarningsPosition );
	} );

	it( 'maps each row page path to its resolved title', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( 'Home Title' );
		expect( json ).toContain( 'About Title' );
	} );

	it( 'numbers each row by its rank in the page title cell', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '1.' );
		expect( json ).toContain( '2.' );
	} );

	it( 'renders the page title in the Site Kit teal color', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '#108080' );
	} );

	it( 'formats the earnings as currency using the report currency code', () => {
		const json = renderJSON( { data: DATA } );

		expect( json ).toContain( '€0.31' );
		expect( json ).toContain( '€0.05' );
	} );

	it( 'renders the No data available placeholder when there are no rows', () => {
		const json = renderJSON( {
			data: { rows: [], currencyCode: 'EUR', titles: {} },
		} );

		expect( json ).toContain( 'No data available' );
		expect( json ).not.toContain( 'Earnings' );
	} );

	it( 'renders the No data available placeholder when data is null', () => {
		const json = renderJSON( { data: null } );

		expect( json ).toContain( 'No data available' );
		expect( json ).not.toContain( 'Earnings' );
	} );
} );
