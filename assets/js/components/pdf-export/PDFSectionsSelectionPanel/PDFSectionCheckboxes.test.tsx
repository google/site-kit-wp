/**
 * PDFSectionCheckboxes tests.
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
import { PDFSection } from '@/js/components/pdf-export/constants';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import PDFSectionCheckboxes from './PDFSectionCheckboxes';

const TRAFFIC_SECTION: PDFSection = {
	slug: 'mainDashboardTrafficPrimary',
	label: 'Traffic',
	contextSlug: 'mainDashboardTraffic',
	widgets: [
		{ slug: 'analyticsAllTrafficGA4', label: 'Site traffic over time' },
		{ slug: 'searchFunnelGA4', label: 'Search traffic' },
	],
	widgetSlugs: [ 'analyticsAllTrafficGA4', 'searchFunnelGA4' ],
};

describe( 'PDFSectionCheckboxes', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'renders a parent section checkbox and a child checkbox per labelled widget', () => {
		const { getByRole } = render(
			<PDFSectionCheckboxes
				sections={ [ TRAFFIC_SECTION ] }
				selectedWidgetSlugs={ [] }
				toggleSection={ () => {} }
				toggleWidget={ () => {} }
			/>,
			{ registry }
		);

		expect(
			getByRole( 'checkbox', { name: /^Traffic$/ } )
		).toBeInTheDocument();
		expect(
			getByRole( 'checkbox', { name: /^Site traffic over time$/ } )
		).toBeInTheDocument();
		expect(
			getByRole( 'checkbox', { name: /^Search traffic$/ } )
		).toBeInTheDocument();
	} );

	it( 'checks the parent when all children are selected', () => {
		const { getByRole } = render(
			<PDFSectionCheckboxes
				sections={ [ TRAFFIC_SECTION ] }
				selectedWidgetSlugs={ [
					'analyticsAllTrafficGA4',
					'searchFunnelGA4',
				] }
				toggleSection={ () => {} }
				toggleWidget={ () => {} }
			/>,
			{ registry }
		);

		const parent = getByRole( 'checkbox', {
			name: /^Traffic$/,
		} ) as HTMLInputElement;
		expect( parent.checked ).toBe( true );
		expect( parent ).toHaveAttribute( 'aria-checked', 'true' );
	} );

	it( 'shows the parent as indeterminate when only some children are selected', () => {
		const { getByRole } = render(
			<PDFSectionCheckboxes
				sections={ [ TRAFFIC_SECTION ] }
				selectedWidgetSlugs={ [ 'analyticsAllTrafficGA4' ] }
				toggleSection={ () => {} }
				toggleWidget={ () => {} }
			/>,
			{ registry }
		);

		const parent = getByRole( 'checkbox', {
			name: /^Traffic$/,
		} ) as HTMLInputElement;
		expect( parent ).toHaveAttribute( 'aria-checked', 'mixed' );
		expect( parent.indeterminate ).toBe( true );
	} );

	it( 'calls toggleSection when the parent is clicked', () => {
		const toggleSection = jest.fn();

		const { getByRole } = render(
			<PDFSectionCheckboxes
				sections={ [ TRAFFIC_SECTION ] }
				selectedWidgetSlugs={ [] }
				toggleSection={ toggleSection }
				toggleWidget={ () => {} }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'checkbox', { name: /^Traffic$/ } ) );

		expect( toggleSection ).toHaveBeenCalledWith( TRAFFIC_SECTION );
	} );

	it( 'calls toggleWidget with the widget slug when a child is clicked', () => {
		const toggleWidget = jest.fn();

		const { getByRole } = render(
			<PDFSectionCheckboxes
				sections={ [ TRAFFIC_SECTION ] }
				selectedWidgetSlugs={ [] }
				toggleSection={ () => {} }
				toggleWidget={ toggleWidget }
			/>,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'checkbox', { name: /^Site traffic over time$/ } )
		);

		expect( toggleWidget ).toHaveBeenCalledWith( 'analyticsAllTrafficGA4' );
	} );

	it( 'renders a collapsed section (no children) when no widgets are labelled', () => {
		const { getByRole, queryByRole } = render(
			<PDFSectionCheckboxes
				sections={ [
					{
						slug: 'mainDashboardSpeedPrimary',
						label: 'Speed',
						contextSlug: 'mainDashboardSpeed',
						widgets: [],
						widgetSlugs: [ 'pagespeedInsightsWebVitals' ],
					},
				] }
				selectedWidgetSlugs={ [ 'pagespeedInsightsWebVitals' ] }
				toggleSection={ () => {} }
				toggleWidget={ () => {} }
			/>,
			{ registry }
		);

		const parent = getByRole( 'checkbox', {
			name: /^Speed$/,
		} ) as HTMLInputElement;
		expect( parent.checked ).toBe( true );
		// No child checkboxes for a collapsed section.
		expect(
			queryByRole( 'checkbox', { name: /traffic/i } )
		).not.toBeInTheDocument();
	} );
} );
