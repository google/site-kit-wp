/**
 * PDFDownloadButton tests.
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
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import PDFDownloadButton from './PDFDownloadButton';

describe( 'PDFDownloadButton', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'renders the button with the accessible label', () => {
		const { getByLabelText } = render( <PDFDownloadButton />, {
			registry,
		} );

		expect( getByLabelText( 'Download PDF report' ) ).toBeInTheDocument();
	} );

	it( 'toggles PDF_DOWNLOAD_PANEL_OPENED_KEY on click', () => {
		const { getByLabelText } = render( <PDFDownloadButton />, {
			registry,
		} );

		expect(
			registry.select( CORE_UI ).getValue( PDF_DOWNLOAD_PANEL_OPENED_KEY )
		).toBeUndefined();

		fireEvent.click( getByLabelText( 'Download PDF report' ) );

		expect(
			registry.select( CORE_UI ).getValue( PDF_DOWNLOAD_PANEL_OPENED_KEY )
		).toBe( true );

		fireEvent.click( getByLabelText( 'Download PDF report' ) );

		expect(
			registry.select( CORE_UI ).getValue( PDF_DOWNLOAD_PANEL_OPENED_KEY )
		).toBe( false );
	} );
} );
