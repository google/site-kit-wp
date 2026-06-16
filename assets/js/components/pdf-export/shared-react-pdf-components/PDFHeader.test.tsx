/**
 * PDFHeader tests.
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
import { SECTION_ICONS } from '@/js/components/pdf-export/section-icons';
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import { render } from '@tests/js/test-utils';
import PDFHeader, { PDFHeaderProps } from './PDFHeader';

const sections = [
	{
		slug: 'mainDashboardKeyMetrics',
		label: 'Key metrics',
		Icon: SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_KEY_METRICS ],
	},
	{
		slug: 'mainDashboardTrafficPrimary',
		label: 'Traffic',
		Icon: SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
	},
	{
		slug: 'mainDashboardContentPrimary',
		label: 'Content',
		Icon: SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_CONTENT ],
	},
];

function renderPDFHeader( props: Partial< PDFHeaderProps > = {} ) {
	return render(
		<PDFHeader
			siteURL="https://www.example.com/"
			dashboardURL="https://example.com/wp-admin/go-dashboard"
			dateRange={ { startDate: '2021-01-01', endDate: '2021-01-28' } }
			sections={ sections }
			{ ...props }
		/>
	);
}

describe( 'PDFHeader', () => {
	it( 'renders the Site Kit logo (colour "G" + wordmark) as inline SVG', () => {
		const { container } = renderPDFHeader();

		const svgs = Array.from( container.querySelectorAll( 'pdf-svg' ) );
		// The colour Google "G" is the only SVG with exactly four paths.
		expect(
			svgs.find(
				( svg ) => svg.querySelectorAll( 'pdf-path' ).length === 4
			)
		).toBeTruthy();
		// The "Site Kit" wordmark is the only SVG with seven paths.
		expect(
			svgs.find(
				( svg ) => svg.querySelectorAll( 'pdf-path' ).length === 7
			)
		).toBeTruthy();
	} );

	it( 'renders the title and the formatted date range', () => {
		const { getByText } = renderPDFHeader();

		expect( getByText( "Your site's performance" ) ).toBeInTheDocument();
		expect(
			getByText( /Jan 1, 2021\s*-\s*Jan 28, 2021/ )
		).toBeInTheDocument();
	} );

	it( 'renders the site host linked to the dashboard URL', () => {
		const { getByText } = renderPDFHeader();

		// The host is shown as-is (protocol/path stripped, "www." kept).
		const host = getByText( 'www.example.com' );
		expect( host ).toBeInTheDocument();
		expect( host.closest( 'pdf-link' ) ).toHaveAttribute(
			'src',
			'https://example.com/wp-admin/go-dashboard'
		);
	} );

	it( 'renders one chip per supplied section, in order', () => {
		const { container } = renderPDFHeader();

		// Chips are the links wrapping a pill <View>; the other header links
		// (host, "View dashboard") wrap text/icons only.
		const chipLabels = Array.from(
			container.querySelectorAll( 'pdf-link' )
		)
			.filter( ( link ) => link.querySelector( 'pdf-view' ) )
			.map( ( chip ) => chip.textContent );

		expect( chipLabels ).toEqual( [ 'Key metrics', 'Traffic', 'Content' ] );
	} );

	it( 'renders the "View dashboard in Site Kit" link to the dashboard URL', () => {
		const { getByText } = renderPDFHeader();

		const link = getByText( 'View dashboard in Site Kit' );
		expect( link ).toBeInTheDocument();
		expect( link.closest( 'pdf-link' ) ).toHaveAttribute(
			'src',
			'https://example.com/wp-admin/go-dashboard'
		);
	} );

	it( 'collapses the chip row when there are no sections', () => {
		const { container, getByText } = renderPDFHeader( { sections: [] } );

		const chips = Array.from(
			container.querySelectorAll( 'pdf-link' )
		).filter( ( link ) => link.querySelector( 'pdf-view' ) );
		expect( chips ).toHaveLength( 0 );
		// The "View dashboard" link still renders.
		expect( getByText( 'View dashboard in Site Kit' ) ).toBeInTheDocument();
	} );

	it( 'renders a long date range spanning more than a year', () => {
		const { getByText } = renderPDFHeader( {
			dateRange: { startDate: '2020-02-29', endDate: '2021-12-31' },
		} );

		expect(
			getByText( /Feb 29, 2020\s*-\s*Dec 31, 2021/ )
		).toBeInTheDocument();
	} );

	it( 'renders without crashing when a date is missing or invalid', () => {
		const { getByText, queryByText } = renderPDFHeader( {
			dateRange: { startDate: '', endDate: '2021-01-28' },
		} );

		// Only the valid date is shown, with no dangling " - " separator.
		expect( getByText( 'Jan 28, 2021' ) ).toBeInTheDocument();
		expect( queryByText( /-/ ) ).not.toBeInTheDocument();
		// The rest of the header still renders.
		expect( getByText( "Your site's performance" ) ).toBeInTheDocument();
	} );

	it( 'renders the host as-is when the site URL cannot be parsed', () => {
		const { getByText } = renderPDFHeader( { siteURL: 'not a url' } );

		expect( getByText( 'not a url' ) ).toBeInTheDocument();
	} );
} );
