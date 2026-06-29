/**
 * DashboardReport tests.
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
import { Text } from '@react-pdf/renderer';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import {
	PDF_PAGE_PADDING,
	PDF_PAGE_WIDTH,
	scalePDFValue,
} from '@/js/components/pdf-export/pdf-scale';
import { SECTION_ICONS } from '@/js/components/pdf-export/section-icons';
import { PDFWidgetComponentProps } from '@/js/components/pdf-export/types';
import { CONTEXT_MAIN_DASHBOARD_TRAFFIC } from '@/js/googlesitekit/widgets/default-contexts';
import { render } from '@tests/js/test-utils';
import DashboardReport, { DashboardReportProps } from './DashboardReport';

function FakeWidget( { data }: PDFWidgetComponentProps ) {
	return <Text>{ `widget:${ String( data ) }` }</Text>;
}

const defaultReportProps: DashboardReportProps = {
	siteName: 'Example Site',
	siteURL: 'https://www.example.com/',
	dateRange: { startDate: '2021-01-01', endDate: '2021-01-28' },
	sections: [],
	areas: [],
	dashboardURL: 'http://example.com/wp-admin/index.php?to=dashboard',
	helpCenterURL: 'https://sitekit.withgoogle.com/support/?doc=get-support',
	privacyPolicyURL: 'https://policies.google.com/privacy',
};

function createDashboardReportElement(
	props: Partial< DashboardReportProps > = {}
) {
	return <DashboardReport { ...defaultReportProps } { ...props } />;
}

/**
 * Renders the report into the test DOM for content assertions.
 *
 * @since 1.183.0
 *
 * @param props Props that override the defaults.
 * @return Render result with queries like `getByText`.
 */
function renderDashboardReport( props: Partial< DashboardReportProps > = {} ) {
	return render( createDashboardReportElement( props ) );
}

/**
 * Renders the report to a JSON string for content and style assertions.
 *
 * @since 1.183.0
 *
 * @param props Props that override the defaults.
 * @return JSON string of the rendered tree.
 */
function renderDashboardReportJSON(
	props: Partial< DashboardReportProps > = {}
) {
	return JSON.stringify(
		TestRenderer.create( createDashboardReportElement( props ) ).toJSON()
	);
}

