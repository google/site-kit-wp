/**
 * PDFSectionsSelectionPanel tests.
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
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-generation/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import PDFSectionsSelectionPanel from './index';

function NullComponent() {
	return null;
}

function registerSections( registry: ReturnType< typeof createTestRegistry > ) {
	const dispatch = registry.dispatch( CORE_WIDGETS );

	// Traffic context: a PDF-capable area with two labelled pdf widgets.
	dispatch.registerWidgetArea( 'pdfTrafficArea', {
		title: 'Find out how your audience is growing',
		pdfTitle: 'Traffic',
		style: 'boxes',
		priority: 1,
	} );
	dispatch.assignWidgetArea(
		'pdfTrafficArea',
		CONTEXT_MAIN_DASHBOARD_TRAFFIC
	);
	dispatch.registerWidget( 'pdfAllTraffic', {
		Component: NullComponent,
		priority: 1,
		pdf: {
			Component: NullComponent,
			getData: () => Promise.resolve( { data: null } ),
			label: 'Site traffic over time',
		},
	} );
	dispatch.assignWidget( 'pdfAllTraffic', 'pdfTrafficArea' );
	dispatch.registerWidget( 'pdfSearchTraffic', {
		Component: NullComponent,
		priority: 2,
		pdf: {
			Component: NullComponent,
			getData: () => Promise.resolve( { data: null } ),
			label: 'Search traffic',
		},
	} );
	dispatch.assignWidget( 'pdfSearchTraffic', 'pdfTrafficArea' );

	// Content context: an area with no PDF widget, so it must not appear.
	dispatch.registerWidgetArea( 'plainContentArea', {
		title: 'Content',
		style: 'boxes',
		priority: 1,
	} );
	dispatch.assignWidgetArea(
		'plainContentArea',
		CONTEXT_MAIN_DASHBOARD_CONTENT
	);
	dispatch.registerWidget( 'plainContentWidget', {
		Component: NullComponent,
	} );
	dispatch.assignWidget( 'plainContentWidget', 'plainContentArea' );
}

describe( 'PDFSectionsSelectionPanel', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		registerSections( registry );
	} );

	function openPanel() {
		act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, true );
		} );
	}

	it( 'renders a Traffic section with its labelled widgets, all selected by default', async () => {
		const { findByRole, getByRole, queryByRole } = render(
			<PDFSectionsSelectionPanel />,
			{ registry }
		);

		openPanel();

		await findByRole( 'checkbox', { name: /^Traffic$/ } );

		expect(
			(
				getByRole( 'checkbox', {
					name: /^Site traffic over time$/,
				} ) as HTMLInputElement
			 ).checked
		).toBe( true );
		expect(
			(
				getByRole( 'checkbox', {
					name: /^Traffic$/,
				} ) as HTMLInputElement
			 ).checked
		).toBe( true );
		// Content has no PDF widget, so it must not appear.
		expect(
			queryByRole( 'checkbox', { name: /^Content$/ } )
		).not.toBeInTheDocument();

		expect( registry.select( CORE_PDF ).getSelectedContextSlugs() ).toEqual(
			[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ]
		);
		expect(
			[ ...registry.select( CORE_PDF ).getSelectedWidgetSlugs() ].sort()
		).toEqual( [ 'pdfAllTraffic', 'pdfSearchTraffic' ] );
	} );

	it( 'shows the parent as indeterminate when one child is deselected', async () => {
		const { findByRole, getByRole } = render(
			<PDFSectionsSelectionPanel />,
			{
				registry,
			}
		);

		openPanel();

		fireEvent.click(
			await findByRole( 'checkbox', { name: /^Search traffic$/ } )
		);

		await waitFor( () => {
			expect(
				getByRole( 'checkbox', { name: /^Traffic$/ } )
			).toHaveAttribute( 'aria-checked', 'mixed' );
		} );

		expect( registry.select( CORE_PDF ).getSelectedWidgetSlugs() ).toEqual(
			[ 'pdfAllTraffic' ]
		);
		expect( registry.select( CORE_PDF ).getSelectedContextSlugs() ).toEqual(
			[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ]
		);
	} );

	it( 'deselecting the parent clears all of its widgets and disables Download', async () => {
		const { findByRole, getByRole, getByText } = render(
			<PDFSectionsSelectionPanel />,
			{ registry }
		);

		openPanel();

		fireEvent.click(
			await findByRole( 'checkbox', { name: /^Traffic$/ } )
		);

		await waitFor( () => {
			expect(
				getByText( 'Select at least 1 topic' )
			).toBeInTheDocument();
		} );

		expect(
			getByRole( 'button', { name: 'Download report' } )
		).toBeDisabled();
		expect( registry.select( CORE_PDF ).getSelectedWidgetSlugs() ).toEqual(
			[]
		);
		expect( registry.select( CORE_PDF ).getSelectedContextSlugs() ).toEqual(
			[]
		);
	} );

	it( 'starts the export and closes the panel when Download is clicked', async () => {
		const { findByRole } = render( <PDFSectionsSelectionPanel />, {
			registry,
		} );

		openPanel();

		await findByRole( 'checkbox', { name: /^Traffic$/ } );

		fireEvent.click(
			await findByRole( 'button', { name: 'Download report' } )
		);

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).isExporting() ).toBe( true );
		} );

		expect(
			registry.select( CORE_UI ).getValue( PDF_DOWNLOAD_PANEL_OPENED_KEY )
		).toBe( false );
	} );
} );
