/**
 * DashboardAllTrafficWidgetGA4 indexPDF tests.
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
import type { ComponentProps } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import DashboardAllTrafficWidgetGA4PDF from './indexPDF';

function buildReports( {
	currentUsers,
	previousUsers,
	rowCount,
}: {
	currentUsers: string;
	previousUsers: string;
	rowCount: number;
} ) {
	return {
		totalsReport: {
			totals: [
				{ metricValues: [ { value: currentUsers } ] },
				{ metricValues: [ { value: previousUsers } ] },
			],
		},
		graphReport: {
			rows: Array.from( { length: rowCount }, () => ( {
				metricValues: [ { value: '1' } ],
			} ) ),
		},
	};
}

function renderTree(
	props: ComponentProps< typeof DashboardAllTrafficWidgetGA4PDF >
) {
	const renderer = TestRenderer.create(
		<DashboardAllTrafficWidgetGA4PDF { ...props } />
	);
	return renderer.toJSON();
}

describe( 'DashboardAllTrafficWidgetGA4 PDF', () => {
	it( 'renders the widget heading, All visitors metric tile, and a chart placeholder against shaped data', () => {
		const data = buildReports( {
			currentUsers: '1234',
			previousUsers: '1000',
			rowCount: 28,
		} );

		const tree = renderTree( { data } );
		const json = JSON.stringify( tree );

		expect( json ).toContain( 'Your site traffic over time' );
		expect( json ).toContain( 'All visitors' );
		// `numFmt` abbreviates large totals, matching the dashboard widget.
		expect( json ).toContain( '1.2K' );
		expect( json ).toContain( 'Vs. prev. 28 days' );
		// Short chart placeholder block uses our fixed background color.
		expect( json ).toContain( '#ebeef0' );
		expect( json ).not.toContain( 'No data available' );
	} );

	it( 'renders a green chip with a positive signed change', () => {
		const data = buildReports( {
			currentUsers: '1200',
			previousUsers: '1000',
			rowCount: 28,
		} );

		const tree = renderTree( { data } );
		const json = JSON.stringify( tree );

		expect( json ).toContain( '#d8ffc0' );
		expect( json ).toContain( '+20%' );
	} );

	it( 'renders a red chip with a negative signed change', () => {
		const data = buildReports( {
			currentUsers: '800',
			previousUsers: '1000',
			rowCount: 28,
		} );

		const tree = renderTree( { data } );
		const json = JSON.stringify( tree );

		expect( json ).toContain( '#ffded3' );
		expect( json ).toContain( '-20%' );
	} );

	it( 'renders the No data available placeholder when data is null', () => {
		const tree = renderTree( { data: null } );
		const json = JSON.stringify( tree );

		expect( json ).toContain( 'No data available' );
		expect( json ).not.toContain( 'All visitors' );
		expect( json ).not.toContain( '#ebeef0' );
	} );

	it( 'renders the No data available placeholder when data is undefined', () => {
		const tree = renderTree( {} );
		const json = JSON.stringify( tree );

		expect( json ).toContain( 'No data available' );
	} );
} );
