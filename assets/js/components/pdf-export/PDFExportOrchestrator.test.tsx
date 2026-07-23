/**
 * PDFExportOrchestrator component tests.
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
import { pdf } from '@react-pdf/renderer';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import * as tracking from '@/js/util/tracking';
import {
	act,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import { registerPDFFonts } from './pdf-fonts-react';
import PDFExportOrchestrator from './PDFExportOrchestrator';
import { SECTION_ICONS } from './section-icons';
import { PDFHeaderSection, PDFReportArea } from './types';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

// `@react-pdf/renderer` is auto-mocked via `__mocks__/@react-pdf/renderer.js`,
// which exports `pdf` as a `jest.fn()` returning a stub `toBlob()`. That lets
// the orchestrator's BUILDING stage resolve instantly so we can capture the
// element handed to `pdf()`, all without loading fontkit (which needs Node APIs
// JSDOM lacks). The mock also renders the report primitives as host elements,
// so `DashboardReport`/`PDFFooter` import cleanly.

// Stub the download trigger so the anchor click does not attempt a JSDOM
// navigation; the filename helper stays real.
jest.mock( './pdf-utils', () => ( {
	...jest.requireActual( './pdf-utils' ),
	triggerDownload: jest.fn(),
} ) );

jest.mock( './pdf-fonts-react', () => ( {
	registerPDFFonts: jest.fn(),
} ) );

function NullComponent() {
	return null;
}

describe( 'PDFExportOrchestrator', () => {
	const ADMIN_URL = 'http://example.com/wp-admin/';
	let registry: ReturnType< typeof createTestRegistry >;
	const OriginalAbortController = global.AbortController;
	const originalCreateObjectURL = global.URL.createObjectURL;
	const originalRevokeObjectURL = global.URL.revokeObjectURL;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry, {
			adminURL: ADMIN_URL,
			siteName: 'Example Site',
		} );
		provideUserInfo( registry );
		// The orchestrator waits for the module connection state, so every
		// test needs modules in the store.
		provideModules( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-10' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );

		global.URL.createObjectURL = jest.fn( () => 'blob:mock-url' );
		global.URL.revokeObjectURL = jest.fn();
	} );

	afterEach( () => {
		// Clear the mocks after each test. Clearing before a test would erase a
		// call that the test still needs to check.
		( pdf as jest.Mock ).mockClear();
		jest.mocked( registerPDFFonts ).mockClear();
		mockTrackEvent.mockClear();

		// Put the real `AbortController` back after a test replaced it with the
		// recording subclass.
		global.AbortController = OriginalAbortController;

		// Put the real URL helpers back after the mocks from `beforeEach`.
		global.URL.createObjectURL = originalCreateObjectURL;
		global.URL.revokeObjectURL = originalRevokeObjectURL;
	} );

	/**
	 * Registers a widget area and one pdf widget in the Traffic context, so a
	 * test can give the orchestrator a widget to export.
	 *
	 * @since 1.184.0
	 *
	 * @param  areaSlug   Slug of the widget area.
	 * @param  widgetSlug Slug of the pdf widget.
	 * @param  getData    Mock for the widget's pdf `getData`.
	 * @param  modules    Module slugs the widget depends on, if any.
	 * @return {void}
	 */
	function registerPDFWidget(
		areaSlug: string,
		widgetSlug: string,
		getData: jest.Mock,
		modules?: string[]
	) {
		const dispatch = registry.dispatch( CORE_WIDGETS );
		dispatch.registerWidgetArea( areaSlug, {
			title: 'Area',
			pdfTitle: 'Traffic',
			style: 'boxes',
			priority: 1,
		} );
		dispatch.assignWidgetArea( areaSlug, CONTEXT_MAIN_DASHBOARD_TRAFFIC );
		dispatch.registerWidget( widgetSlug, {
			Component: NullComponent,
			...( modules && { modules } ),
			pdf: { Component: NullComponent, getData },
		} );
		dispatch.assignWidget( widgetSlug, areaSlug );
	}

	/**
	 * Registers a PDF widget and its area in a dashboard context.
	 *
	 * @since 1.184.0
	 *
	 * @param  contextSlug The dashboard context the area belongs to.
	 * @param  areaSlug    The widget area to register in that context.
	 * @param  widgetSlug  The widget to register in that area.
	 * @param  pdfTitle    The area's PDF title, shown as the report section heading.
	 * @return {void}
	 */
	function registerPDFWidgetInContext(
		contextSlug: string,
		areaSlug: string,
		widgetSlug: string,
		pdfTitle: string
	) {
		const dispatch = registry.dispatch( CORE_WIDGETS );
		dispatch.registerWidgetArea( areaSlug, {
			title: 'Area',
			pdfTitle,
			style: 'boxes',
			priority: 1,
		} );
		dispatch.assignWidgetArea( areaSlug, contextSlug );
		dispatch.registerWidget( widgetSlug, {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: jest.fn( () =>
					Promise.resolve( { data: { totalUsers: 100 } } )
				),
			},
		} );
		dispatch.assignWidget( widgetSlug, areaSlug );
	}

	function renderOrchestrator() {
		return render( <PDFExportOrchestrator onComplete={ () => {} } />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
	}

	/**
	 * Renders the orchestrator and resolves with the React element passed to
	 * the mocked `pdf()` once the BUILDING stage runs.
	 *
	 * @since 1.182.0
	 *
	 * @return The captured `DashboardReport` element.
	 */
	async function renderAndCaptureReport() {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => expect( pdf ).toHaveBeenCalled() );

		return ( pdf as jest.Mock ).mock.calls[ 0 ][ 0 ];
	}

	// The orchestrator creates its own `AbortController` on mount and keeps it
	// private. To read that controller's signal in a test, replace the global
	// constructor with a subclass that records each new instance. The records
	// cover only the controllers built during the test. A spy on
	// `AbortController.prototype.abort` would also count the unmount cleanup
	// from a prior test, which React runs during this test's first render.
	function recordExportControllers(): AbortController[] {
		const controllers: AbortController[] = [];

		class RecordingAbortController extends OriginalAbortController {
			constructor() {
				super();
				controllers.push( this );
			}
		}

		global.AbortController = RecordingAbortController;

		return controllers;
	}

	it( 'should pass the resolved dashboard, help center, and privacy policy URLs to DashboardReport', async () => {
		const reportElement = await renderAndCaptureReport();

		expect( reportElement.props.dashboardURL ).toBe(
			registry.select( CORE_SITE ).getGoLinkURL( 'dashboard' )
		);
		expect( reportElement.props.helpCenterURL ).toBe(
			'https://sitekit.withgoogle.com/support/?doc=get-support'
		);
		expect( reportElement.props.privacyPolicyURL ).toBe(
			'https://policies.google.com/privacy'
		);
	} );

	it( 'should build each URL via getGoLinkURL with the expected handler key', async () => {
		const reportElement = await renderAndCaptureReport();

		expect( reportElement.props.dashboardURL ).toBe(
			`${ ADMIN_URL }index.php?action=googlesitekit_go&to=dashboard`
		);
		expect( reportElement.props.helpCenterURL ).toBe(
			'https://sitekit.withgoogle.com/support/?doc=get-support'
		);
		expect( reportElement.props.privacyPolicyURL ).toBe(
			'https://policies.google.com/privacy'
		);
	} );

	it( 'should load the selected widget data with PDF-adjusted dates and build the PDF', async () => {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		expect( getData ).toHaveBeenCalledTimes( 1 );

		const { dates, signal } = getData.mock.calls[ 0 ][ 0 ];
		// End date is shifted back one day from the reference date.
		expect( dates.endDate ).toBe( '2021-01-09' );
		expect( dates.compareStartDate ).toBeDefined();
		expect( signal ).toBeInstanceOf( AbortSignal );

		expect( pdf ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should transition to error and not build a PDF when the only widget fails', async () => {
		const getData = jest.fn( () =>
			Promise.reject( new Error( 'report failed' ) )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'error' );
		} );

		expect( pdf ).not.toHaveBeenCalled();
	} );

	it( 'should isolate a failing widget when another widget succeeds', async () => {
		const failing = jest.fn( () =>
			Promise.reject( new Error( 'report failed' ) )
		);
		const succeeding = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficAreaA', 'trafficWidgetA', failing );
		registerPDFWidget( 'trafficAreaB', 'trafficWidgetB', succeeding );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidgetA', 'trafficWidgetB' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		expect( failing ).toHaveBeenCalledTimes( 1 );
		expect( succeeding ).toHaveBeenCalledTimes( 1 );
		expect( pdf ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'includes only the checked widget when the user unchecks the other widget in the same section', async () => {
		const checkedGetData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		const uncheckedGetData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);

		// Register a widget area with two widgets. The area becomes one section
		// in the PDF. The user checks the first widget and unchecks the second.
		const dispatch = registry.dispatch( CORE_WIDGETS );

		dispatch.registerWidgetArea( 'contentArea', {
			title: 'Area',
			pdfTitle: 'Content',
			style: 'boxes',
			priority: 1,
		} );
		dispatch.assignWidgetArea(
			'contentArea',
			CONTEXT_MAIN_DASHBOARD_CONTENT
		);

		dispatch.registerWidget( 'checkedWidget', {
			Component: NullComponent,
			pdf: { Component: NullComponent, getData: checkedGetData },
		} );
		dispatch.assignWidget( 'checkedWidget', 'contentArea' );

		dispatch.registerWidget( 'uncheckedWidget', {
			Component: NullComponent,
			pdf: { Component: NullComponent, getData: uncheckedGetData },
		} );
		dispatch.assignWidget( 'uncheckedWidget', 'contentArea' );

		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_CONTENT ],
			widgetSlugs: [ 'checkedWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => expect( pdf ).toHaveBeenCalled() );

		// The orchestrator drops the unchecked widget before the loading stage,
		// so only the checked widget's data loader runs.
		expect( checkedGetData ).toHaveBeenCalledTimes( 1 );
		expect( uncheckedGetData ).not.toHaveBeenCalled();

		// The report includes only the checked widget.
		const { props } = ( pdf as jest.Mock ).mock.calls[ 0 ][ 0 ];
		expect( props.areas ).toHaveLength( 1 );
		expect( props.areas[ 0 ].widgets ).toHaveLength( 1 );
		expect( props.areas[ 0 ].widgets[ 0 ].slug ).toBe( 'checkedWidget' );
	} );

	it( 'should pass the email reporting golink URL to the report document', async () => {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		const reportDocument = ( pdf as jest.Mock ).mock.calls[ 0 ][ 0 ];
		expect( reportDocument.props.emailReportingSetupURL ).toBe(
			'http://example.com/wp-admin/index.php?action=googlesitekit_go&to=manage-subscription-email-reporting'
		);
	} );

	it( 'passes the resolved header props and the derived sections to the report document', async () => {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		const { props } = ( pdf as jest.Mock ).mock.calls[ 0 ][ 0 ];

		expect( props.siteName ).toBe( 'Example Site' );
		expect( props.siteURL ).toBe( 'http://example.com' );
		expect( props.dashboardURL ).toBe(
			'http://example.com/wp-admin/index.php?action=googlesitekit_go&to=dashboard'
		);
		// PDF-adjusted reporting period: end date is the day before the
		// reference date (2021-01-10).
		expect( props.dateRange.endDate ).toBe( '2021-01-09' );
		expect( props.dateRange.startDate ).toBeDefined();

		// One section per context, keyed by the context slug, labelled from the
		// area's title, with the context's icon.
		expect( props.sections ).toEqual( [
			{
				slug: CONTEXT_MAIN_DASHBOARD_TRAFFIC,
				label: 'Traffic',
				Icon: SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			},
		] );
	} );

	it( 'titles the report section from pdfReportTitle when set, overriding pdfTitle', async () => {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		const dispatch = registry.dispatch( CORE_WIDGETS );
		dispatch.registerWidgetArea( 'monetizationArea', {
			title: 'Area',
			pdfTitle: 'Revenue',
			pdfReportTitle: 'Monetization',
			style: 'boxes',
			priority: 1,
		} );
		dispatch.assignWidgetArea(
			'monetizationArea',
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
		dispatch.registerWidget( 'monetizationWidget', {
			Component: NullComponent,
			pdf: { Component: NullComponent, getData },
		} );
		dispatch.assignWidget( 'monetizationWidget', 'monetizationArea' );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'monetizationWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		const { props } = ( pdf as jest.Mock ).mock.calls[ 0 ][ 0 ];

		// The header chip and the body section title both read the report title.
		expect( props.sections[ 0 ].label ).toBe( 'Monetization' );
		expect( props.areas[ 0 ].areaTitle ).toBe( 'Monetization' );
	} );

	it( 'derives a single section for an area shared across multiple selected contexts', async () => {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);

		registerPDFWidget( 'sharedArea', 'sharedWidget', getData );

		registry
			.dispatch( CORE_WIDGETS )
			.assignWidgetArea( 'sharedArea', CONTEXT_MAIN_DASHBOARD_CONTENT );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [
				CONTEXT_MAIN_DASHBOARD_TRAFFIC,
				CONTEXT_MAIN_DASHBOARD_CONTENT,
			],
			widgetSlugs: [ 'sharedWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		const { props } = ( pdf as jest.Mock ).mock.calls[ 0 ][ 0 ];
		expect( props.sections ).toHaveLength( 1 );
		expect( props.sections[ 0 ].slug ).toBe(
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
	} );

	it( 'merges two areas in one context into a single section, so an untitled area adds no empty chip', async () => {
		const dispatch = registry.dispatch( CORE_WIDGETS );

		// A titled primary area holding one widget.
		dispatch.registerWidgetArea( 'trafficPrimary', {
			title: 'Area',
			pdfTitle: 'Traffic',
			style: 'boxes',
			priority: 1,
		} );
		dispatch.assignWidgetArea(
			'trafficPrimary',
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
		dispatch.registerWidget( 'primaryWidget', {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: jest.fn( () =>
					Promise.resolve( { data: { totalUsers: 1 } } )
				),
				label: 'Site traffic',
			},
		} );
		dispatch.assignWidget( 'primaryWidget', 'trafficPrimary' );

		// A second area in the same context, registered with no `pdfTitle`.
		// `registerWidgetArea` doesn't require one, so the merge must take
		// the section title from the titled sibling and add no empty chip.
		dispatch.registerWidgetArea( 'trafficAudience', {
			style: 'boxes',
			priority: 2,
		} );
		dispatch.assignWidgetArea(
			'trafficAudience',
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
		dispatch.registerWidget( 'audienceWidget', {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: jest.fn( () =>
					Promise.resolve( { data: { audiences: [ {}, {} ] } } )
				),
				label: 'Your visitor groups',
			},
		} );
		dispatch.assignWidget( 'audienceWidget', 'trafficAudience' );

		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'primaryWidget', 'audienceWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		const { props } = ( pdf as jest.Mock ).mock.calls[ 0 ][ 0 ];

		// One Traffic chip, keyed by the context, with the titled area's label.
		expect( props.sections ).toEqual( [
			{
				slug: CONTEXT_MAIN_DASHBOARD_TRAFFIC,
				label: 'Traffic',
				Icon: SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			},
		] );

		// One body section holding both widgets, in area order.
		expect( props.areas ).toHaveLength( 1 );
		expect(
			props.areas[ 0 ].widgets.map(
				( widget: { slug: string } ) => widget.slug
			)
		).toEqual( [ 'primaryWidget', 'audienceWidget' ] );
	} );

	it( "derives the sections in the dashboard's order, not the stored order", async () => {
		registerPDFWidgetInContext(
			CONTEXT_MAIN_DASHBOARD_TRAFFIC,
			'trafficArea',
			'trafficWidget',
			'Traffic'
		);
		registerPDFWidgetInContext(
			CONTEXT_MAIN_DASHBOARD_CONTENT,
			'contentArea',
			'contentWidget',
			'Content'
		);
		registerPDFWidgetInContext(
			CONTEXT_MAIN_DASHBOARD_SPEED,
			'speedArea',
			'speedWidget',
			'Speed'
		);

		// Store the selection in reverse dashboard order. The report must
		// still render Traffic, then Content, then Speed.
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [
				CONTEXT_MAIN_DASHBOARD_SPEED,
				CONTEXT_MAIN_DASHBOARD_CONTENT,
				CONTEXT_MAIN_DASHBOARD_TRAFFIC,
			],
			widgetSlugs: [ 'speedWidget', 'contentWidget', 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		const { props } = ( pdf as jest.Mock ).mock.calls[ 0 ][ 0 ];

		// A section covers one dashboard context, so each one is keyed by its
		// context slug. Sections and areas follow the dashboard's order, not
		// the stored order.
		const expectedContextOrder = [
			CONTEXT_MAIN_DASHBOARD_TRAFFIC,
			CONTEXT_MAIN_DASHBOARD_CONTENT,
			CONTEXT_MAIN_DASHBOARD_SPEED,
		];
		expect(
			props.sections.map( ( section: PDFHeaderSection ) => section.slug )
		).toEqual( expectedContextOrder );
		expect(
			props.areas.map( ( area: PDFReportArea ) => area.areaSlug )
		).toEqual( expectedContextOrder );
	} );

	it( 'should register the PDF fonts before rendering the document', async () => {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		expect( registerPDFFonts ).toHaveBeenCalledTimes( 1 );
		expect(
			jest.mocked( registerPDFFonts ).mock.invocationCallOrder[ 0 ]
		).toBeLessThan( ( pdf as jest.Mock ).mock.invocationCallOrder[ 0 ] );
	} );

	it( 'should transition to error and not build a PDF when font registration fails', async () => {
		jest.mocked( registerPDFFonts ).mockImplementationOnce( () => {
			throw new Error( 'font registration failed' );
		} );
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'error' );
		} );

		expect( pdf ).not.toHaveBeenCalled();
	} );

	it( 'aborts the running requests and shows the error when the export fails', async () => {
		// Register a widget so the export reaches the BUILDING stage, then make
		// that stage fail with a non-abort error so the orchestrator runs its
		// catch path.
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		( pdf as jest.Mock ).mockReturnValueOnce( {
			toBlob: jest.fn( () =>
				Promise.reject( new Error( 'build failed' ) )
			),
		} );

		const controllers = recordExportControllers();

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'error' );
		} );

		// The error transition aborts the export's controller. The signal then
		// reports aborted, so any request that is still running stops.
		expect( controllers[ 0 ].signal.aborted ).toBe( true );
	} );

	it( 'does not abort the controller on a successful export', async () => {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		const controllers = recordExportControllers();

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		// A successful export reaches COMPLETE without an abort. Its signal
		// still reports not aborted while the component stays mounted.
		expect( controllers[ 0 ].signal.aborted ).toBe( false );
	} );

	it( 'fires pdf_generation_complete with the selected context slugs on success', async () => {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pdf_generation`,
			'pdf_generation_complete',
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
	} );

	it( 'fires pdf_generation_error with "building" label when the PDF build fails', async () => {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		( pdf as jest.Mock ).mockReturnValueOnce( {
			toBlob: jest.fn( () =>
				Promise.reject( new Error( 'build failed' ) )
			),
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'error' );
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pdf_generation`,
			'pdf_generation_error',
			'building'
		);
	} );

	it( 'fires pdf_generation_error with "loading" label when all widget data fails to load', async () => {
		const getData = jest.fn( () =>
			Promise.reject( new Error( 'report failed' ) )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'error' );
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pdf_generation`,
			'pdf_generation_error',
			'loading'
		);
	} );

	it( 'excludes a widget whose pdf.isActive returns false from the export', async () => {
		const getData = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		const inactiveGetData = jest.fn( () =>
			Promise.resolve( { data: null } )
		);
		registry.dispatch( CORE_WIDGETS ).registerWidget( 'inactiveWidget', {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: inactiveGetData,
				isActive: () => false,
			},
		} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( 'inactiveWidget', 'trafficArea' );
		// Select both widgets so the only thing excluding `inactiveWidget` is
		// its `pdf.isActive` predicate, not the user's widget selection.
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget', 'inactiveWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		expect( getData ).toHaveBeenCalledTimes( 1 );
		expect( inactiveGetData ).not.toHaveBeenCalled();
	} );

	it( 'includes a widget whose pdf.isActive returns true', async () => {
		const getData = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		const activeGetData = jest.fn( () =>
			Promise.resolve( { data: null } )
		);
		registry.dispatch( CORE_WIDGETS ).registerWidget( 'activeWidget', {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: activeGetData,
				isActive: () => true,
			},
		} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( 'activeWidget', 'trafficArea' );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget', 'activeWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		expect( getData ).toHaveBeenCalledTimes( 1 );
		expect( activeGetData ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'excludes the Top earning pages widget when AdSense is not linked to Analytics 4', async () => {
		const getData = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );

		const topEarningGetData = jest.fn( () =>
			Promise.resolve( { data: null } )
		);
		// The Top earning pages widget only appears in the PDF when AdSense is
		// linked to Analytics 4, using the same predicate registered on
		// `adsenseTopEarningPagesGA4`.
		registry.dispatch( CORE_WIDGETS ).registerWidget( 'topEarningPages', {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: topEarningGetData,
				isActive: (
					select: ( storeName: string ) => {
						getAdSenseLinked: () => boolean;
					}
				) => select( MODULES_ANALYTICS_4 ).getAdSenseLinked() === true,
			},
		} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( 'topEarningPages', 'trafficArea' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { adSenseLinked: false } );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget', 'topEarningPages' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		expect( getData ).toHaveBeenCalledTimes( 1 );
		expect( topEarningGetData ).not.toHaveBeenCalled();
	} );

	it( 'does not request data for a widget whose required module is disconnected', async () => {
		provideModules( registry, [
			{ slug: MODULES_ANALYTICS_4, active: true, connected: false },
		] );

		const connectedGetData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', connectedGetData );

		const disconnectedGetData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registry.dispatch( CORE_WIDGETS ).registerWidget( 'analyticsWidget', {
			Component: NullComponent,
			modules: [ MODULES_ANALYTICS_4 ],
			pdf: { Component: NullComponent, getData: disconnectedGetData },
		} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( 'analyticsWidget', 'trafficArea' );
		// Select both widgets, so only the disconnected module excludes the
		// Analytics widget, not the user's selection.
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget', 'analyticsWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		// No report request runs against the disconnected module.
		expect( disconnectedGetData ).not.toHaveBeenCalled();
		// The connected widget still exports.
		expect( connectedGetData ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'includes the Top earning pages widget when AdSense is linked to Analytics 4', async () => {
		const getData = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );

		const topEarningGetData = jest.fn( () =>
			Promise.resolve( { data: null } )
		);
		registry.dispatch( CORE_WIDGETS ).registerWidget( 'topEarningPages', {
			Component: NullComponent,
			pdf: {
				Component: NullComponent,
				getData: topEarningGetData,
				isActive: (
					select: ( storeName: string ) => {
						getAdSenseLinked: () => boolean;
					}
				) => select( MODULES_ANALYTICS_4 ).getAdSenseLinked() === true,
			},
		} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( 'topEarningPages', 'trafficArea' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { adSenseLinked: true } );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget', 'topEarningPages' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		expect( getData ).toHaveBeenCalledTimes( 1 );
		expect( topEarningGetData ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'requests data for a widget whose required module is connected', async () => {
		provideModules( registry, [
			{ slug: MODULES_ANALYTICS_4, active: true, connected: true },
		] );

		const analyticsGetData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'analyticsWidget', analyticsGetData, [
			MODULES_ANALYTICS_4,
		] );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'analyticsWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		expect( analyticsGetData ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'fires pdf_generation_cancel with the current stage label when the user cancels', async () => {
		let resolveData: ( value: unknown ) => void;
		const getData: jest.Mock = jest.fn(
			() =>
				new Promise( ( resolve ) => {
					resolveData = resolve;
				} )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [ 'trafficWidget' ],
		} );

		renderOrchestrator();

		await waitFor( () => expect( getData ).toHaveBeenCalled() );

		act( () => {
			registry.dispatch( CORE_PDF ).requestCancel();
		} );

		// Unblock getData so throwIfAborted can propagate the abort to catch.
		resolveData!( { data: null } );

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pdf_generation`,
				'pdf_generation_cancel',
				'loading'
			);
		} );
	} );

	describe( 'pdf.isActive on the analytics audience tiles widget', () => {
		/**
		 * Registers the analytics audience tiles widget in a titled Traffic
		 * area, with the `pdf.isActive` check that limits the PDF row to two or
		 * more audiences.
		 *
		 * @since 1.184.0
		 *
		 * @param  getData The widget's PDF `getData` mock.
		 * @return {void}
		 */
		function registerAudienceTilesWidget( getData: jest.Mock ) {
			const dispatch = registry.dispatch( CORE_WIDGETS );
			dispatch.registerWidgetArea( 'audienceArea', {
				title: 'Area',
				pdfTitle: 'Traffic',
				style: 'boxes',
				priority: 1,
			} );
			dispatch.assignWidgetArea(
				'audienceArea',
				CONTEXT_MAIN_DASHBOARD_TRAFFIC
			);
			dispatch.registerWidget( 'analyticsAudienceTiles', {
				Component: NullComponent,
				pdf: {
					Component: NullComponent,
					getData,
					isActive: ( select: WPDataRegistry[ 'select' ] ) =>
						( select( CORE_USER ).getConfiguredAudiences()
							?.length ?? 0 ) >= 2,
				},
			} );
			dispatch.assignWidget( 'analyticsAudienceTiles', 'audienceArea' );
		}

		/**
		 * Configures the given number of audiences on the user store.
		 *
		 * @since 1.184.0
		 *
		 * @param  count How many audiences to configure.
		 * @return {void}
		 */
		function setConfiguredAudiences( count: number ) {
			registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
				configuredAudiences: Array.from(
					{ length: count },
					( _, index ) => `properties/1/audiences/${ index + 1 }`
				),
				isAudienceSegmentationWidgetHidden: false,
				didSetAudiences: true,
			} );
		}

		it( 'excludes the widget when fewer than two audiences are configured', async () => {
			const audienceGetData = jest.fn( () =>
				Promise.resolve( { data: { audiences: [] } } )
			);
			const controlGetData = jest.fn( () =>
				Promise.resolve( { data: { totalUsers: 1 } } )
			);

			setConfiguredAudiences( 1 );
			registerAudienceTilesWidget( audienceGetData );
			registerPDFWidget( 'controlArea', 'controlWidget', controlGetData );

			registry.dispatch( CORE_PDF ).setSelection( {
				contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
				widgetSlugs: [ 'analyticsAudienceTiles', 'controlWidget' ],
			} );

			renderOrchestrator();

			await waitFor( () => {
				expect( registry.select( CORE_PDF ).getStatus() ).toBe(
					'success'
				);
			} );

			expect( audienceGetData ).not.toHaveBeenCalled();
			expect( controlGetData ).toHaveBeenCalled();
		} );

		it( 'includes the widget when two or more audiences are configured', async () => {
			const audienceGetData = jest.fn( () =>
				Promise.resolve( { data: { audiences: [ {}, {} ] } } )
			);

			setConfiguredAudiences( 2 );
			registerAudienceTilesWidget( audienceGetData );

			registry.dispatch( CORE_PDF ).setSelection( {
				contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
				widgetSlugs: [ 'analyticsAudienceTiles' ],
			} );

			renderOrchestrator();

			await waitFor( () => {
				expect( registry.select( CORE_PDF ).getStatus() ).toBe(
					'success'
				);
			} );

			expect( audienceGetData ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
