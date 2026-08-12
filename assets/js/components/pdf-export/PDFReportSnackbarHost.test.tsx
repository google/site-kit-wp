/**
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
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
} from '@tests/js/test-utils';
import PDFReportSnackbarHost from './PDFReportSnackbarHost';

describe( 'PDFReportSnackbarHost', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'should render nothing when the status is idle', () => {
		const { container } = render( <PDFReportSnackbarHost />, { registry } );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render only the progress snackbar with progress scaled to 0..1 when the status is progress', () => {
		act( () => {
			registry.dispatch( CORE_PDF ).setStatus( 'progress' );
			registry.dispatch( CORE_PDF ).setProgress( 40 );
		} );

		const { container, getByText, queryByText } = render(
			<PDFReportSnackbarHost />,
			{ registry }
		);

		expect(
			getByText( /Generating your PDF report/i )
		).toBeInTheDocument();
		// Neither the success nor the error snackbar is rendered.
		expect(
			queryByText( /was generated successfully/i )
		).not.toBeInTheDocument();
		expect(
			queryByText( /problem generating your report/i )
		).not.toBeInTheDocument();

		// `getProgress()` is 40, so the component receives `40 / 100 = 0.4`,
		// which the progress bar renders as a 40% wide primary bar.
		const primaryBar = container.querySelector(
			'.mdc-linear-progress__primary-bar'
		);
		expect( primaryBar ).toHaveStyle( { width: '40%' } );
	} );

	it( 'should dispatch requestCancel when the progress snackbar Cancel button is clicked', () => {
		act( () => {
			registry.dispatch( CORE_PDF ).setStatus( 'progress' );
		} );

		const { getByRole } = render( <PDFReportSnackbarHost />, { registry } );

		expect( registry.select( CORE_PDF ).isCancelRequested() ).toBe( false );

		fireEvent.click( getByRole( 'button', { name: /cancel/i } ) );

		expect( registry.select( CORE_PDF ).isCancelRequested() ).toBe( true );
	} );

	it( 'should render only the success snackbar when the status is success', () => {
		act( () => {
			registry.dispatch( CORE_PDF ).setStatus( 'success' );
		} );

		const { getByText, queryByText } = render( <PDFReportSnackbarHost />, {
			registry,
		} );

		expect(
			getByText( /Your report was generated successfully/i )
		).toBeInTheDocument();
		expect(
			queryByText( /Generating your PDF report/i )
		).not.toBeInTheDocument();
		expect(
			queryByText( /problem generating your report/i )
		).not.toBeInTheDocument();
	} );

	it( 'should dispatch clearExport when the success snackbar is dismissed', () => {
		act( () => {
			registry.dispatch( CORE_PDF ).setStatus( 'success' );
		} );

		const { getByRole } = render( <PDFReportSnackbarHost />, { registry } );

		fireEvent.click(
			getByRole( 'button', { name: /dismiss pdf report success/i } )
		);

		// `clearExport()` resets the status back to `idle`.
		expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'idle' );
	} );

	it( 'should dispatch clearExport when the success snackbar auto-dismisses', () => {
		jest.useFakeTimers();

		act( () => {
			registry.dispatch( CORE_PDF ).setStatus( 'success' );
		} );

		render( <PDFReportSnackbarHost />, { registry } );

		expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );

		act( () => {
			jest.advanceTimersByTime( 10000 );
		} );

		expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'idle' );
	} );

	it( 'should re-download the existing blob from the success snackbar retry link without dispatching any store action', () => {
		act( () => {
			registry.dispatch( CORE_PDF ).setStatus( 'success' );
			registry.dispatch( CORE_PDF ).setBlob( {
				url: 'blob:https://example.com/report',
				filename: 'report.pdf',
			} );
		} );

		const { getByRole } = render( <PDFReportSnackbarHost />, { registry } );

		// Spy after render so only the transient anchor's lifecycle is observed.
		const clickSpy = jest
			.spyOn( global.HTMLAnchorElement.prototype, 'click' )
			.mockImplementation( () => {} );
		const appendSpy = jest.spyOn( global.document.body, 'appendChild' );
		const removeSpy = jest.spyOn( global.document.body, 'removeChild' );

		fireEvent.click(
			getByRole( 'link', { name: /download your report/i } )
		);

		// A transient anchor is created, clicked, and removed.
		expect( appendSpy ).toHaveBeenCalledTimes( 1 );
		expect( clickSpy ).toHaveBeenCalledTimes( 1 );
		expect( removeSpy ).toHaveBeenCalledTimes( 1 );

		const appendedNode = appendSpy.mock
			.calls[ 0 ][ 0 ] as HTMLAnchorElement;
		expect( appendedNode.tagName ).toBe( 'A' );
		expect( appendedNode.download ).toBe( 'report.pdf' );

		// The blob is reused; the export is not re-run and no store action is
		// dispatched, so the status remains `success` and the blob is intact.
		expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'success' );
		expect( registry.select( CORE_PDF ).getBlob() ).toEqual( {
			url: 'blob:https://example.com/report',
			filename: 'report.pdf',
		} );

		clickSpy.mockRestore();
		appendSpy.mockRestore();
		removeSpy.mockRestore();
	} );

	it( 'should render only the error snackbar when the status is error', () => {
		act( () => {
			registry.dispatch( CORE_PDF ).setStatus( 'error' );
		} );

		const { getByText, queryByText } = render( <PDFReportSnackbarHost />, {
			registry,
		} );

		expect(
			getByText( /There was a problem generating your report/i )
		).toBeInTheDocument();
		expect(
			queryByText( /Generating your PDF report/i )
		).not.toBeInTheDocument();
		expect(
			queryByText( /was generated successfully/i )
		).not.toBeInTheDocument();
	} );

	it( 'should dispatch clearExport when the error snackbar is dismissed', () => {
		act( () => {
			registry.dispatch( CORE_PDF ).setStatus( 'error' );
		} );

		const { getByRole } = render( <PDFReportSnackbarHost />, { registry } );

		fireEvent.click(
			getByRole( 'button', { name: /dismiss pdf report error/i } )
		);

		expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'idle' );
	} );

	it( 'should dispatch clearExport and invoke onRetry once without touching selection when the error snackbar Retry is clicked', () => {
		const onRetry = jest.fn();
		const selection = {
			contextSlugs: [ 'main-dashboard' ],
			widgetSlugs: [ 'summary' ],
		};

		act( () => {
			registry.dispatch( CORE_PDF ).setSelection( selection );
			registry.dispatch( CORE_PDF ).setStatus( 'error' );
		} );

		const { getByRole } = render(
			<PDFReportSnackbarHost onRetry={ onRetry } />,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: /retry/i } ) );

		// `clearExport()` returns the status to `idle`...
		expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'idle' );
		// ...the parent `onRetry` callback fires exactly once...
		expect( onRetry ).toHaveBeenCalledTimes( 1 );
		// ...and the selection is preserved across the retry.
		expect( registry.select( CORE_PDF ).getSelection() ).toEqual(
			selection
		);
	} );
} );
