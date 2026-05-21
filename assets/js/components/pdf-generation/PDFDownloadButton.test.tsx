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
} from '../../../../tests/js/test-utils';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
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

	it( 'toggles the sections panel open state on click', () => {
		const { getByLabelText } = render( <PDFDownloadButton />, {
			registry,
		} );

		expect( registry.select( CORE_PDF ).isSectionsPanelOpen() ).toBe(
			false
		);

		fireEvent.click( getByLabelText( 'Download PDF report' ) );

		expect( registry.select( CORE_PDF ).isSectionsPanelOpen() ).toBe(
			true
		);

		fireEvent.click( getByLabelText( 'Download PDF report' ) );

		expect( registry.select( CORE_PDF ).isSectionsPanelOpen() ).toBe(
			false
		);
	} );
} );
