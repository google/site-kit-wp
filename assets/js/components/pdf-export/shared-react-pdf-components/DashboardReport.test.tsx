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
import DashboardReport from './DashboardReport';

function FakeWidget( { data }: PDFWidgetComponentProps ) {
	return <Text>{ `widget:${ String( data ) }` }</Text>;
}

const footerProps = {
	dashboardURL: 'http://example.com/wp-admin/index.php?to=dashboard',
	helpCenterURL: 'https://sitekit.withgoogle.com/support/',
	privacyPolicyURL: 'https://policies.google.com/privacy',
};

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

		const { getByText } = render(
			<DashboardReport
				siteName="Example Site"
				areas={ areas }
				{ ...footerProps }
			/>
		);

		expect( getByText( 'Traffic' ) ).toBeInTheDocument();
		expect( getByText( 'widget:visitors' ) ).toBeInTheDocument();
	} );

	it( 'should render a placeholder for a widget without a resolved component', () => {
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

		const { getByText } = render(
			<DashboardReport
				siteName="Example Site"
				areas={ areas }
				{ ...footerProps }
			/>
		);

		expect( getByText( 'Data unavailable.' ) ).toBeInTheDocument();
	} );

	it( 'should render gracefully when there are no areas', () => {
		const { getByText } = render(
			<DashboardReport
				siteName="Example Site"
				areas={ [] }
				{ ...footerProps }
			/>
		);

		expect( getByText( 'No report data available.' ) ).toBeInTheDocument();
	} );
} );
