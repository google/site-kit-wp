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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	PDF_DOWNLOAD_PANEL_OPENED_KEY,
	PDF_EXPORT_PANEL_OPENED_ITEM_SLUG,
} from '@/js/components/pdf-export/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import * as tracking from '@/js/util/tracking';
import {
	dismissItemEndpoint,
	dismissedItemsEndpoint,
} from '@tests/js/mock-dismiss-item-endpoints';
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

		// An open panel saves `pdf-export-panel-opened` to WordPress user
		// meta, and every test needs the saved slugs in the store plus a
		// reply for that request.
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		fetchMock.post( dismissItemEndpoint, {
			body: [ PDF_EXPORT_PANEL_OPENED_ITEM_SLUG ],
		} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	function setPanelOpen( isOpen: boolean ) {
		act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, isOpen );
		} );
	}

	function openPanel() {
		setPanelOpen( true );
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
	 * @since 1.184.0
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

	it( 'omits a widget that requires a disconnected module', async () => {
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

		// The Analytics area sits in the Traffic context, so its widget lists
		// under the Traffic section. Waiting for that section proves the list
		// has loaded before the test checks that the widget is absent.
		await findByRole( 'checkbox', { name: /^Traffic$/ } );

		expect(
			queryByRole( 'checkbox', { name: /^Analytics widget$/ } )
		).not.toBeInTheDocument();
	} );

	it( 'lists a widget that requires a connected module, and selects it by default', async () => {
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

		const analyticsWidget = ( await findByRole( 'checkbox', {
			name: /^Analytics widget$/,
		} ) ) as HTMLInputElement;
		expect( analyticsWidget.checked ).toBe( true );
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
		// Copy before sorting: the selector returns the store's array by
		// reference, so sorting it in place would mutate the store.
		const selectedWidgetSlugs = [
			...registry.select( CORE_PDF ).getSelectedWidgetSlugs(),
		].sort();
		expect( selectedWidgetSlugs ).toEqual( [
			'pdfAllTraffic',
			'pdfSearchTraffic',
		] );
	} );

	it( 'merges two areas in one context into a single section', async () => {
		const dispatch = registry.dispatch( CORE_WIDGETS );

		// A second Traffic area with its own PDF widget, like the audience
		// segmentation area. It repeats the "Traffic" title, as the real
		// registration does, so the merged section keeps one label.
		dispatch.registerWidgetArea( 'pdfAudienceArea', {
			title: 'Find out who your visitors are',
			pdfTitle: 'Traffic',
			style: 'boxes',
			priority: 2,
		} );
		dispatch.assignWidgetArea(
			'pdfAudienceArea',
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
		dispatch.registerWidget( 'pdfAudienceTiles', {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: () => Promise.resolve( { data: null } ),
				label: 'Your visitor groups',
			},
		} );
		dispatch.assignWidget( 'pdfAudienceTiles', 'pdfAudienceArea' );

		const { findByRole, getAllByRole, getByRole } = render(
			<PDFSectionsSelectionPanel />,
			{ registry }
		);

		openPanel();

		await findByRole( 'checkbox', { name: /^Your visitor groups$/ } );

		// One Traffic parent checkbox, not one per area.
		expect(
			getAllByRole( 'checkbox', { name: /^Traffic$/ } )
		).toHaveLength( 1 );
		expect(
			(
				getByRole( 'checkbox', {
					name: /^Your visitor groups$/,
				} ) as HTMLInputElement
			 ).checked
		).toBe( true );
		expect(
			[ ...registry.select( CORE_PDF ).getSelectedWidgetSlugs() ].sort()
		).toEqual( [
			'pdfAllTraffic',
			'pdfAudienceTiles',
			'pdfSearchTraffic',
		] );
	} );

	it( 'selects a widget when it first appears, and keeps a cleared widget cleared', async () => {
		const dispatch = registry.dispatch( CORE_WIDGETS );

		// A widget that appears late, like the audience tiles waiting on the
		// configured audiences to resolve.
		dispatch.registerWidget( 'pdfLateWidget', {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: () => Promise.resolve( { data: null } ),
				label: 'Late widget',
				isActive: ( select: WPDataRegistry[ 'select' ] ) =>
					select( CORE_UI ).getValue( 'pdfLateWidgetReady' ) === true,
			},
		} );
		dispatch.assignWidget( 'pdfLateWidget', 'pdfTrafficArea' );

		const { findByRole, getByRole, queryByRole } = render(
			<PDFSectionsSelectionPanel />,
			{ registry }
		);

		openPanel();

		// Clear a selected widget before the late widget appears.
		fireEvent.click(
			await findByRole( 'checkbox', { name: /^Search traffic$/ } )
		);

		await waitFor( () => {
			expect(
				registry.select( CORE_PDF ).getSelectedWidgetSlugs()
			).toEqual( [ 'pdfAllTraffic' ] );
		} );
		expect(
			queryByRole( 'checkbox', { name: /^Late widget$/ } )
		).not.toBeInTheDocument();

		act( () => {
			registry.dispatch( CORE_UI ).setValue( 'pdfLateWidgetReady', true );
		} );

		// The late widget is selected on its first appearance, and the widget
		// the user cleared stays cleared.
		expect(
			(
				( await findByRole( 'checkbox', {
					name: /^Late widget$/,
				} ) ) as HTMLInputElement
			 ).checked
		).toBe( true );
		expect(
			(
				getByRole( 'checkbox', {
					name: /^Search traffic$/,
				} ) as HTMLInputElement
			 ).checked
		).toBe( false );
		expect(
			[ ...registry.select( CORE_PDF ).getSelectedWidgetSlugs() ].sort()
		).toEqual( [ 'pdfAllTraffic', 'pdfLateWidget' ] );
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

	it( 'auto-selects a widget that appears after the panel opens, without re-selecting ones the user cleared', async () => {
		// This Revenue widget only appears once AdSense is linked. Its
		// `pdf.isActive` reads `adSenseLinked` from the store, which has no
		// value when the panel first opens, so the widget is hidden at first
		// and shows up later once `adSenseLinked` becomes true.
		const dispatch = registry.dispatch( CORE_WIDGETS );
		dispatch.registerWidgetArea( 'pdfRevenueArea', {
			title: 'Find out how much you’re earning from your content',
			pdfTitle: 'Revenue',
			style: 'boxes',
			priority: 2,
		} );
		dispatch.assignWidgetArea(
			'pdfRevenueArea',
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
		dispatch.registerWidget( 'pdfEarnings', {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: () => Promise.resolve( { data: null } ),
				label: 'Earning performance',
				isActive: (
					select: ReturnType< typeof createTestRegistry >[ 'select' ]
				) => select( CORE_UI ).getValue( 'adSenseLinked' ) === true,
			},
		} );
		dispatch.assignWidget( 'pdfEarnings', 'pdfRevenueArea' );

		const { findByRole, queryByRole } = render(
			<PDFSectionsSelectionPanel />,
			{ registry }
		);

		openPanel();

		// When the panel opens, the Revenue widget is still hidden because
		// `adSenseLinked` has no value yet, so only Traffic appears. Its
		// widgets are auto-selected by default.
		await findByRole( 'checkbox', { name: /^Traffic$/ } );
		expect(
			queryByRole( 'checkbox', { name: /^Revenue$/ } )
		).not.toBeInTheDocument();

		// The user clears one of the auto-selected Traffic widgets, before the
		// Revenue widget appears.
		fireEvent.click(
			await findByRole( 'checkbox', { name: /^Search traffic$/ } )
		);
		await waitFor( () => {
			expect(
				registry.select( CORE_PDF ).getSelectedWidgetSlugs()
			).toEqual( [ 'pdfAllTraffic' ] );
		} );

		// AdSense becomes linked, so the Revenue widget now appears.
		act( () => {
			registry.dispatch( CORE_UI ).setValue( 'adSenseLinked', true );
		} );

		// The newly appeared widget is auto-selected by default, while the
		// widget the user cleared stays cleared (it is not re-selected).
		const revenueCheckbox = ( await findByRole( 'checkbox', {
			name: /^Earning performance$/,
		} ) ) as HTMLInputElement;

		await waitFor( () => {
			expect( revenueCheckbox.checked ).toBe( true );
		} );
		// Copy before sorting: the selector returns the store's array by
		// reference, so sorting it in place would mutate the store.
		const selectedWidgetSlugs = [
			...registry.select( CORE_PDF ).getSelectedWidgetSlugs(),
		].sort();
		expect( selectedWidgetSlugs ).toEqual( [
			'pdfAllTraffic',
			'pdfEarnings',
		] );
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

	it( 'shows the "generating report" notice and disables the "Download report" button when closing, then opening the panel mid-export', async () => {
		const { findByRole, getByRole, getByText, queryByText } = render(
			<PDFSectionsSelectionPanel />,
			{ registry }
		);

		openPanel();

		await findByRole( 'checkbox', { name: 'Traffic' } );

		fireEvent.click(
			await findByRole( 'button', { name: 'Download report' } )
		);

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).isExporting() ).toBe( true );
		} );

		// The panel closed, so the notice shouldn't be on screen.
		expect(
			queryByText( 'Your report is being generated' )
		).not.toBeInTheDocument();

		openPanel();

		expect(
			getByText( 'Your report is being generated' )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Download report' } )
		).toBeDisabled();
	} );

	it( 'enables the "Download report" button and clears the "generating report" notice when the export is finished (with the panel open)', async () => {
		registry.dispatch( CORE_PDF ).startExporting();

		const { findByRole, getByRole, getByText, queryByText } = render(
			<PDFSectionsSelectionPanel />,
			{ registry }
		);

		openPanel();

		await findByRole( 'checkbox', { name: 'Traffic' } );

		expect(
			getByText( 'Your report is being generated' )
		).toBeInTheDocument();

		// The real export ends in two steps, which this test runs in order.
		act( () => {
			registry.dispatch( CORE_PDF ).setStatus( 'success' );
			registry.dispatch( CORE_PDF ).finishExporting();
		} );

		expect(
			queryByText( 'Your report is being generated' )
		).not.toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Download report' } )
		).toBeEnabled();
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

	it( "should save 'pdf-export-panel-opened' to WordPress user meta when the panel opens", async () => {
		render( <PDFSectionsSelectionPanel />, { registry } );

		openPanel();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
				body: {
					data: {
						slug: PDF_EXPORT_PANEL_OPENED_ITEM_SLUG,
						expiration: 0,
					},
				},
			} )
		);
	} );

	it( "should save 'pdf-export-panel-opened' once when the user closes the panel and opens it again", async () => {
		const { waitForRegistry } = render( <PDFSectionsSelectionPanel />, {
			registry,
		} );

		openPanel();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 1, dismissItemEndpoint )
		);

		setPanelOpen( false );
		openPanel();

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, dismissItemEndpoint );
	} );

	it( "should save 'pdf-export-panel-opened' once when the user reopens the panel before the first save lands", async () => {
		// This request never resolves, so `dismissedItems` stays empty and
		// `hasAlreadyOpenedPDFExportPanel` never turns true. Only
		// `panelOpenedItemDismissedRef` can stop the second request.
		fetchMock.post( dismissItemEndpoint, new Promise( () => {} ), {
			overwriteRoutes: true,
		} );

		const { waitForRegistry } = render( <PDFSectionsSelectionPanel />, {
			registry,
		} );

		openPanel();
		setPanelOpen( false );
		openPanel();

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, dismissItemEndpoint );
	} );

	it( "should save no 'pdf-export-panel-opened' while the panel stays closed", async () => {
		const { waitForRegistry } = render( <PDFSectionsSelectionPanel />, {
			registry,
		} );

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( dismissItemEndpoint );
	} );

	it( "should save no 'pdf-export-panel-opened' while the saved slugs are still loading", async () => {
		// This fresh registry has none of the slugs `beforeEach` adds, and
		// the promise never resolves. The request for the saved slugs never
		// finishes.
		registry = createTestRegistry();
		provideModules( registry );
		registerSections( registry );
		fetchMock.get( dismissedItemsEndpoint, new Promise( () => {} ) );

		const { waitForRegistry } = render( <PDFSectionsSelectionPanel />, {
			registry,
		} );

		openPanel();

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( dismissItemEndpoint );
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
