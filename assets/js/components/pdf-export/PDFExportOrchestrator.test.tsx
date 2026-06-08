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
import PDFExportOrchestrator from './PDFExportOrchestrator';

// Stub the download trigger so the anchor click does not attempt a JSDOM
// navigation; the filename helper stays real.
jest.mock( './pdf-utils', () => ( {
	...jest.requireActual( './pdf-utils' ),
	triggerDownload: jest.fn(),
} ) );

function NullComponent() {
	return null;
}

describe( 'PDFExportOrchestrator', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry, { siteName: 'Example Site' } );
		provideUserInfo( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-10' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );

		( pdf as jest.Mock ).mockClear();

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
} );
