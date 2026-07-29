/**
 * TextField tests.
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
import { render } from '@tests/js/test-utils';
import TextField from './TextField';

describe( 'TextField', () => {
	it( 'should show the message, add the error class and icon, and set `aria-invalid` and `aria-errormessage` when `errorMessage` is set', () => {
		const { container, getByText } = render(
			<TextField
				name="textfield"
				label="Text Field"
				errorMessage="This is the error message."
			/>
		);

		const input = container.querySelector( 'input' );
		const errorMessage = getByText( 'This is the error message.' );

		expect(
			container
				.querySelector( '.mdc-text-field' )
				?.classList.contains( 'mdc-text-field--error' )
		).toBe( true );

		expect(
			container.querySelector( '.googlesitekit-text-field-icon--error' )
		).toBeInTheDocument();

		expect( errorMessage ).toBeInTheDocument();

		expect( input ).toHaveAttribute( 'aria-invalid', 'true' );
		expect( input ).toHaveAttribute(
			'aria-errormessage',
			errorMessage.getAttribute( 'id' )
		);
	} );

	it( 'should add the error class and icon, and set `aria-invalid`, with no `aria-errormessage` when `hasError` is set without an accompanying message', () => {
		const { container } = render(
			// `hasError` without `errorMessage`/`ariaErrorMessage` is a type
			// error, enforced so screen reader users are never left without
			// an indication of what the error is. It's still reachable at
			// runtime from a plain JS caller, so the fallback rendering is
			// exercised here.
			// @ts-expect-error Intentionally violating the `hasError` invariant.
			<TextField name="textfield" label="Text Field" hasError />
		);

		const input = container.querySelector( 'input' );

		expect(
			container
				.querySelector( '.mdc-text-field' )
				?.classList.contains( 'mdc-text-field--error' )
		).toBe( true );

		expect(
			container.querySelector( '.googlesitekit-text-field-icon--error' )
		).toBeInTheDocument();

		expect(
			container.querySelector( '.mdc-text-field-helper-text' )
		).not.toBeInTheDocument();

		expect( input ).toHaveAttribute( 'aria-invalid', 'true' );
		expect( input ).not.toHaveAttribute( 'aria-errormessage' );
	} );

	it( 'should set `aria-errormessage` to the supplied `ariaErrorMessage` id when `hasError` is set', () => {
		const { container } = render(
			<TextField
				name="textfield"
				label="Text Field"
				ariaErrorMessage="external-error-message-id"
				hasError
			/>
		);

		const input = container.querySelector( 'input' );

		expect( input ).toHaveAttribute(
			'aria-errormessage',
			'external-error-message-id'
		);
	} );

	it( 'should have no error class, no icon, and no `aria-invalid` when the error props are not set', () => {
		const { container } = render(
			<TextField name="textfield" label="Text Field" />
		);

		const input = container.querySelector( 'input' );

		expect(
			container
				.querySelector( '.mdc-text-field' )
				?.classList.contains( 'mdc-text-field--error' )
		).toBe( false );

		expect(
			container.querySelector( '.googlesitekit-text-field-icon--error' )
		).not.toBeInTheDocument();

		expect( input ).not.toHaveAttribute( 'aria-invalid' );
	} );
} );
