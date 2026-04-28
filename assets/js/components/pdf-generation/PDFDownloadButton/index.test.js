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
import {
	createTestRegistry,
	fireEvent,
	render,
} from '../../../../../tests/js/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-generation/constants';
import PDFDownloadButton from '.';

describe( 'PDFDownloadButton', () => {
	const features = [ 'pdfGeneration' ];
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'renders the button when pdfGeneration feature flag is enabled', () => {
		const { getByLabelText } = render( <PDFDownloadButton />, {
			registry,
			features,
		} );

		expect( getByLabelText( 'Download PDF report' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing when pdfGeneration feature flag is disabled', () => {
		const { container } = render( <PDFDownloadButton />, {
			registry,
			features: [],
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'toggles PDF_DOWNLOAD_PANEL_OPENED_KEY on click', () => {
		const { getByLabelText } = render( <PDFDownloadButton />, {
			registry,
			features,
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
