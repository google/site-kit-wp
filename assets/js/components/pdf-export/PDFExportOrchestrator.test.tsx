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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	provideSiteInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import PDFExportOrchestrator from './PDFExportOrchestrator';

// `@react-pdf/renderer` is auto-mocked via `__mocks__/@react-pdf/renderer.js`,
// which exports `pdf` as a `jest.fn()` returning a stub `toBlob()`. That lets
// the orchestrator's BUILDING stage resolve instantly so we can capture the
// element handed to `pdf()`, all without loading fontkit (which needs Node APIs
// JSDOM lacks). The mock also renders the report primitives as host elements,
// so `DashboardReport`/`PDFFooter` import cleanly.

// Avoid the jsdom anchor-click navigation; the download itself isn't under test.
jest.mock( './pdf-utils', () => ( {
	...jest.requireActual( './pdf-utils' ),
	triggerDownload: jest.fn(),
} ) );

describe( 'PDFExportOrchestrator', () => {
	const ADMIN_URL = 'http://example.com/wp-admin/';
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		( pdf as jest.Mock ).mockClear();
		global.URL.createObjectURL = jest.fn( () => 'blob:mock-url' );
		global.URL.revokeObjectURL = jest.fn();

		registry = createTestRegistry();
		provideSiteInfo( registry, { adminURL: ADMIN_URL } );
	} );

	/**
	 * Renders the orchestrator and resolves with the React element passed to
	 * the mocked `pdf()` once the BUILDING stage runs.
	 *
	 * @since n.e.x.t
	 *
	 * @return The captured `DashboardReport` element.
	 */
	async function renderAndCaptureReport() {
		render( <PDFExportOrchestrator onComplete={ jest.fn() } />, {
			registry,
		} );

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
} );
