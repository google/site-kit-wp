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
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import { CONTEXT_MAIN_DASHBOARD_TRAFFIC } from '@/js/googlesitekit/widgets/default-contexts';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import { registerPDFFonts } from './pdf-fonts-react';
import PDFExportOrchestrator from './PDFExportOrchestrator';

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

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry, {
			adminURL: ADMIN_URL,
			siteName: 'Example Site',
		} );
		provideUserInfo( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-10' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );

		( pdf as jest.Mock ).mockClear();
		jest.mocked( registerPDFFonts ).mockClear();

		global.URL.createObjectURL = jest.fn( () => 'blob:mock-url' );
		global.URL.revokeObjectURL = jest.fn();
	} );

	function registerPDFWidget(
		areaSlug: string,
		widgetSlug: string,
		getData: jest.Mock
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
			pdf: { Component: NullComponent, getData },
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
	 * @since n.e.x.t
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
			widgetSlugs: [],
		} );

		renderOrchestrator();

		await waitFor( () => expect( pdf ).toHaveBeenCalled() );

		return ( pdf as jest.Mock ).mock.calls[ 0 ][ 0 ];
	}

	it( 'should pass the resolved dashboard, help center, and privacy policy URLs to DashboardReport', async () => {
		const reportElement = await renderAndCaptureReport();

		expect( reportElement.props.dashboardURL ).toBe(
			registry.select( CORE_SITE ).getGoLinkURL( 'dashboard' )
		);
		expect( reportElement.props.helpCenterURL ).toBe(
			'https://sitekit.withgoogle.com/support/'
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
			'https://sitekit.withgoogle.com/support/'
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
			widgetSlugs: [],
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
			widgetSlugs: [],
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
			widgetSlugs: [],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		} );

		expect( failing ).toHaveBeenCalledTimes( 1 );
		expect( succeeding ).toHaveBeenCalledTimes( 1 );
		expect( pdf ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should register the PDF fonts before rendering the document', async () => {
		const getData: jest.Mock = jest.fn( () =>
			Promise.resolve( { data: { totalUsers: 100 } } )
		);
		registerPDFWidget( 'trafficArea', 'trafficWidget', getData );
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [],
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
			widgetSlugs: [],
		} );

		renderOrchestrator();

		await waitFor( () => {
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'error' );
		} );

		expect( pdf ).not.toHaveBeenCalled();
	} );
} );
