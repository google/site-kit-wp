/**
 * TextField component tests.
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
	const inputID = 'client-id';
	const errorMessageID = `${ inputID }-error-message`;

	const defaultProps = {
		id: inputID,
		label: 'Client ID',
		name: 'clientID',
	};

	it( 'shows the error outline, the warning icon, and the message under the field when `errorMessage` is set', () => {
		const { container } = render(
			<TextField
				{ ...defaultProps }
				errorMessage="A valid Client ID is required."
			/>
		);

		expect( container.querySelector( '.mdc-text-field' ) ).toHaveClass(
			'mdc-text-field--error'
		);
		expect(
			container.querySelector( '.googlesitekit-text-field-icon--error' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.mdc-text-field-helper-text' )
		).toHaveTextContent( 'A valid Client ID is required.' );
	} );

	it( 'marks the input invalid and points `aria-errormessage` and `aria-describedby` at the message when `errorMessage` is set', () => {
		const { getByRole, getByText } = render(
			<TextField
				{ ...defaultProps }
				errorMessage="A valid Client ID is required."
			/>
		);

		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-invalid',
			'true'
		);
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-errormessage',
			errorMessageID
		);
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-describedby',
			errorMessageID
		);
		expect( getByText( 'A valid Client ID is required.' ) ).toHaveAttribute(
			'id',
			errorMessageID
		);
	} );

	it( 'shows the error outline and the warning icon with no message when `hasError` is set on its own', () => {
		const { container, getByRole } = render(
			<TextField { ...defaultProps } hasError />
		);

		expect( container.querySelector( '.mdc-text-field' ) ).toHaveClass(
			'mdc-text-field--error'
		);
		expect(
			container.querySelector( '.googlesitekit-text-field-icon--error' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.mdc-text-field-helper-text' )
		).not.toBeInTheDocument();
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-invalid',
			'true'
		);
		expect( getByRole( 'textbox' ) ).not.toHaveAttribute(
			'aria-errormessage'
		);
	} );

	it( 'keeps the message off the screen when `hasError` and `errorMessage` are both set', () => {
		const { container, getByRole, getByText } = render(
			<TextField
				{ ...defaultProps }
				errorMessage="An account name is required."
				hasError
			/>
		);

		expect(
			container.querySelector( '.mdc-text-field-helper-text' )
		).not.toBeInTheDocument();

		const message = getByText( 'An account name is required.' );

		expect( message ).toHaveClass( 'screen-reader-text' );
		expect( message ).toHaveAttribute( 'id', errorMessageID );
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-errormessage',
			errorMessageID
		);
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-describedby',
			errorMessageID
		);
	} );

	it( 'shows `helperText` under the field with no error outline when neither error prop is set', () => {
		const { container, getByRole, getByText } = render(
			<TextField
				{ ...defaultProps }
				helperText="Find the Client ID in your Google Cloud console."
			/>
		);

		expect(
			getByText( 'Find the Client ID in your Google Cloud console.' )
		).toBeVisible();
		expect( container.querySelector( '.mdc-text-field' ) ).not.toHaveClass(
			'mdc-text-field--error'
		);
		expect(
			container.querySelector( '.googlesitekit-text-field-icon--error' )
		).not.toBeInTheDocument();
		expect( getByRole( 'textbox' ) ).not.toHaveAttribute( 'aria-invalid' );
		expect( getByRole( 'textbox' ) ).not.toHaveAttribute(
			'aria-describedby'
		);
	} );

	it( 'shows `errorMessage` in place of `helperText` when both are set', () => {
		const { container, queryByText } = render(
			<TextField
				{ ...defaultProps }
				helperText="Find the Client ID in your Google Cloud console."
				errorMessage="A valid Client ID is required."
			/>
		);

		expect(
			container.querySelector( '.mdc-text-field-helper-text' )
		).toHaveTextContent( 'A valid Client ID is required.' );
		expect(
			queryByText( 'Find the Client ID in your Google Cloud console.' )
		).not.toBeInTheDocument();
	} );

	it.each( [
		{
			errorPropName: 'errorMessage',
			errorProps: { errorMessage: 'A valid Client ID is required.' },
		},
		{ errorPropName: 'hasError', errorProps: { hasError: true } },
	] )(
		'shows the warning icon in place of `trailingIcon` when `$errorPropName` is set',
		( { errorProps } ) => {
			const { container } = render(
				<TextField
					{ ...defaultProps }
					{ ...errorProps }
					trailingIcon={
						<span className="googlesitekit-search-icon" />
					}
				/>
			);

			expect(
				container.querySelector(
					'.googlesitekit-text-field-icon--error'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector( '.googlesitekit-search-icon' )
			).not.toBeInTheDocument();
		}
	);

	it( 'shows `trailingIcon` when neither error prop is set', () => {
		const { container } = render(
			<TextField
				{ ...defaultProps }
				trailingIcon={ <span className="googlesitekit-search-icon" /> }
			/>
		);

		expect(
			container.querySelector( '.googlesitekit-search-icon' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-text-field-icon--error' )
		).not.toBeInTheDocument();
	} );
} );
