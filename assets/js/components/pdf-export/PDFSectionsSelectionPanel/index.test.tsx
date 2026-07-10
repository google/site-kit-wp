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
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-export/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import * as tracking from '@/js/util/tracking';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	render,
	waitFor,
} from '@tests/js/test-utils';
import PDFSectionsSelectionPanel from './index';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

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
		// The panel waits for module connection state before it lists sections,
		// so every test needs modules in the store.
		provideModules( registry );
		registerSections( registry );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	function openPanel() {
		act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, true );
		} );
	}

	it( 'omits a section when every pdf widget in it has pdf.isActive returning false', async () => {
		const dispatch = registry.dispatch( CORE_WIDGETS );
		dispatch.registerWidgetArea( 'inactiveArea', {
			title: 'Inactive',
			pdfTitle: 'Inactive',
			style: 'boxes',
			priority: 1,
		} );
		dispatch.assignWidgetArea(
			'inactiveArea',
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
		dispatch.registerWidget( 'inactiveWidget', {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: () => Promise.resolve( { data: null } ),
				label: 'Inactive widget',
				isActive: () => false,
			},
		} );
		dispatch.assignWidget( 'inactiveWidget', 'inactiveArea' );

		const { findByRole, queryByRole } = render(
			<PDFSectionsSelectionPanel />,
			{ registry }
		);

		openPanel();

		// The `getModules` resolver finishes after the first render and
		// re-renders the panel. Wait for it inside `act`, so the panel
		// doesn't re-render after the test has ended.
		await waitFor( () => {
			expect(
				registry
					.select( CORE_MODULES )
					.hasFinishedResolution( 'getModules', [] )
			).toBe( true );
		} );

		await findByRole( 'checkbox', { name: /^Traffic$/ } );

		expect(
			queryByRole( 'checkbox', { name: /^Inactive$/ } )
		).not.toBeInTheDocument();
	} );

	/**
	 * Registers a Traffic-context area with one pdf widget that depends on
	 * Analytics 4, so a test can check a module-dependent section.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function registerAnalyticsSection() {
		const dispatch = registry.dispatch( CORE_WIDGETS );
		dispatch.registerWidgetArea( 'analyticsArea', {
			title: 'Analytics',
			pdfTitle: 'Analytics',
			style: 'boxes',
			priority: 2,
		} );
		dispatch.assignWidgetArea(
			'analyticsArea',
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
		dispatch.registerWidget( 'analyticsWidget', {
			Component: NullComponent,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			pdf: {
				Component: NullComponent,
				getData: () => Promise.resolve( { data: null } ),
				label: 'Analytics widget',
			},
		} );
		dispatch.assignWidget( 'analyticsWidget', 'analyticsArea' );
	}

	it( 'omits a section whose pdf widget requires a disconnected module', async () => {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: false },
		] );
		registerAnalyticsSection();

		const { findByRole, queryByRole } = render(
			<PDFSectionsSelectionPanel />,
			{ registry }
		);

		openPanel();

		// The `getModules` resolver finishes after the first render and
		// re-renders the panel. Wait for it inside `act`, so the panel
		// doesn't re-render after the test has ended.
		await waitFor( () => {
			expect(
				registry
					.select( CORE_MODULES )
					.hasFinishedResolution( 'getModules', [] )
			).toBe( true );
		} );

		// Wait for the module-less Traffic section. Its presence proves the
		// list has loaded before the test checks that the Analytics section
		// is absent.
		await findByRole( 'checkbox', { name: /^Traffic$/ } );

		expect(
			queryByRole( 'checkbox', { name: /^Analytics$/ } )
		).not.toBeInTheDocument();
	} );

	it( 'lists a section whose pdf widget requires a connected module, and selects it by default', async () => {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		registerAnalyticsSection();

		const { findByRole } = render( <PDFSectionsSelectionPanel />, {
			registry,
		} );

		openPanel();

		// The `getModules` resolver finishes after the first render and
		// re-renders the panel. Wait for it inside `act`, so the panel
		// doesn't re-render after the test has ended.
		await waitFor( () => {
			expect(
				registry
					.select( CORE_MODULES )
					.hasFinishedResolution( 'getModules', [] )
			).toBe( true );
		} );

		const analyticsSection = ( await findByRole( 'checkbox', {
			name: /^Analytics$/,
		} ) ) as HTMLInputElement;
		expect( analyticsSection.checked ).toBe( true );
	} );

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

	it( 'fires pdf_generation_sidebar_view once when the panel opens', async () => {
		const { findByRole } = render( <PDFSectionsSelectionPanel />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		openPanel();

		await findByRole( 'checkbox', { name: /^Traffic$/ } );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pdf_generation_section_selection-sidebar`,
			'pdf_generation_sidebar_view'
		);
		expect(
			mockTrackEvent.mock.calls.filter(
				( [ , event ]: string[] ) =>
					event === 'pdf_generation_sidebar_view'
			)
		).toHaveLength( 1 );
	} );

	it( 'fires pdf_generation_sidebar_close when the panel is closed via Cancel', async () => {
		const { findByRole, getByRole } = render(
			<PDFSectionsSelectionPanel />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		openPanel();

		await findByRole( 'checkbox', { name: /^Traffic$/ } );

		mockTrackEvent.mockClear();

		fireEvent.click( getByRole( 'button', { name: 'Cancel' } ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pdf_generation_section_selection-sidebar`,
			'pdf_generation_sidebar_close'
		);
	} );

	it( 'does not fire pdf_generation_sidebar_close when Download is clicked', async () => {
		const { findByRole } = render( <PDFSectionsSelectionPanel />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		openPanel();

		await findByRole( 'checkbox', { name: /^Traffic$/ } );

		mockTrackEvent.mockClear();

		fireEvent.click(
			await findByRole( 'button', { name: 'Download report' } )
		);

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).isExporting() ).toBe( true );
		} );

		expect( mockTrackEvent ).not.toHaveBeenCalledWith(
			expect.anything(),
			'pdf_generation_sidebar_close'
		);
	} );
} );