describe( 'DashboardReport', () => {
	it( 'should render one section per area with its title and widget components', () => {
		const areas = [
			{
				areaSlug: 'mainDashboardTrafficPrimary',
				areaTitle: 'Traffic',
				widgets: [
					{
						slug: 'analyticsAllTrafficGA4',
						label: 'All Visitors',
						Component: FakeWidget,
						data: 'visitors',
					},
				],
			},
		];

		const { getByText } = renderDashboardReport( { areas } );

		expect( getByText( 'Traffic' ) ).toBeInTheDocument();
		expect( getByText( 'widget:visitors' ) ).toBeInTheDocument();
	} );

	it( 'sets document accessibility metadata', () => {
		const tree = TestRenderer.create( createDashboardReportElement() ).root;
		const document = tree.find(
			( node ) => String( node.type ) === 'pdf-document'
		);

		expect( document.props ).toMatchObject( {
			title: 'Example Site – Jan 1, 2021 - Jan 28, 2021 – Site Kit report',
			author: 'Example Site',
			subject: 'Site Kit dashboard report',
			keywords: 'Site Kit, dashboard, report',
			language: global.navigator.language,
			pageMode: 'useOutlines',
		} );
	} );

	it( 'normalizes underscore locales for document metadata and date formatting', () => {
		const languageDescriptor = Object.getOwnPropertyDescriptor(
			global.navigator,
			'language'
		);
		Object.defineProperty( global.navigator, 'language', {
			configurable: true,
			value: 'de_DE',
		} );

		try {
			const tree = TestRenderer.create(
				createDashboardReportElement()
			).root;
			const document = tree.find(
				( node ) => String( node.type ) === 'pdf-document'
			);

			expect( document.props ).toMatchObject( {
				title: 'Example Site – 1. Jan. 2021 - 28. Jan. 2021 – Site Kit report',
				language: 'de-DE',
			} );
		} finally {
			if ( languageDescriptor ) {
				Object.defineProperty(
					global.navigator,
					'language',
					languageDescriptor
				);
			} else {
				Reflect.deleteProperty( global.navigator, 'language' );
			}
		}
	} );

	it( 'sets one bookmark per renderable report area in render order', () => {
		const areas = [
			{
				areaSlug: 'mainDashboardTrafficPrimary',
				areaTitle: 'Traffic',
				widgets: [
					{
						slug: 'analyticsAllTrafficGA4',
						Component: FakeWidget,
						data: 'visitors',
					},
				],
			},
			{
				areaSlug: 'mainDashboardContentPrimary',
				areaTitle: 'Content',
				widgets: [
					{
						slug: 'analyticsTopPages',
						Component: FakeWidget,
						data: 'pages',
					},
				],
			},
			{
				areaSlug: 'mainDashboardEmptyPrimary',
				areaTitle: 'Empty',
				widgets: [
					{
						slug: 'emptyWidget',
						Component: null,
						data: null,
					},
				],
			},
		];
		const tree = TestRenderer.create(
			createDashboardReportElement( { areas } )
		).root;
		const bookmarkedViews = tree.findAll(
			( node ) =>
				String( node.type ) === 'pdf-view' && !! node.props.bookmark
		);

		expect(
			bookmarkedViews.map( ( view ) => view.props.bookmark )
		).toEqual( [ 'Traffic', 'Content' ] );
	} );

	it( 'skips a widget without a component and keeps the rest of its area', () => {
		const areas = [
			{
				areaSlug: 'mainDashboardTrafficPrimary',
				areaTitle: 'Traffic',
				widgets: [
					{
						slug: 'searchFunnelGA4',
						Component: null,
						data: null,
					},
					{
						slug: 'analyticsAllTrafficGA4',
						Component: FakeWidget,
						data: 'visitors',
					},
				],
			},
		];

		const { getByText, queryByText } = renderDashboardReport( { areas } );

		// The report skips the failed widget and shows no placeholder text.
		expect( getByText( 'Traffic' ) ).toBeInTheDocument();
		expect( getByText( 'widget:visitors' ) ).toBeInTheDocument();
		expect( queryByText( 'Data unavailable.' ) ).not.toBeInTheDocument();
	} );

	it( 'skips an area whose widgets have no component or no data', () => {
		const areas = [
			{
				areaSlug: 'mainDashboardTrafficPrimary',
				areaTitle: 'Traffic',
				widgets: [
					{
						slug: 'analyticsAllTrafficGA4',
						Component: null,
						data: null,
					},
					{
						slug: 'searchFunnelGA4',
						Component: FakeWidget,
						data: null,
					},
				],
			},
		];

		const { queryByText } = renderDashboardReport( { areas } );

		// The report skips the whole area: no title, no widget, and no
		// placeholder text.
		expect( queryByText( 'Traffic' ) ).not.toBeInTheDocument();
		expect( queryByText( 'Data unavailable.' ) ).not.toBeInTheDocument();
		expect( queryByText( 'widget:null' ) ).not.toBeInTheDocument();
	} );

	it( 'shows a header chip only for an area with content', () => {
		const sections = [
			{ slug: 'mainDashboardTrafficPrimary', label: 'Traffic chip' },
			{ slug: 'mainDashboardContentPrimary', label: 'Content chip' },
		];
		const areas = [
			{
				areaSlug: 'mainDashboardTrafficPrimary',
				areaTitle: 'Traffic',
				widgets: [
					{
						slug: 'analyticsAllTrafficGA4',
						Component: FakeWidget,
						data: 'visitors',
					},
				],
			},
			{
				areaSlug: 'mainDashboardContentPrimary',
				areaTitle: 'Content',
				widgets: [
					{
						slug: 'analyticsPopularPagesGA4',
						Component: FakeWidget,
						data: null,
					},
				],
			},
		];

		const { getByText, queryByText } = renderDashboardReport( {
			sections,
			areas,
		} );

		expect( getByText( 'Traffic chip' ) ).toBeInTheDocument();
		expect( queryByText( 'Content chip' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the "No report data available." message when there are no areas', () => {
		const { getByText } = renderDashboardReport();

		expect( getByText( 'No report data available.' ) ).toBeInTheDocument();
	} );

	it( 'renders the "No report data available." message when no area has content to render', () => {
		const areas = [
			{
				areaSlug: 'mainDashboardTrafficPrimary',
				areaTitle: 'Traffic',
				widgets: [
					{
						slug: 'analyticsAllTrafficGA4',
						Component: null,
						data: null,
					},
				],
			},
		];

		const { getByText } = renderDashboardReport( { areas } );

		expect( getByText( 'No report data available.' ) ).toBeInTheDocument();
	} );

	it( 'renders the email reporting notice when no email reporting setup URL is given', () => {
		const { getByText } = renderDashboardReport();

		expect(
			getByText(
				'Get your site’s most important insights delivered to your inbox'
			)
		).toBeInTheDocument();
		expect( getByText( 'Set up email reports' ) ).toBeInTheDocument();
	} );

	it( 'links the "Set up email reports" button to the given email reporting setup URL', () => {
		const { getByText } = renderDashboardReport( {
			emailReportingSetupURL: 'https://example.com/golink',
		} );

		expect(
			getByText( 'Set up email reports' ).closest( 'pdf-link' )
		).toHaveAttribute( 'src', 'https://example.com/golink' );
	} );

	it( 'renders the header with the site URL, dashboard URL, date range, and sections', () => {
		const { getByText } = renderDashboardReport( {
			dashboardURL: 'https://example.com/go-dashboard',
			sections: [
				{
					slug: 'mainDashboardTrafficPrimary',
					label: 'Traffic',
					Icon: SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
				},
			],
			// The chip only renders while its area has content, so the area
			// holds a widget with data.
			areas: [
				{
					areaSlug: 'mainDashboardTrafficPrimary',
					areaTitle: 'Traffic area',
					widgets: [
						{
							slug: 'analyticsAllTrafficGA4',
							Component: FakeWidget,
							data: 'visitors',
						},
					],
				},
			],
		} );

		// Title and formatted date range come from the header.
		expect( getByText( "Your site's performance" ) ).toBeInTheDocument();
		expect(
			getByText( /Jan 1, 2021\s*-\s*Jan 28, 2021/ )
		).toBeInTheDocument();
		// Host is derived from the forwarded `siteURL` and linked to `dashboardURL`.
		expect(
			getByText( 'www.example.com' ).closest( 'pdf-link' )
		).toHaveAttribute( 'src', 'https://example.com/go-dashboard' );
		// The forwarded section renders as a chip.
		expect( getByText( 'Traffic' ) ).toBeInTheDocument();
	} );

	it( 'sets the page width and padding to fixed point values', () => {
		const reportJSON = renderDashboardReportJSON();

		expect( reportJSON ).toContain( `"padding":${ PDF_PAGE_PADDING }` );
		expect( reportJSON ).toContain( `"size":[${ PDF_PAGE_WIDTH },` );
	} );

	it( 'scales the gap between an area title and its first widget', () => {
		const areas = [
			{
				areaSlug: 'mainDashboardTrafficPrimary',
				areaTitle: 'Traffic',
				widgets: [
					{
						slug: 'analyticsAllTrafficGA4',
						Component: FakeWidget,
						data: 'visitors',
					},
				],
			},
		];

		const reportJSON = renderDashboardReportJSON( { areas } );

		expect( reportJSON ).toContain(
			`"marginBottom":${ scalePDFValue( 20 ) }`
		);
	} );

	it( 'scales the gaps between areas and between widgets', () => {
		const areas = [
			{
				areaSlug: 'mainDashboardTrafficPrimary',
				areaTitle: 'Traffic',
				widgets: [
					{
						slug: 'analyticsAllTrafficGA4',
						Component: FakeWidget,
						data: 'visitors',
					},
				],
			},
		];

		const reportJSON = renderDashboardReportJSON( { areas } );

		// The body adds a gap of 50 between areas, and the widget container a
		// gap of 30 between widgets. Both scale to the page.
		expect( reportJSON ).toContain( `"gap":${ scalePDFValue( 50 ) }` );
		expect( reportJSON ).toContain( `"gap":${ scalePDFValue( 30 ) }` );
	} );
} );
