/**
 * PDFExportOrchestrator tests.
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
	let registry: ReturnType< typeof createTestRegistry >;
	const OriginalAbortController = global.AbortController;
	const originalCreateObjectURL = global.URL.createObjectURL;
	const originalRevokeObjectURL = global.URL.revokeObjectURL;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry, { siteName: 'Example Site' } );
		provideUserInfo( registry );
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

		// Put the real `AbortController` back after a test replaced it with the
		// recording subclass.
		global.AbortController = OriginalAbortController;

		// Put the real URL helpers back after the mocks from `beforeEach`.
		global.URL.createObjectURL = originalCreateObjectURL;
		global.URL.revokeObjectURL = originalRevokeObjectURL;
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

	it( 'loads the selected widget data with PDF-adjusted dates and builds the PDF', async () => {
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

	it( 'transitions to error and does not build a PDF when the only widget fails', async () => {
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

	it( 'isolates a failing widget when another widget succeeds', async () => {
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

	it( 'registers the PDF fonts before rendering the document', async () => {
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

	it( 'transitions to error and does not build a PDF when font registration fails', async () => {
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
			widgetSlugs: [],
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
			widgetSlugs: [],
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
} );
