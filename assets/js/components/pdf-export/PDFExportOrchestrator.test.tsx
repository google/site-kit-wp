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
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import PDFExportOrchestrator from './PDFExportOrchestrator';

// Replace the `triggerDownload` helper with a mock, so the link click does
// not start a navigation that JSDOM cannot handle. The filename helper stays
// real.
jest.mock( './pdf-utils', () => ( {
	...jest.requireActual( './pdf-utils' ),
	triggerDownload: jest.fn(),
} ) );

describe( 'PDFExportOrchestrator', () => {
	let registry: WPDataRegistry;
	const OriginalAbortController = global.AbortController;
	const originalCreateObjectURL = global.URL.createObjectURL;
	const originalRevokeObjectURL = global.URL.revokeObjectURL;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry, { siteName: 'Example Site' } );
		provideUserInfo( registry );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );

		global.URL.createObjectURL = jest.fn( () => 'blob:mock-url' );
		global.URL.revokeObjectURL = jest.fn();
	} );

	afterEach( () => {
		// Clear the mock after each test. Clearing before a test would erase a
		// call that the test still needs to check.
		( pdf as jest.Mock ).mockClear();

		// Put the real `AbortController` back after a test replaced it.
		global.AbortController = OriginalAbortController;

		// Put the real URL helpers back after the mocks from beforeEach.
		global.URL.createObjectURL = originalCreateObjectURL;
		global.URL.revokeObjectURL = originalRevokeObjectURL;
	} );

	function renderOrchestrator() {
		return render( <PDFExportOrchestrator onComplete={ () => {} } />, {
			registry,
		} );
	}

	// The orchestrator creates its own `AbortController` on mount and keeps
	// it private. To read that controller's signal in a test, replace the
	// global constructor with a subclass that records each new instance. The
	// records cover only the controllers built during the test. A spy on
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

	it( 'aborts the running requests and shows the error when the export fails', async () => {
		// Make the BUILDING stage fail with a non-abort error, so the
		// orchestrator runs its catch path.
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

		// The error transition aborts the export's controller. The signal
		// then reports aborted, so any request that is still running stops.
		expect( controllers[ 0 ].signal.aborted ).toBe( true );
	} );

	it( 'does not abort the controller on a successful export', async () => {
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
