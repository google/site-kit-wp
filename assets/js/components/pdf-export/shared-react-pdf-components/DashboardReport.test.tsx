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

/**
 * Internal dependencies
 */
import type { PDFWidgetComponentProps } from '@/js/components/pdf-export/types';
import { render } from '@tests/js/test-utils';
import DashboardReport, { DashboardReportProps } from './DashboardReport';

function FakeWidget( { data }: PDFWidgetComponentProps ) {
	return <Text>{ `widget:${ String( data ) }` }</Text>;
}

function renderDashboardReport( props: Partial< DashboardReportProps > = {} ) {
	return render(
		<DashboardReport
			siteName="Example Site"
			generatedAt="2021-01-10"
			areas={ [] }
			{ ...props }
		/>
	);
}

describe( 'DashboardReport', () => {
	it( 'renders one section per area with its title and widget components', () => {
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

	it( 'renders a placeholder for a widget without a resolved component', () => {
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

		expect( getByText( 'Data unavailable.' ) ).toBeInTheDocument();
	} );

	it( 'renders the "No report data available." message when there are no areas', () => {
		const { getByText } = renderDashboardReport();

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
		const { container } = renderDashboardReport( {
			emailReportingSetupURL: 'https://example.com/golink',
		} );

		expect( container.querySelector( 'pdf-link' ) ).toHaveAttribute(
			'src',
			'https://example.com/golink'
		);
	} );
} );
