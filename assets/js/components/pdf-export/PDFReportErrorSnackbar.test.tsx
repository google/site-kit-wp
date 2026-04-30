/**
 * PDFReportErrorSnackbar component tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import Notice from '@/js/components/Notice';
import PDFReportErrorSnackbar from './PDFReportErrorSnackbar';
import {
	createTestRegistry,
	provideSiteInfo,
	render,
} from '../../../../tests/js/test-utils';

describe( 'PDFReportErrorSnackbar', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'renders default title and action labels', () => {
		const { getByText, getByRole } = render( <PDFReportErrorSnackbar />, {
			registry,
		} );

		expect( getByText( /There was a problem/i ) ).toBeInTheDocument();
		expect( getByRole( 'button', { name: /retry/i } ) ).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: /dismiss pdf report error/i } )
		).toBeInTheDocument();
	} );

	it( 'calls onRetry when Retry is clicked', () => {
		const onRetry = jest.fn();
		const { getByRole } = render(
			<PDFReportErrorSnackbar onRetry={ onRetry } />,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'button', { name: /retry/i } ) );
		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders help link to the PDF reporting doc by default', () => {
		const { getByRole } = render( <PDFReportErrorSnackbar />, {
			registry,
		} );

		const helpLink = getByRole( 'link', { name: /get help/i } );
		expect( helpLink.getAttribute( 'href' ) ).toContain(
			'doc=pdf-reporting'
		);
	} );

	it( 'calls onDismiss when close icon is clicked', () => {
		const onDismiss = jest.fn( ( event: MouseEvent< HTMLButtonElement > ) =>
			event.preventDefault()
		);
		const { getByRole } = render(
			<PDFReportErrorSnackbar onDismiss={ onDismiss } />,
			{
				registry,
			}
		);

		fireEvent.click(
			getByRole( 'button', { name: /dismiss pdf report error/i } )
		);
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders Retry CTA in tertiary mode and keeps default notice CTA behavior unchanged', () => {
		const { getByRole, rerender } = render( <PDFReportErrorSnackbar />, {
			registry,
		} );

		expect( getByRole( 'button', { name: /retry/i } ).className ).toContain(
			'mdc-button--tertiary'
		);

		rerender(
			<Notice
				title="Default CTA Notice"
				ctaButton={ {
					label: 'Take action',
					onClick: () => {},
				} }
			/>
		);

		expect(
			getByRole( 'button', { name: /take action/i } ).className
		).not.toContain( 'mdc-button--tertiary' );
	} );
} );
