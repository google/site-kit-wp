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
 * Internal dependencies
 */
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '../../../../../tests/js/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import {
	PDF_DOWNLOAD_PANEL_OPENED_KEY,
	PDF_GENERATING_KEY,
	PDF_SECTIONS,
} from '@/js/components/pdf-generation/constants';
import PDFSectionsSelectionPanel from '.';

describe( 'PDFSectionsSelectionPanel', () => {
	const features = [ 'pdfGeneration' ];
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	function openPanel() {
		act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, true );
		} );
	}

	it( 'renders nothing when pdfGeneration feature flag is disabled', () => {
		const { container } = render( <PDFSectionsSelectionPanel />, {
			registry,
			features: [],
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the title and all hard-coded sections when opened', async () => {
		const { getByText, findByText, getByRole } = render(
			<PDFSectionsSelectionPanel />,
			{ registry, features }
		);

		openPanel();

		await findByText( 'Download your Site Kit report' );

		for ( const { title } of PDF_SECTIONS ) {
			expect( getByText( title ) ).toBeInTheDocument();
		}

		// All sections selected by default on first open.
		for ( const { slug } of PDF_SECTIONS ) {
			expect(
				getByRole( 'checkbox', {
					name: new RegExp(
						`${
							PDF_SECTIONS.find(
								( section ) => section.slug === slug
							).title
						}$`
					),
				} )
			).toBeChecked();
		}
	} );

	it( 'disables the "Download report" button and shows the error notice when no section is selected', async () => {
		const { getByRole, findByText, getByText } = render(
			<PDFSectionsSelectionPanel />,
			{ registry, features }
		);

		openPanel();

		await findByText( 'Download your Site Kit report' );

		for ( const { title } of PDF_SECTIONS ) {
			const checkbox = getByRole( 'checkbox', {
				name: new RegExp( `${ title }$` ),
			} );
			fireEvent.click( checkbox );
		}

		await waitFor( () => {
			expect(
				getByText( 'Select at least 1 topic' )
			).toBeInTheDocument();
		} );

		expect(
			getByRole( 'button', { name: 'Download report' } )
		).toBeDisabled();
	} );

	it( 'shows the generating notice and disables the button after clicking Download report', async () => {
		const { getByRole, findByText, getByText } = render(
			<PDFSectionsSelectionPanel />,
			{ registry, features }
		);

		openPanel();

		await findByText( 'Download your Site Kit report' );

		fireEvent.click( getByRole( 'button', { name: 'Download report' } ) );

		await waitFor( () => {
			expect(
				getByText( 'Your report is being generated' )
			).toBeInTheDocument();
		} );

		expect(
			registry.select( CORE_UI ).getValue( PDF_GENERATING_KEY )
		).toBe( true );

		expect(
			getByRole( 'button', { name: 'Download report' } )
		).toBeDisabled();
	} );

	it( 'disables the button when PDF_GENERATING_KEY is truthy before open', async () => {
		registry.dispatch( CORE_UI ).setValue( PDF_GENERATING_KEY, true );

		const { getByRole, findByText } = render(
			<PDFSectionsSelectionPanel />,
			{ registry, features }
		);

		openPanel();

		await findByText( 'Download your Site Kit report' );

		// onOpen callback resets PDF_GENERATING_KEY to false (clean slate on open).
		expect(
			registry.select( CORE_UI ).getValue( PDF_GENERATING_KEY )
		).toBe( false );

		expect(
			getByRole( 'button', { name: 'Download report' } )
		).not.toBeDisabled();
	} );
} );
