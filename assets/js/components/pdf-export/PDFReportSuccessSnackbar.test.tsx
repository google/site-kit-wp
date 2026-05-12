/**
 * PDFReportSuccessSnackbar component tests.
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
import PDFReportSuccessSnackbar from './PDFReportSuccessSnackbar';
import { act, render } from '../../../../tests/js/test-utils';

describe( 'PDFReportSuccessSnackbar', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'renders default title, description, retry link, and dismiss button', () => {
		const { getByText, getByRole } = render(
			<PDFReportSuccessSnackbar disableAutoDismiss />
		);

		expect(
			getByText( /Your report was generated successfully!/i )
		).toBeInTheDocument();
		expect(
			getByText( /automatically downloaded to your downloads folder/i )
		).toBeInTheDocument();
		expect(
			getByRole( 'link', { name: /download your report/i } )
		).toHaveAttribute( 'href', '#' );
		expect(
			getByRole( 'button', { name: /dismiss pdf report success/i } )
		).toBeInTheDocument();
	} );

	it( 'calls onDismiss when the close icon is clicked', () => {
		const onDismiss = jest.fn( ( event: MouseEvent< HTMLButtonElement > ) =>
			event.preventDefault()
		);
		const { getByRole } = render(
			<PDFReportSuccessSnackbar
				onDismiss={ onDismiss }
				disableAutoDismiss
			/>
		);

		fireEvent.click(
			getByRole( 'button', { name: /dismiss pdf report success/i } )
		);

		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls onAutoDismiss after the default 10s auto-dismiss interval', () => {
		const onAutoDismiss = jest.fn();
		render( <PDFReportSuccessSnackbar onAutoDismiss={ onAutoDismiss } /> );

		expect( onAutoDismiss ).not.toHaveBeenCalled();

		act( () => {
			jest.advanceTimersByTime( 9999 );
		} );
		expect( onAutoDismiss ).not.toHaveBeenCalled();

		act( () => {
			jest.advanceTimersByTime( 1 );
		} );
		expect( onAutoDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'honors a custom autoDismissMS interval', () => {
		const onAutoDismiss = jest.fn();
		render(
			<PDFReportSuccessSnackbar
				autoDismissMS={ 3000 }
				onAutoDismiss={ onAutoDismiss }
			/>
		);

		act( () => {
			jest.advanceTimersByTime( 2999 );
		} );
		expect( onAutoDismiss ).not.toHaveBeenCalled();

		act( () => {
			jest.advanceTimersByTime( 1 );
		} );
		expect( onAutoDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not call onAutoDismiss when disableAutoDismiss is true', () => {
		const onAutoDismiss = jest.fn();
		render(
			<PDFReportSuccessSnackbar
				onAutoDismiss={ onAutoDismiss }
				disableAutoDismiss
			/>
		);

		act( () => {
			jest.advanceTimersByTime( 60000 );
		} );

		expect( onAutoDismiss ).not.toHaveBeenCalled();
	} );

	it( 'clears the auto-dismiss timer on unmount so onAutoDismiss does not fire late', () => {
		const onAutoDismiss = jest.fn();
		const { unmount } = render(
			<PDFReportSuccessSnackbar onAutoDismiss={ onAutoDismiss } />
		);

		unmount();

		act( () => {
			jest.advanceTimersByTime( 20000 );
		} );

		expect( onAutoDismiss ).not.toHaveBeenCalled();
	} );

	it( 'renders an overridden description in place of the default', () => {
		const { queryByText, getByText } = render(
			<PDFReportSuccessSnackbar
				description="Custom success description"
				disableAutoDismiss
			/>
		);

		expect( getByText( 'Custom success description' ) ).toBeInTheDocument();
		expect(
			queryByText( /automatically downloaded to your downloads folder/i )
		).not.toBeInTheDocument();
	} );
} );
