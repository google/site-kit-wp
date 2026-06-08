/**
 * PDFReportProgressSnackbar component tests.
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
import { fireEvent } from '@testing-library/react';
import type { MouseEvent } from 'react';

/**
 * Internal dependencies
 */
import { render } from '@tests/js/test-utils';
import PDFReportProgressSnackbar from './PDFReportProgressSnackbar';

describe( 'PDFReportProgressSnackbar', () => {
	it( 'renders default title, description, and Cancel label', () => {
		const { getByText, getByRole } = render(
			<PDFReportProgressSnackbar onCancel={ () => {} } />
		);

		expect(
			getByText( /Generating your PDF report/i )
		).toBeInTheDocument();
		expect(
			getByText(
				/Please keep this tab open until the download starts automatically/i
			)
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: /cancel/i } )
		).toBeInTheDocument();
	} );

	it( 'renders custom title, description, and cancelLabel when provided', () => {
		const { getByText, getByRole, queryByText } = render(
			<PDFReportProgressSnackbar
				onCancel={ () => {} }
				title="Custom title"
				description="Custom description"
				cancelLabel="Stop"
			/>
		);

		expect( getByText( 'Custom title' ) ).toBeInTheDocument();
		expect( getByText( 'Custom description' ) ).toBeInTheDocument();
		expect( getByRole( 'button', { name: /stop/i } ) ).toBeInTheDocument();
		expect(
			queryByText( /Generating your PDF report/i )
		).not.toBeInTheDocument();
	} );

	it( 'renders a progressbar that updates from the progress prop', () => {
		const { getByRole, rerender } = render(
			<PDFReportProgressSnackbar
				onCancel={ () => {} }
				progress={ 0.25 }
			/>
		);

		const progressbar = getByRole( 'progressbar' );
		expect( progressbar ).toBeInTheDocument();
		expect(
			progressbar.querySelector( '.mdc-linear-progress__primary-bar' )
		).toHaveStyle( { width: '25%', transform: 'none' } );

		rerender(
			<PDFReportProgressSnackbar
				onCancel={ () => {} }
				progress={ 0.75 }
			/>
		);

		expect(
			progressbar.querySelector( '.mdc-linear-progress__primary-bar' )
		).toHaveStyle( { width: '75%', transform: 'none' } );
	} );

	it( 'calls onCancel when the Cancel button is clicked', () => {
		const onCancel = jest.fn(
			( event: MouseEvent< HTMLAnchorElement | HTMLButtonElement > ) =>
				event.preventDefault()
		);
		const { getByRole } = render(
			<PDFReportProgressSnackbar onCancel={ onCancel } />
		);

		fireEvent.click( getByRole( 'button', { name: /cancel/i } ) );
		expect( onCancel ).toHaveBeenCalledTimes( 1 );
	} );
} );
